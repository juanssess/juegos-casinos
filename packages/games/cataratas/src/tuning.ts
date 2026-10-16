/**
 * Objetivos de diseño de Las Cataratas.
 *
 * Igual que en los otros juegos: este archivo es la INTENCIÓN, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra, en múltiplos de la apuesta, recalibrado con la tabla.
 * El QA completo mide de nuevo su valor esperado y su retorno antes de publicar.
 */
export const BONUS_BUY_X = 129.2;

/**
 * APUESTA ANTE: cuatro medallones en cada columna en vez de cuatro y tres.
 *
 * MEDICIÓN — retorno bruto sobre la apuesta base (20M de rondas cada una):
 *   medallones [5,3,4,3,5,3]  → 108,1 %, función 1/243, precio justo 1,12×
 *   medallones [4,4,4,3,4,4]  → 111,9 %, 1/231, precio justo 1,16×
 *   medallones [5,3,5,3,5,3]  → 114,7 %, 1/210, precio justo 1,19×
 *   medallones [4,4,4,4,4,4]  → 121,1 %, 1/196, precio justo 1,25×  <- elegida
 */
export const ANTE_COST_X = 1.25;
export const ANTE_SCATTERS: readonly number[] = [4, 4, 4, 4, 4, 4];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Garganta del Diablo', desc: '12 giros gratis: cada cascada suma uno al multiplicador', priceX: BONUS_BUY_X },
] as const;

/**
 * Altura de cada columna: [símbolos a la vista, peso]. La del medio es la
 * más común; siete en las seis columnas (117.649 caminos) es la jugada rara
 * que se celebra.
 */
export const HEIGHT_WEIGHTS: readonly (readonly [number, number])[] = [
  [2, 10], [3, 22], [4, 26], [5, 22], [6, 13], [7, 7],
];

/** Reparto del RTP por símbolo. */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 7,
  [SYM.H2]: 8,
  [SYM.H3]: 9,
  [SYM.H4]: 10,
  [SYM.L1]: 12,
  [SYM.L2]: 13,
  [SYM.L3]: 14,
  [SYM.L4]: 16,
  [SYM.L5]: 18,
};

/** Forma de cada fila: relación entre 3, 4, 5 y 6 columnas. */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [1, 2.5, 7.5, 25],
  [SYM.H2]: [1, 2.5, 8, 25],
  [SYM.H3]: [1, 2, 6, 20],
  [SYM.H4]: [1, 2, 5, 18],
  [SYM.L1]: [1, 2, 5, 20],
  [SYM.L2]: [1, 1.5, 4, 15],
  [SYM.L3]: [1, 2, 5, 20],
  [SYM.L4]: [1, 2, 5, 20],
  [SYM.L5]: [1, 2, 4, 15],
};
