/**
 * Motor de ronda de Se Busca.
 *
 * Es la primera mecánica que el motor genérico de líneas no cubre: los giros
 * gratis tienen ESTADO (los wilds pegajosos persisten entre giros). Por eso
 * el juego trae su propio motor, que implementa la misma interfaz
 * `RoundEngine` — para el RGS, el simulador y el cliente es indistinguible.
 *
 * ORDEN DE SORTEOS (contrato de reproducibilidad, igual en play/playFast y
 * en measure.ts — la validación cruzada lo verifica):
 *   1. Giro base: 5 paradas. (Los wilds del base valen ×1: sin sorteo.)
 *   2. Por cada giro gratis: 5 paradas, y después UN sorteo de multiplicador
 *      por cada wild NUEVO, recorriendo las celdas en orden ascendente.
 *
 * Reglas de los pegajosos:
 *  - Un wild que cae en celda libre sortea su multiplicador y queda pegado
 *    hasta el final de la feature.
 *  - Una celda pegajosa muestra SIEMPRE el wild: lo que la tira ponga ahí
 *    (incluso un scatter) queda tapado. Es parte de las reglas, no un bug.
 *  - Un wild que cae SOBRE una celda ya pegajosa no existe (no re-sortea).
 *
 * Tope de premio: al alcanzar `maxWinX`, el premio se recorta y la ronda
 * termina ahí mismo, giros restantes incluidos. Es lo que hace asegurable
 * la cola de multiplicadores compuestos.
 */

import {
  SYM,
  createEvaluator,
  type BonusVariant,
  type FastRound,
  type Grid,
  type Rng,
  type RoundEngine,
  type RoundResult,
  type SpinRecord,
} from '@casino/math';
import type { SebuscaDef } from './index.ts';

