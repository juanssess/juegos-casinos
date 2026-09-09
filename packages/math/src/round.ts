/**
 * Ronda completa.
 *
 * DECISIÓN DE ARQUITECTURA IMPORTANTE: una ronda se resuelve ENTERA de una vez,
 * en el servidor, incluidos todos los giros gratis. El cliente recibe el
 * resultado completo y lo único que hace es reproducirlo con animaciones.
 *
 * Por qué:
 *  - El cliente nunca decide nada → no hay nada que hackear.
 *  - Si el jugador cierra el navegador en el giro gratis 4 de 10, la ronda ya
 *    existe en la base: al volver, se retoma exactamente donde estaba.
 *  - Un laboratorio de certificación puede reproducir cualquier ronda a partir
 *    de la semilla y verificar el resultado.
 */

import type { ClimbResult, Grid, SlotGameDef, SpinEval,
  BonusVariant,
} from './types.ts';
import type { Rng } from './rng.ts';
import { createEvaluator, type Evaluator } from './evaluate.ts';

/**
 * Resuelve la Escalinata. Un sorteo entero por escalón, en orden fijo:
 * ese orden es parte del contrato de reproducibilidad — el simulador, el
 * medidor de frecuencias y el juego real DEBEN consumir el RNG igual.
 */
export function resolveClimb(game: SlotGameDef, rng: Rng, minTier = 1): ClimbResult {
  const climb = game.climb!;
  const ascents: boolean[] = [];
  let tier = 1;
  for (const odds of climb.ascendPerMil) {
    const up = rng.nextInt(1000) < odds;
    ascents.push(up);
    if (!up) break;
    tier++;
  }

  /* Piso garantizado, para las variantes de compra.
     Se sortea la escalada COMPLETA igual y recién después se levanta el
     resultado si quedó por debajo. Podría parecer desperdicio sortear algo
     que se va a pisar, pero no lo es: mantiene idéntico el consumo del RNG
     entre una ronda normal y una comprada, y eso es lo que permite que el
     cliente reproduzca cualquier ronda con la misma semilla. Cortar el
     sorteo cambiaría la secuencia y rompería esa propiedad. */
  if (minTier > tier) tier = Math.min(minTier, climb.tiers.length);

  const pkg = climb.tiers[tier - 1]!;
  return { ascents, tier, spins: pkg.spins, multiplier: pkg.multiplier };
}

export interface SpinRecord {
  /** Copia de la ventana visible (plana: reel * rows + row). */
  grid: number[];
  /** Posición de parada de cada rodillo. Con esto la ronda es reproducible. */
  stops: number[];
  /** Multiplicador por celda (wilds ×N). Ausente = todo ×1. */
  mults?: number[];
  /** Multiplicador aplicado a los wins de línea en este giro. */
  multiplier: number;
  /** Giros gratis que otorgó este giro (0 si no disparó ni retriggeó). */
  awarded: number;
  result: SpinEval;
  /**
   * Cascadas posteriores a la caída inicial, en juegos de racimos.
   *
   * La caída inicial es `grid` + `result`; cada entrada de acá es una
   * cascada más. El premio del giro es la suma de todas.
   */
  tumbles?: readonly {
    grid: number[];
    result: SpinEval;
    multiplier: number;
    win: number;
  }[];
}

export interface RoundResult {
  /** Apuesta total en créditos. */
  bet: number;
  base: SpinRecord;
  free: SpinRecord[];
  /** Escalada, si el juego la tiene y la ronda disparó. */
  climb?: ClimbResult;
  /** Ganado en el juego base. */
  baseWin: number;
  /** Ganado dentro de la feature. */
  featureWin: number;
  totalWin: number;
  triggered: boolean;
}

/** Resultado mínimo para el simulador: sin objetos, sin copias de grilla. */
export interface FastRound {
  baseWin: number;
  featureWin: number;
  totalWin: number;
  triggered: boolean;
  freeSpinsPlayed: number;
  /** Nivel de la escalinata alcanzado (0 = no disparó o sin escalinata). */
  tier: number;
}

export interface RoundEngine {
  game: SlotGameDef;
  /**
   * Evaluador de líneas. Opcional porque un juego de racimos no tiene
   * líneas que evaluar y su motor no puede fabricar uno de mentira.
   */
  evaluator?: Evaluator;
  /** Ronda completa con todo el detalle, para jugar de verdad. */
  play(rng: Rng, bet: number, ante?: boolean): RoundResult;
  /** Ronda sin detalle, para simular. Reusa un único buffer interno. */
  playFast(rng: Rng, bet: number, out: FastRound, ante?: boolean): void;
  /**
   * Compra del bonus: una ronda garantizada con feature.
   *
   * Muestreo por rechazo: re-tira el giro base hasta que dispare. Eso da
   * EXACTAMENTE la distribución condicional al disparo — el comprador recibe
   * lo mismo que alguien que disparó de forma natural, incluidos los premios
   * del giro que disparó. Es la forma honesta y auditable de implementarlo:
   * el precio justo sale de medir E[premio | disparo] en el simulador.
   */
  playBonus(rng: Rng, bet: number, variant?: BonusVariant): RoundResult;
}

