/**
 * Objetivos de diseño de Las Dunas.
 *
 * Igual que en los otros juegos: este archivo es la intención, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el resultado. Para el RTP
 * manda el QA (el solver no ve el tope).
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra del bonus, en múltiplos de la apuesta. MEDIDO con el
 * QA (2M de compras): EV 56,60× ± 0,13 → a 58,6× el RTP de la compra es
 * 96,6 %. Con decimal par: las apuestas son múltiplos de 15 y 15 × 58,6 da
 * créditos enteros (con 58,5 daba 877,5 y había que redondear).
 */
export const BONUS_BUY_X = 58.6;

/**
 * APUESTA ANTE: una bandera más en los rodillos 1 y 5.
 *
 * MEDICIÓN (QA rápido, 10M de rondas de ante): a 1,5× el RTP del ante daba
 * 91,1 %, o sea un retorno bruto de 136,6 % sobre la apuesta base; contra el
 * 96,8 % del juego normal el precio justo sale 1,41×. El QA completo lo
 * confirmó: 96,91 % ± 0,09, +0,32 contra el juego normal.
 */
export const ANTE_COST_X = 1.41;
export const ANTE_SCATTERS: readonly number[] = [2, 1, 2, 1, 2];

/**
 * Variantes de compra: giros. Con pegajosos cada giro extra vale más que el
 * anterior, así que los precios se miden, no se calculan.
 *
 * MEDICIÓN — QA, 2M de compras por variante:
 *   simple   8 giros    EV  56,60× ± 0,13   →  58,6×
 *   larga   12 giros    EV 160,32× ± 0,30   →  166×  (RTP 96,58 %)
 *
 * El triple de precio por la mitad más de giros: es lo mismo que en Se
 * Busca, más suave porque acá los multiplicadores cortan en ×5.
 */
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Travesía', desc: '8 giros con pilotos pegajosos', priceX: BONUS_BUY_X },
  { id: 'larga', label: 'Travesía larga', desc: '12 giros: más tiempo para que se planten', extraSpins: 4, priceX: 166 },
] as const;

/**
 * Reparto del RTP de líneas por símbolo. Bastante más PLANO que en Se Busca:
 * en un juego de volatilidad media los bajos pagan seguido y sostienen la
 * sesión; la moto (H1) sigue siendo la que se persigue, sin acaparar.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 15,
  [SYM.H2]: 12,
  [SYM.H3]: 11,
  [SYM.H4]: 10,
  [SYM.L1]: 11,
  [SYM.L2]: 11,
  [SYM.L3]: 10,
  [SYM.L4]: 10,
  [SYM.L5]: 10,
};

/**
 * Forma de cada fila (relación 3-4-5). Menos empinada que en Se Busca: el
 * 3-en-línea ya se siente y el 5 es un premio, no la lotería.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [0, 0, 0, 1, 3, 10],
  [SYM.H2]: [0, 0, 0, 1, 3, 8],
  [SYM.H3]: [0, 0, 0, 1, 2.5, 7],
  [SYM.H4]: [0, 0, 0, 1, 2.5, 6],
  [SYM.L1]: [0, 0, 0, 1, 2.5, 5],
  [SYM.L2]: [0, 0, 0, 1, 2.5, 5],
  [SYM.L3]: [0, 0, 0, 1, 2, 5],
  [SYM.L4]: [0, 0, 0, 1, 2, 4],
  [SYM.L5]: [0, 0, 0, 1, 2, 4],
};