export function createSebuscaEngine(game: SebuscaDef): RoundEngine {
  const evaluator = createEvaluator(game);
  const cells = game.reels * game.rows;
  const lineCount = game.paylines.length;

  // Tabla acumulada del sorteo de multiplicador, en milésimas.
  const multCum: { upTo: number; mult: number }[] = [];
  {
    let acc = 0;
    for (const w of game.wildMultsFree) {
      acc += w.perMil;
      multCum.push({ upTo: acc, mult: w.mult });
    }
    if (acc !== 1000) {
      throw new Error(`wildMultsFree debe sumar 1000 milésimas (suma ${acc})`);
    }
  }

  function drawMult(rng: Rng): number {
    const r = rng.nextInt(1000);
    for (const e of multCum) if (r < e.upTo) return e.mult;
    return multCum[multCum.length - 1]!.mult;
  }

  // Buffers reusados por playFast.
  const fastGrid = evaluator.newGrid();
  const fastMults = new Float64Array(cells);
  const fastSticky = new Float64Array(cells);

  function play(rng: Rng, bet: number, ante = false): RoundResult {
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    evaluator.spin(ante && game.anteStrips ? game.anteStrips : game.baseStrips, rng, grid, stops);
    return playFrom(rng, bet, grid, stops);
  }

  /**
   * Completa una ronda a partir de un giro base YA tirado.
   *
   * Separarlo de `play` es lo que hace viable la compra del bonus: el rechazo
   * puede re-tirar solo el giro base (barato, sin asignar nada) en vez de
   * rondas enteras.
   */
  function playFrom(
    rng: Rng,
    bet: number,
    grid: Grid,
    stops: Int32Array,
    variant?: BonusVariant,
  ): RoundResult {
    const lineBet = bet / lineCount;
    const cap = game.maxWinX * bet;
    const baseEval = evaluator.evaluate(grid, lineBet, bet, 1);
    const triggered = baseEval.scatterCount >= game.scattersToTrigger;

    const base: SpinRecord = {
      grid: Array.from(grid),
      stops: Array.from(stops),
      multiplier: 1,
      awarded: triggered ? game.freeSpinsAwarded + (variant?.extraSpins ?? 0) : 0,
      result: baseEval,
    };

    const free: SpinRecord[] = [];
    let featureWin = 0;
    let capped = false;

    if (triggered) {
      const sticky = new Float64Array(cells);
      let remaining = game.freeSpinsAwarded + (variant?.extraSpins ?? 0);
      let played = 0;

      while (remaining > 0 && played < game.maxFreeSpins && !capped) {
        remaining--;
        played++;

        evaluator.spin(game.freeStrips, rng, grid, stops);

        // Pegajosos primero, wilds nuevos después, en orden de celda.
        const mults = new Float64Array(cells).fill(1);
        for (let i = 0; i < cells; i++) {
          if (sticky[i]! > 0) {
            grid[i] = SYM.WILD;
            mults[i] = sticky[i]!;
          } else if (grid[i] === SYM.WILD) {
            const m = drawMult(rng);
            sticky[i] = m;
            mults[i] = m;
          }
        }

        const ev = evaluator.evaluate(grid, lineBet, bet, 1, mults);

        let awarded = 0;
        if (ev.scatterCount >= game.scattersToTrigger) {
          awarded = game.freeSpinsRetrigger;
          remaining += awarded;
        }

        let spinWin = ev.totalWin - ev.scatterWin;

        // Tope: recortamos ESTE giro y cerramos la feature.
        if (base.result.totalWin + featureWin + spinWin >= cap) {
          spinWin = cap - base.result.totalWin - featureWin;
          capped = true;
        }
        featureWin += spinWin;

        free.push({
          grid: Array.from(grid),
          stops: Array.from(stops),
          mults: Array.from(mults),
          multiplier: 1,
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
      baseWin,
      featureWin,
      totalWin: baseWin + featureWin,
      triggered,
    };
  }

  function playFast(rng: Rng, bet: number, out: FastRound, ante = false): void {
    const lineBet = bet / lineCount;
    const cap = game.maxWinX * bet;

    evaluator.spin(ante && game.anteStrips ? game.anteStrips : game.baseStrips, rng, fastGrid);
    const baseWin = evaluator.evaluateTotal(fastGrid, lineBet, bet, 1);
    const triggered = evaluator.countScatters(fastGrid) >= game.scattersToTrigger;

    let featureWin = 0;
    let played = 0;

    if (triggered) {
      fastSticky.fill(0);
      let remaining = game.freeSpinsAwarded;
      let capped = false;

      while (remaining > 0 && played < game.maxFreeSpins && !capped) {
        remaining--;
        played++;

        evaluator.spin(game.freeStrips, rng, fastGrid);
        fastMults.fill(1);
        for (let i = 0; i < cells; i++) {
          if (fastSticky[i]! > 0) {
            fastGrid[i] = SYM.WILD;
            fastMults[i] = fastSticky[i]!;
          } else if (fastGrid[i] === SYM.WILD) {
            const m = drawMult(rng);
            fastSticky[i] = m;
            fastMults[i] = m;
          }
        }

        // totalBet = 0: el scatter no paga dentro de la feature, solo retriggea.
        let spinWin = evaluator.evaluateTotal(fastGrid, lineBet, 0, 1, fastMults);
        if (evaluator.countScatters(fastGrid) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }

        if (baseWin + featureWin + spinWin >= cap) {
          spinWin = cap - baseWin - featureWin;
          capped = true;
        }
        featureWin += spinWin;
      }
    }

    out.baseWin = baseWin;
    out.featureWin = featureWin;
    out.totalWin = baseWin + featureWin;
    out.triggered = triggered;
    out.freeSpinsPlayed = played;
    out.tier = 0;
  }

  function playBonus(rng: Rng, bet: number, variant?: BonusVariant): RoundResult {
    const grid = evaluator.newGrid();
    const stops = new Int32Array(game.reels);
    // Rechazo SOLO sobre el giro base. Es estadísticamente idéntico a
    // rechazar rondas completas —una ronda que no dispara consume
    // exactamente los sorteos de su giro base y nada más— pero acá no se
    // asigna un solo objeto por intento fallido.
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
