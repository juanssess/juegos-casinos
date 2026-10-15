/**
 * HOLD & WIN: monedas que se quedan y re-giros.
 *
 * La mecánica más jugada del mercado que la casa no tenía. Es una familia,
 * no un juego: vive acá y no en un paquete para que `new-game` la use como
 * molde de muchos.
 *
 * Reglas:
 *  - Juego base de líneas, como cualquier otro. El lugar del SCATTER lo ocupa
 *    la MONEDA: no paga en el juego base, pero cada una trae un valor (en
 *    veces la apuesta total) o un jackpot.
 *  - Con `trigger` monedas o más en la pantalla arranca el Hold & Win: esas
 *    monedas quedan fijas y empiezan `respins` re-giros.
 *  - En cada re-giro, cada celda vacía puede recibir una moneda. Si cae al
 *    menos una, los re-giros vuelven a `respins`; si no, se descuenta uno.
 *  - Termina cuando se acaban los re-giros o se llena la pantalla. Llenarla
 *    suma el GRAND. Se cobra la suma de todas las monedas.
 *
 * El valor de las monedas del juego base viaja con la tira (`baseCoinValues`
 * alineado con `baseStrips`), como las bombas de El Kiosco: el giro base
 * sigue saliendo de cinco números. Las monedas de los re-giros se sortean.
 *
 * ORDEN DE SORTEOS (contrato de reproducibilidad, igual en play y playFast):
 *   1. Giro base: una parada por rodillo.
 *   2. Por cada re-giro, recorriendo las celdas vacías en orden ascendente:
 *      un sorteo "¿cae moneda?" (milésimas) y, si cae, un sorteo de su valor.
 *
 * Tope: el premio de la ronda se recorta en `maxWinX` veces la apuesta.
 */

import { SYM, type BonusVariant, type Grid, type ReelStrips, type SlotGameDef } from './types.ts';
import type { Rng } from './rng.ts';
import { createEvaluator } from './evaluate.ts';
import type { FastRound, RoundEngine, RoundResult, SpinRecord } from './round.ts';

export interface Jackpots {
  mini: number;
  minor: number;
  major: number;
  /** Se cobra al llenar la pantalla, además de las monedas. */
  grand: number;
}

export interface HoldWinRules {
  /** Monedas en el giro base para disparar. */
  trigger: number;
  /** Re-giros al empezar y cada vez que cae una moneda nueva. */
  respins: number;
  /** Valor de la moneda en cada posición de `baseStrips` (0 si no es moneda). */
  baseCoinValues: readonly (readonly number[])[];
  /** Ídem para `anteStrips`. */
  anteCoinValues?: readonly (readonly number[])[];
  /** Probabilidad, en milésimas, de que una celda vacía reciba moneda en un re-giro. */
  landPerMil: number;
  /** Valores de las monedas que caen en los re-giros: [valor en veces la apuesta, peso]. */
  respinValues: readonly (readonly [number, number])[];
  /** Los jackpots también son valores de moneda: Mini, Minor y Major caen como cualquier otra. */
  jackpots: Jackpots;
}

export interface HoldWinDef extends SlotGameDef {
  holdWin: HoldWinRules;
  maxWinX: number;
}

/** Lo que agrega un re-giro al registro de la ronda. */
export interface HoldRecord {
  /** Re-giros que quedan después de este. */
  left: number;
  /** Celdas donde cayó una moneda en este re-giro. */
  fresh: number[];
  /** Solo en el último: lo cobrado en la función (monedas + Grand), en créditos. */
  collect?: number;
  /** Solo si se llenó la pantalla: el Grand, en créditos. */
  grand?: number;
}

/** El valor de las monedas que muestra la ventana, a partir de las paradas. */
export function coinValuesAt(
  game: SlotGameDef,
  values: readonly (readonly number[])[],
  stops: ArrayLike<number>,
  out: Float64Array,
): void {
  const { reels, rows } = game;
  for (let r = 0; r < reels; r++) {
    const col = values[r]!;
    for (let row = 0; row < rows; row++) out[r * rows + row] = col[(stops[r]! + row) % col.length]!;
  }
}

