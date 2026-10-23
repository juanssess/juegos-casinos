/**
 * Objetivos de diseño de El Asado: la mecánica de El Kiosco (8 iguales en
 * cualquier lado, cascadas, multiplicadores al final de la secuencia) con
 * volatilidad MEDIA: brasas de hasta ×50 en vez de ×500, el bonus el doble de
 * seguido y tope 2.500×.
 *
 * Este archivo es la INTENCIÓN, tools/tune.ts mide y resuelve, y la paytable
 * de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra, en múltiplos de la apuesta. MEDIDO con el QA rápido
 * (200.000 compras): EV 62,98× ± 0,25 → a 65,3× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 65.3;

/**
 * APUESTA ANTE. El juego base tiene 3 parrillas por columna (bonus 1/183).
 *
 * MEDICIÓN — 12M de rondas, retorno bruto sobre la apuesta base:
 *   [4,3,3,3,4,3]  →  92,1 %, bonus 1/127, precio justo 0,96×
 *   [4,3,4,3,4,3]  → 101,0 %, 1/107, 1,05×
 *   [4,4,3,4,4,3]  → 113,2 %, 1/91,  1,17×   <- elegida: el bonus sale el doble
 *   [4,4,4,3,4,4]  → 123,6 %, 1/76,  1,28×
 *   [4,4,4,4,4,4]  → 138,7 %, 1/65,  1,44×
 */
export const ANTE_COST_X = 1.17;
export const ANTE_SCATTERS: readonly number[] = [4, 4, 3, 4, 4, 3];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'Asado completo', desc: '10 giros gratis con brasas multiplicadoras', priceX: BONUS_BUY_X },
] as const;

/**
 * Reparto del RTP por símbolo.
 *
 * Las golosinas (altos) se llevan más valor por aparición; las frutas
 * (bajos) son las que hacen que la grilla explote seguido.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 8,
  [SYM.H2]: 10,
  [SYM.H3]: 12,
  [SYM.H4]: 9,
  [SYM.L1]: 12,
  [SYM.L2]: 12,
  [SYM.L3]: 12,
  [SYM.L4]: 12,
  [SYM.L5]: 12,
};

/**
 * Forma de cada fila: relación entre los tramos 8-9, 10-11 y 12+.
 *
 * Los altos van más planos (el premio ya es grande desde el primer tramo)
 * y los bajos más empinados: ocho bananas no son nada, doce sí.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [1, 2.5, 8],
  [SYM.H2]: [1, 3, 12],
  [SYM.H3]: [1, 2.5, 10],
  [SYM.H4]: [1, 1.6, 10],
  [SYM.L1]: [1, 1.6, 16],
  [SYM.L2]: [1, 1.6, 16],
  [SYM.L3]: [1, 2, 16],
  [SYM.L4]: [1, 2.4, 18],
  [SYM.L5]: [1, 3, 18],
};

/**
 * Bombas multiplicadoras: valor → peso. Las chicas son comunes y las grandes
 * raras; el peso se reparte entre todas las bombas de las tiras de los giros
 * gratis.
 *
 * LA COLA ES LO QUE SE ELIGIÓ, no el promedio. Con bombas hasta ×100 y 9 por
 * columna el juego no pasaba de ~3.400× ni en un millón de compras: un tope
 * que en el género anda entre 5.000× y 25.000×. Medición, 100.000 compras
 * por configuración y la misma tabla de pagos:
 *
 *   bombas/col  ×100 ×250 ×500 (pesos)   máximo    supera 10.000×
 *        9        10    4    2           2.091×    nunca
 *       12        10    4    2           5.009×    nunca
 *        9        20   10    5           5.234×    nunca
 *       12        20   10    5          18.632×    1 de cada 50.000   <- elegida
 *
 * La elegida sube el valor del bonus y el solver lo compensa bajando la
 * tabla de pagos: el juego base paga algo menos y la feature pesa más. Es la
 * forma del género —la plata está en las bombas— y lo que lleva la
 * volatilidad de media-alta a alta.
 */
export const BOMB_WEIGHTS: readonly (readonly [number, number])[] = [
  [2, 220], [3, 170], [4, 120], [5, 90], [6, 60], [8, 40],
  [10, 30], [15, 15], [25, 7], [50, 3],
];

/**
 * Brasas por columna en las tiras de la función. El Asado es la versión
 * MEDIA de El Kiosco: brasas más chicas (hasta ×50) y menos por columna.
 */
export const BOMBS_PER_REEL = 9;
