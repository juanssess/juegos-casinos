/**
 * Evaluación de una ventana (un giro).
 *
 * Reglas implementadas (las clásicas de un slot de líneas):
 *  - Las líneas pagan de IZQUIERDA A DERECHA, desde el rodillo 1, consecutivas.
 *  - El WILD sustituye a todo menos al SCATTER.
 *  - Una línea llena de wilds paga como el símbolo más alto (sale gratis del
 *    algoritmo: probamos cada símbolo candidato y nos quedamos con el mejor).
 *  - Solo se paga el MEJOR premio por línea, no la suma.
 *  - El SCATTER paga en cualquier posición, sobre la apuesta TOTAL.
 *
 * Dos caminos a propósito:
 *  - `evaluate()` devuelve el detalle (lo que el cliente necesita para animar).
 *  - `evaluateTotal()` devuelve solo el número, sin asignar memoria. Es el que
 *    corre 10^8 veces en el simulador.
 */

import type { Grid, SlotGameDef, SpinEval, LineWin, ReelStrips } from './types.ts';
import { SYM, PAYING_SYMBOLS } from './types.ts';
import type { Rng } from './rng.ts';

/** Mínimo de símbolos consecutivos para que una línea pague. */
export const MIN_LINE_LENGTH = 3;

export interface Evaluator {
  /**
   * Gira los rodillos y escribe la ventana visible en `out`.
   *
   * Si se pasa `stops`, deja ahí la posición de parada de cada rodillo. Eso es
   * lo que hace la ronda reproducible: con las tiras y las paradas, cualquiera
   * puede recalcular el resultado exacto. Un laboratorio de certificación lo
   * pide, y sirve para resolver disputas con jugadores.
   */
  spin(strips: ReelStrips, rng: Rng, out: Grid, stops?: Int32Array): void;
  /**
   * Evaluación completa, con detalle de cada línea ganadora.
   *
   * `mults` es opcional: multiplicador por CELDA (para wilds multiplicadores
   * estilo Wanted). En una línea ganadora, los multiplicadores de los wilds
   * que la forman se MULTIPLICAN entre sí — esa es la mecánica que fabrica
   * los premios de cola larga. Sin `mults`, todo vale ×1 y no cuesta nada.
   */
  evaluate(grid: Grid, lineBet: number, totalBet: number, multiplier: number, mults?: Float64Array): SpinEval;
  /** Evaluación rápida: solo el total en créditos. Cero asignaciones. */
  evaluateTotal(grid: Grid, lineBet: number, totalBet: number, multiplier: number, mults?: Float64Array): number;
  /** Cantidad de scatters en la ventana. */
  countScatters(grid: Grid): number;
  /** Buffer de ventana reusable, del tamaño correcto para este juego. */
  newGrid(): Grid;
  /**
   * Cuenta combinaciones ganadoras SIN mirar la paytable de premios:
   * `out[symbol * tallyStride + count] += weight` por cada línea ganada.
   *
   * Esta es la pieza que permite tunear el juego sin re-simular: las
   * frecuencias dependen solo de las TIRAS, no de los pagos. Medís una vez,
   * y después resolvés la paytable con álgebra.
   *
   * El `weight` existe por la Escalinata: cada giro gratis pesa según el
   * multiplicador de su paquete, así el RTP sigue siendo lineal en los
   * premios aunque el multiplicador varíe por ronda.
   */
  tallyLineWins(grid: Grid, out: Float64Array, weight?: number, mults?: Float64Array): void;
  /** Ancho de fila de los arrays de tally: `reels + 1`. */
  tallyStride: number;
}