export function createHoldWinEngine(game: HoldWinDef): RoundEngine {
  const rules = game.holdWin;
  const evaluator = createEvaluator(game);
  const cells = game.reels * game.rows;
  const lineCount = game.paylines.length;

  const totalWeight = rules.respinValues.reduce((a, [, w]) => a + w, 0);
  const drawValue = (rng: Rng): number => {
    let r = rng.nextInt(totalWeight);
    for (const [v, w] of rules.respinValues) {
      if (r < w) return v;
      r -= w;
    }
    return rules.respinValues[0]![0];
  };

  const stripsFor = (ante: boolean): { strips: ReelStrips; values: readonly (readonly number[])[] } =>
    ante && game.anteStrips && rules.anteCoinValues
      ? { strips: game.anteStrips, values: rules.anteCoinValues }
      : { strips: game.baseStrips, values: rules.baseCoinValues };

  /**
   * La función, desde las monedas del giro que disparó. Escribe en `held`
   * (veces la apuesta, 0 = vacía) y devuelve lo cobrado en veces la apuesta.
   * `onRespin` recibe cada re-giro, para el registro con detalle.
   */
  function runFeature(
    rng: Rng,
    held: Float64Array,
    onRespin?: (fresh: number[], left: number) => void,
  ): { coinsX: number; grandX: number; respins: number } {
    let left = rules.respins;
    let count = 0;
    for (let i = 0; i < cells; i++) if (held[i]! > 0) count++;
    let played = 0;
    while (left > 0 && count < cells) {
      played++;
      const fresh: number[] = [];
      let landed = 0;
      for (let i = 0; i < cells; i++) {
        if (held[i]! > 0) continue;
        if (rng.nextInt(1000) < rules.landPerMil) {
          held[i] = drawValue(rng);
          count++;
          landed++;
          if (onRespin) fresh.push(i);
        }
      }
      left = landed > 0 ? rules.respins : left - 1;
      if (count === cells) left = 0;
      onRespin?.(fresh, left);
    }
    let coinsX = 0;
    for (let i = 0; i < cells; i++) coinsX += held[i]!;
    return { coinsX, grandX: count === cells ? rules.jackpots.grand : 0, respins: played };
  }

  function playFrom(rng: Rng, bet: number, grid: Grid, stops: Int32Array, values: readonly (readonly number[])[]): RoundResult {
    const lineBet = bet / lineCount;
    const cap = game.maxWinX * bet;
    const baseEval = evaluator.evaluate(grid, lineBet, bet, 1);
    const coinVals = new Float64Array(cells);
    coinValuesAt(game, values, stops, coinVals);
    for (let i = 0; i < cells; i++) if (grid[i] !== SYM.SCATTER) coinVals[i] = 0;
    const triggered = baseEval.scatterCount >= rules.trigger;

    const base: SpinRecord = {
      grid: Array.from(grid),
      stops: Array.from(stops),
      mults: Array.from(coinVals),
      multiplier: 1,
      awarded: triggered ? rules.respins : 0,
      result: baseEval,
    };

    const free: SpinRecord[] = [];
    let featureWin = 0;
    if (triggered) {
      const held = Float64Array.from(coinVals);
      const { coinsX, grandX } = runFeature(rng, held, (fresh, left) => {
        const g = Array.from(held, (v) => (v > 0 ? SYM.SCATTER : -1));
        free.push({
          grid: g,
          stops: [],
          mults: Array.from(held),
          multiplier: 1,
          awarded: left,
          result: { ...baseEval, lineWins: [], scatterCount: 0, scatterWin: 0, totalWin: 0 },
          hold: { left, fresh },
        });
      });
      featureWin = Math.min((coinsX + grandX) * bet, Math.max(0, cap - baseEval.totalWin));
      const last = free[free.length - 1];
      if (last) last.hold = { ...last.hold!, collect: featureWin, ...(grandX ? { grand: grandX * bet } : {}) };
    }

    const baseWin = Math.min(baseEval.totalWin, cap);
    return { bet, base, free, baseWin, featureWin, totalWin: baseWin + featureWin, triggered };
  }

  function play(rng: Rng, bet: number, ante = false): RoundResult {
    const { strips, values } = stripsFor(ante);
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    evaluator.spin(strips, rng, grid, stops);
    return playFrom(rng, bet, grid, stops, values);
  }

  const fastGrid = evaluator.newGrid();
  const fastStops = new Int32Array(game.reels);
  const fastHeld = new Float64Array(cells);

  function playFast(rng: Rng, bet: number, out: FastRound, ante = false): void {
    const { strips, values } = stripsFor(ante);
    const cap = game.maxWinX * bet;
    evaluator.spin(strips, rng, fastGrid, fastStops);
    const baseWin = Math.min(evaluator.evaluateTotal(fastGrid, bet / lineCount, bet, 1), cap);
    const triggered = evaluator.countScatters(fastGrid) >= rules.trigger;
    let featureWin = 0;
    let played = 0;
    if (triggered) {
      coinValuesAt(game, values, fastStops, fastHeld);
      for (let i = 0; i < cells; i++) if (fastGrid[i] !== SYM.SCATTER) fastHeld[i] = 0;
      const r = runFeature(rng, fastHeld);
      played = r.respins;
      featureWin = Math.min((r.coinsX + r.grandX) * bet, Math.max(0, cap - baseWin));
    }
    out.baseWin = baseWin;
    out.featureWin = featureWin;
    out.totalWin = baseWin + featureWin;
    out.triggered = triggered;
    out.freeSpinsPlayed = played;
    out.tier = 0;
  }

  function playBonus(rng: Rng, bet: number, _variant?: BonusVariant): RoundResult {
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    // Rechazo SOLO sobre el giro base: estadísticamente idéntico a rechazar
    // rondas enteras, y el comprador recibe lo mismo que quien disparó solo.
    for (let i = 0; i < 10_000_000; i++) {
      evaluator.spin(game.baseStrips, rng, grid, stops);
      if (evaluator.countScatters(grid) >= rules.trigger) return playFrom(rng, bet, grid, stops, rules.baseCoinValues);
    }
    throw new Error('playBonus: no salió un disparo en 10^7 intentos — revisar las tiras');
  }

  return { game, evaluator, play, playFast, playBonus };
}

