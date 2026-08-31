/**
 * Objetivos de diseño de Se Busca.
 *
 * Igual que en classic20: este archivo es la intención, tools/tune.ts mide y
 * resuelve, y la paytable de index.ts es el resultado.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra del bonus, en múltiplos de la apuesta.
 *
 * Medido con `node tools/buyprice.ts --game sebusca --rounds 2e6`:
 * EV de la compra = 145,24× ± 0,77 (95% conf.).
 *
 * A 151× el RTP de la compra es 96,19%, apenas POR DEBAJO del 96,44% del
 * juego. Es a propósito: si la compra pagara mejor que el juego base,
 * comprar sería estrategia dominante y nadie giraría normal. El cuarto de
 * punto es la prima por saltarse la espera.
 *
 * Re-medir y re-fijar si cambian tiras, paytable o tabla de multiplicadores.
 */
export const BONUS_BUY_X = 151;

/**
 * Reparto del RTP de líneas por símbolo. MUY top-heavy: en un juego de
 * volatilidad extrema los bajos son relleno y el jugador persigue al
 * forajido (H1).
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 24,
  [SYM.H2]: 15,
  [SYM.H3]: 11,
  [SYM.H4]: 9,
  [SYM.L1]: 10,
  [SYM.L2]: 9,
  [SYM.L3]: 8,
  [SYM.L4]: 7,
  [SYM.L5]: 7,
};

/**
 * Forma de cada fila (relación 3-4-5). Los altos con cola empinada:
 * el 5-en-línea del forajido tiene que ser un evento aun sin multiplicadores.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [0, 0, 0, 1, 7, 50],
  [SYM.H2]: [0, 0, 0, 1, 6, 30],
  [SYM.H3]: [0, 0, 0, 1, 5, 20],
  [SYM.H4]: [0, 0, 0, 1, 4, 15],
  [SYM.L1]: [0, 0, 0, 1, 4, 12],
  [SYM.L2]: [0, 0, 0, 1, 3, 10],
  [SYM.L3]: [0, 0, 0, 1, 3, 10],
  [SYM.L4]: [0, 0, 0, 1, 3, 9],
  [SYM.L5]: [0, 0, 0, 1, 3, 8],
};