export function createRoundEngine(game: SlotGameDef): RoundEngine {
  const evaluator = createEvaluator(game);
  const lineCount = game.paylines.length;
  const scratch: Grid = evaluator.newGrid();

  function lineBetOf(bet: number): number {
    return bet / lineCount;
  }

  /**
   * Una ronda. Con `ante` usa las tiras de apuesta ante, que traen más
   * scatters; el costo extra lo cobra quien llama, no el motor.
   */
  function play(rng: Rng, bet: number, ante = false): RoundResult {
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    const strips = ante && game.anteStrips ? game.anteStrips : game.baseStrips;
    evaluator.spin(strips, rng, grid, stops);
    return playFrom(rng, bet, grid, stops);
  }

  /**
   * Completa una ronda a partir de un giro base YA tirado. Existe para que la
   * compra del bonus pueda rechazar solo el giro base, sin asignar nada por
   * cada intento fallido (son ~200 por compra).
   */
  function playFrom(
    rng: Rng,
    bet: number,
    grid: Grid,
    stops: Int32Array,
    variant?: BonusVariant,
  ): RoundResult {
    const lineBet = lineBetOf(bet);
    const baseEval = evaluator.evaluate(grid, lineBet, bet, 1);
    const triggered = baseEval.scatterCount >= game.scattersToTrigger;

    // La escalada se resuelve ANTES de los giros gratis, y solo si disparó.
    let climb: ClimbResult | undefined;
    let spinsAwarded = game.freeSpinsAwarded;
    let multiplier = game.freeSpinMultiplier;
    if (triggered && game.climb) {
      climb = resolveClimb(game, rng, variant?.minTier ?? 1);
      spinsAwarded = climb.spins;
      multiplier = climb.multiplier;
    }
    if (variant?.extraSpins) spinsAwarded += variant.extraSpins;
    if (variant?.minMultiplier && variant.minMultiplier > multiplier) {
      multiplier = variant.minMultiplier;
    }

    const base: SpinRecord = {
      grid: Array.from(grid),
      stops: Array.from(stops),
      multiplier: 1,
      awarded: triggered ? spinsAwarded : 0,
      result: baseEval,
    };

    const free: SpinRecord[] = [];
    let featureWin = 0;

    if (triggered) {
      let remaining = spinsAwarded;
      let played = 0;

      while (remaining > 0 && played < game.maxFreeSpins) {
        remaining--;
        played++;

        evaluator.spin(game.freeStrips, rng, grid, stops);
        const ev = evaluator.evaluate(grid, lineBet, bet, multiplier);

        // Retrigger: los scatters durante la feature suman giros pero no repagan.
        let awarded = 0;
        if (ev.scatterCount >= game.scattersToTrigger) {
          awarded = game.freeSpinsRetrigger;
          remaining += awarded;
        }
        const spinWin = ev.totalWin - ev.scatterWin;
        featureWin += spinWin;

        free.push({
          grid: Array.from(grid),
          stops: Array.from(stops),
          multiplier,
          awarded,
          result: { ...ev, scatterWin: 0, totalWin: spinWin },
        });
      }
    }

    const baseWin = baseEval.totalWin;
    return {
      bet,
      base,
      free,
      ...(climb ? { climb } : {}),
      baseWin,
      featureWin,
      totalWin: baseWin + featureWin,
      triggered,
    };
  }

  function playFast(rng: Rng, bet: number, out: FastRound, ante = false): void {
    const lineBet = lineBetOf(bet);

    evaluator.spin(ante && game.anteStrips ? game.anteStrips : game.baseStrips, rng, scratch);
    const baseWin = evaluator.evaluateTotal(scratch, lineBet, bet, 1);
    const scatters = evaluator.countScatters(scratch);
    const triggered = scatters >= game.scattersToTrigger;

    let featureWin = 0;
    let played = 0;
    let tier = 0;

    if (triggered) {
      let remaining = game.freeSpinsAwarded;
      let multiplier = game.freeSpinMultiplier;
      if (game.climb) {
        // MISMO orden de sorteos que play(): base → escalada → giros gratis.
        const climb = resolveClimb(game, rng);
        remaining = climb.spins;
        multiplier = climb.multiplier;
        tier = climb.tier;
      }
      while (remaining > 0 && played < game.maxFreeSpins) {
        remaining--;
        played++;
        evaluator.spin(game.freeStrips, rng, scratch);
        // Pasamos totalBet = 0 para que el scatter no pague dentro de la feature;
        // los scatters ahí solo retriggean.
        featureWin += evaluator.evaluateTotal(scratch, lineBet, 0, multiplier);
        if (evaluator.countScatters(scratch) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }
      }
    }

    out.baseWin = baseWin;
    out.featureWin = featureWin;
    out.totalWin = baseWin + featureWin;
    out.triggered = triggered;
    out.freeSpinsPlayed = played;
    out.tier = tier;
  }

  /**
   * Una ronda con la feature garantizada: exactamente lo que recibe quien
   * compra. `variant` fuerza además la condición del paquete comprado.
   */
  function playBonus(rng: Rng, bet: number, variant?: BonusVariant): RoundResult {
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    // Rechazo SOLO sobre el giro base: es idéntico en distribución a rechazar
    // rondas completas (una ronda que no dispara consume exactamente los
    // sorteos de su giro base), pero sin asignar nada por intento fallido.
    for (let i = 0; i < 10_000_000; i++) {
      evaluator.spin(game.baseStrips, rng, grid, stops);
      if (evaluator.countScatters(grid) >= game.scattersToTrigger) {
        return playFrom(rng, bet, grid, stops, variant);
      }
    }
    throw new Error('playBonus: no salió un disparo en 10^7 intentos — revisar las tiras');
  }

  return { game, evaluator, play, playFast, playBonus };
}
