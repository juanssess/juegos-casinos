/**
 * Objetivos de diseño de La Milonga: los racimos con cascadas de La Vendimia
 * con OTRA volatilidad. La escalera es más empinada (×1, ×2, ×4, ×8… ×100),
 * la función sale la mitad de seguido y el tope sube a 10.000×.
 *
 * Igual que en los otros juegos: este archivo es la INTENCIÓN, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra simple, en veces la apuesta. MEDIDO con el QA rápido
 * (200.000 compras): EV 96,86× ± 0,62 → a 100,4× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 100.4;

/**
 * APUESTA ANTE: un disco por columna en todas (el juego base tiene [2,1,2,2,1,2]).
 *
 * MEDICIÓN — 20M de rondas, retorno bruto sobre la apuesta base:
 *   [2,2,2,2,1,2] → 101,5 %, función 1/165, precio justo 1,05×
 *   [3,1,2,2,1,3] → 108,6 %, 1/138, 1,13×
 *   [2,2,2,2,2,2] → 123,4 %, 1/115, 1,28×   <- elegida: el bonus sale el doble
 *   [2,2,3,2,2,2] → 143,8 %, 1/89,  1,49×
 */
export const ANTE_COST_X = 1.28;
export const ANTE_SCATTERS: readonly number[] = [2, 2, 2, 2, 2, 2];

/**
 * Las tres compras. Precios MEDIDOS con el QA rápido (200.000 compras cada
 * una): EV 96,86× / 248,75× / 166,42×. Como en La Vendimia, cuatro giros más
 * valen mucho más que un 50 % más: la escalera se arrastra.
 */
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Milonga', desc: '8 giros con la escalera arrastrada', priceX: BONUS_BUY_X },
  { id: 'grande', label: 'Milonga larga', desc: '12 giros: cuatro más para que la escalera suba', extraSpins: 4, priceX: 257.8 },
  { id: 'reserva', label: 'Tanda de lujo', desc: '8 giros que ya arrancan en ×4', minMultiplier: 4, priceX: 172.5 },
] as const;

/**
 * Reparto del RTP de racimos por símbolo.
 *
 * Más parejo que en Se Busca a propósito. En un juego de cascadas la
 * emoción no viene del símbolo caro sino de la CADENA: lo que engancha es
 * que la grilla siga explotando. Si el valor se concentra en H1, la mayoría
 * de las cascadas se sienten vacías y el mecanismo se desperdicia.
 *
 * H4 y L5 no están: no aparecen en ninguna tira de este juego.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 20,
  [SYM.H2]: 18,
  [SYM.H3]: 17,
  [SYM.L1]: 16,
  [SYM.L2]: 15,
  [SYM.L3]: 14,
};

/**
 * Forma de cada fila: la relación entre los cinco tramos (5-6, 7-8, 9-11,
 * 12-14, 15+).
 *
 * MUY empinada, y por una razón medida. La primera versión tenía el tramo
 * 15+ en 50 veces el de 5-6, que es lo que uno pone por instinto; el
 * simulador devolvió volatilidad 10,6 —"media"— y un premio máximo de 873×
 * en cinco millones de rondas. Un juego de cascadas que no llega a mil veces
 * la apuesta no tiene de qué presumir.
 *
 * Con el 15+ en 140 veces el de 5-6, la misma matemática da volatilidad 14,2
 * y premios de 4.500×. No cambió ninguna probabilidad: cambió DÓNDE está
 * guardado el valor. Es la decisión de diseño más grande del juego y se toma
 * acá, en seis filas de números.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [1, 3.2, 10, 34, 140],
  [SYM.H2]: [1, 3.1, 9, 30, 120],
  [SYM.H3]: [1, 3.0, 8.5, 27, 100],
  [SYM.L1]: [1, 2.9, 8, 24, 85],
  [SYM.L2]: [1, 2.8, 7.5, 22, 75],
  [SYM.L3]: [1, 2.7, 7, 20, 68],
};