export function createEvaluator(game: SlotGameDef): Evaluator {
  const { reels, rows, paylines, paytable, scatterPaytable } = game;
  const cells = reels * rows;

  // Aplanamos las líneas a un Int8Array: paylinesFlat[line * reels + reel] = fila.
  const paylinesFlat = new Int8Array(paylines.length * reels);
  for (let l = 0; l < paylines.length; l++) {
    const line = paylines[l]!;
    if (line.length !== reels) {
      throw new Error(`La línea ${l} tiene ${line.length} posiciones, se esperaban ${reels}`);
    }
    for (let r = 0; r < reels; r++) paylinesFlat[l * reels + r] = line[r]!;
  }

  // Aplanamos la paytable: payFlat[symbol * (reels + 1) + count].
  const stride = reels + 1;
  const payFlat = new Float64Array(paytable.length * stride);
  for (let s = 0; s < paytable.length; s++) {
    const row = paytable[s];
    if (!row) continue;
    for (let c = 0; c < row.length && c <= reels; c++) payFlat[s * stride + c] = row[c]!;
  }

  const scatterPay = Float64Array.from(scatterPaytable);

  function countScatters(grid: Grid): number {
    let n = 0;
    for (let i = 0; i < cells; i++) if (grid[i] === SYM.SCATTER) n++;
    return n;
  }

  function spin(strips: ReelStrips, rng: Rng, out: Grid, stops?: Int32Array): void {
    for (let r = 0; r < reels; r++) {
      const strip = strips[r]!;
      const len = strip.length;
      // La posición de parada es lo ÚNICO que se sortea. Todo lo demás
      // (qué símbolos se ven) ya estaba decidido al armar la tira.
      const stop = rng.nextInt(len);
      if (stops) stops[r] = stop;
      const base = r * rows;
      for (let row = 0; row < rows; row++) {
        out[base + row] = strip[(stop + row) % len]!;
      }
    }
  }

  /**
   * Mejor premio de una línea. Devuelve el pago (en múltiplos de lineBet)
   * codificado junto con símbolo y cantidad para no asignar objetos:
   *   resultado = pago, y `lastSymbol` / `lastCount` quedan en los slots de scratch.
   */
  let lastSymbol = -1;
  let lastCount = 0;
  let lastMult = 1;

  function bestLinePay(grid: Grid, lineOffset: number, mults?: Float64Array): number {
    const first = grid[0 * rows + paylinesFlat[lineOffset]!]!;
    // El scatter nunca forma línea.
    if (first === SYM.SCATTER) return 0;

    let best = 0;
    lastSymbol = -1;
    lastCount = 0;
    lastMult = 1;

    // Si el primer símbolo no es wild, el único candidato posible es él mismo.
    // Si es wild, hay que probar todos (la línea podría continuar con cualquiera).
    const single = first !== SYM.WILD;
    const candCount = single ? 1 : PAYING_SYMBOLS.length;

    for (let ci = 0; ci < candCount; ci++) {
      const sym = single ? first : PAYING_SYMBOLS[ci]!;
      let count = 0;
      // Producto de los multiplicadores de los wilds que forman la línea.
      // Se acumula junto con el conteo: alargar la línea nunca puede bajar
      // el producto, así que el mejor conteo sigue siendo el más largo.
      let mult = 1;
      for (let r = 0; r < reels; r++) {
        const idx = r * rows + paylinesFlat[lineOffset + r]!;
        const cell = grid[idx]!;
        if (cell === sym || cell === SYM.WILD) {
          count++;
          if (mults && cell === SYM.WILD) mult *= mults[idx]!;
        } else break;
      }
      const pay = payFlat[sym * stride + count]! * mult;
      if (pay > best) {
        best = pay;
        lastSymbol = sym;
        lastCount = count;
        lastMult = mult;
      }
    }
    return best;
  }

  function evaluateTotal(
    grid: Grid,
    lineBet: number,
    totalBet: number,
    multiplier: number,
    mults?: Float64Array,
  ): number {
    let total = 0;
    for (let l = 0; l < paylines.length; l++) {
      const pay = bestLinePay(grid, l * reels, mults);
      if (pay > 0) total += pay * lineBet * multiplier;
    }
    const sc = countScatters(grid);
    if (sc < scatterPay.length) {
      const sp = scatterPay[sc]!;
      if (sp > 0) total += sp * totalBet;
    }
    return total;
  }

  function evaluate(
    grid: Grid,
    lineBet: number,
    totalBet: number,
    multiplier: number,
    mults?: Float64Array,
  ): SpinEval {
    const lineWins: LineWin[] = [];
    for (let l = 0; l < paylines.length; l++) {
      const pay = bestLinePay(grid, l * reels, mults);
      if (pay > 0) {
        lineWins.push({
          line: l,
          symbol: lastSymbol,
          count: lastCount,
          mult: lastMult,
          amount: pay * lineBet * multiplier,
        });
      }
    }
    lineWins.sort((a, b) => b.amount - a.amount);

    const scatterCount = countScatters(grid);
    const scatterWin =
      scatterCount < scatterPay.length ? scatterPay[scatterCount]! * totalBet : 0;

    let totalWin = scatterWin;
    for (const w of lineWins) totalWin += w.amount;

    return { lineWins, scatterCount, scatterWin, totalWin };
  }

  /**
   * Igual que `bestLinePay` pero sin consultar los premios: decide el símbolo
   * ganador por (mayor cantidad, y ante empate el símbolo de índice más bajo,
   * que es el que más paga en una paytable ordenada).
   *
   * Ojo con la sutileza: si el rodillo 1 puede traer WILD, esta regla no
   * siempre coincide con "el mejor pago" (W,W,W,L5 son 4 de L5 pero también
   * 3 de H1, y H1 puede pagar más). En ese caso el tuning hay que hacerlo
   * iterativo: medir → resolver → volver a medir. Converge en 2 o 3 vueltas.
   * En `classic20` no aplica: el rodillo 1 no tiene wilds, así que el símbolo
   * ganador es siempre el del primer rodillo y la medición es exacta.
   */
  function tallyLineWins(grid: Grid, out: Float64Array, weight = 1, mults?: Float64Array): void {
    for (let l = 0; l < paylines.length; l++) {
      const lineOffset = l * reels;
      const first = grid[0 * rows + paylinesFlat[lineOffset]!]!;
      if (first === SYM.SCATTER) continue;

      let bestSym = -1;
      let bestCount = 0;
      let bestMult = 1;
      const single = first !== SYM.WILD;
      const candCount = single ? 1 : PAYING_SYMBOLS.length;

      for (let ci = 0; ci < candCount; ci++) {
        const sym = single ? first : PAYING_SYMBOLS[ci]!;
        let count = 0;
        let mult = 1;
        for (let r = 0; r < reels; r++) {
          const idx = r * rows + paylinesFlat[lineOffset + r]!;
          const cell = grid[idx]!;
          if (cell === sym || cell === SYM.WILD) {
            count++;
            if (mults && cell === SYM.WILD) mult *= mults[idx]!;
          } else break;
        }
        if (count > bestCount) {
          bestCount = count;
          bestSym = sym;
          bestMult = mult;
        }
      }

      if (bestCount >= MIN_LINE_LENGTH && bestSym >= 0) {
        const i = bestSym * stride + bestCount;
        // El peso lleva el producto de multiplicadores de la línea: así el
        // RTP sigue siendo lineal en los premios aunque haya wilds ×N.
        out[i] = (out[i] ?? 0) + weight * bestMult;
      }
    }
  }

  return {
    spin,
    evaluate,
    evaluateTotal,
    countScatters,
    newGrid: () => new Int8Array(cells),
    tallyLineWins,
    tallyStride: stride,
  };
}