/**
 * Lo que vale la función en promedio, en veces la apuesta y por ronda: la
 * parte del RTP que NO depende de la tabla de pagos. El solver la suma como
 * un pago fijo y ajusta las líneas para el resto.
 */
export function holdWinFixedRtp(game: HoldWinDef, rounds: number, rng: Rng): number {
  const engine = createHoldWinEngine({ ...game, paytable: game.paytable.map((r) => r.map(() => 0)) });
  const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  const bet = game.paylines.length;
  let sum = 0;
  for (let i = 0; i < rounds; i++) {
    engine.playFast(rng, bet, out);
    sum += out.featureWin;
  }
  return sum / (rounds * bet);
}

/**
 * Tiras de Hold & Win: las de líneas, con PILAS de monedas insertadas.
 *
 * El armador común reparte los scatters espaciados, uno por zona, para que
 * en un juego de líneas nunca haya dos en el mismo rodillo a la vista. Acá
 * eso haría imposible la función: con a lo sumo una moneda por rodillo no se
 * juntan seis en cinco rodillos. Las monedas tienen que poder caer de a dos y
 * de a tres, y el tamaño de las pilas es lo que regula cada cuánto dispara.
 *
 * `stacks[r]` es la lista de pilas del rodillo r (por ejemplo [3, 2, 1, 1]);
 * cada pila se inserta en un lugar repartido de la tira, con algo de azar.
 */
export function insertCoinStacks(strips: ReelStrips, stacks: readonly (readonly number[])[], rng: Rng): ReelStrips {
  return strips.map((strip, r) => {
    const piles = [...(stacks[r] ?? [])];
    // Orden de las pilas al azar: que la grande no caiga siempre en el mismo lugar.
    for (let i = piles.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [piles[i], piles[j]] = [piles[j]!, piles[i]!];
    }
    const out: number[] = [];
    const segment = strip.length / Math.max(1, piles.length);
    let next = 0;
    for (let i = 0; i < strip.length; i++) {
      out.push(strip[i]!);
      while (next < piles.length && i >= Math.floor(next * segment + segment / 2)) {
        for (let k = 0; k < piles[next]!; k++) out.push(SYM.SCATTER);
        next++;
      }
    }
    return out;
  });
}
