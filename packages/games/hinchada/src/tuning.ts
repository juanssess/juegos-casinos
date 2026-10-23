/**
 * Objetivos de diseño de La Hinchada: la mecánica de El Carnaval
 * (multiplicadores que se acumulan en la función) con volatilidad más alta:
 * bengalas de hasta ×1000, ocho por columna, y tope 15.000×.
 *
 * Este archivo es la INTENCIÓN, tools/tune.ts mide y resuelve, y la paytable
 * de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra, en múltiplos de la apuesta. MEDIDO (200.000 compras):
 * EV 222,75× → a 230,8× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 230.8;

/**
 * APUESTA ANTE. MEDICIÓN — 12M de rondas, retorno bruto sobre la apuesta base:
 *   copas [3,2,3,3,3,2]  → 116,8 %, bonus 1/301, precio justo 1,21×   <- elegida
 *   copas [3,3,3,3,3,2]  → 138,8 %, 1/238, 1,44×
 *   copas [3,3,3,3,3,3]  → 161,0 %, 1/190, 1,67×
 * Con bengalas de hasta ×1000 la medición tiene mucho ruido: el QA completo
 * controla el retorno con ante con 400M de rondas.
 */
export const ANTE_COST_X = 1.21;
export const ANTE_SCATTERS: readonly number[] = [3, 2, 3, 3, 3, 2];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'El Clásico', desc: '15 giros gratis: las bengalas se acumulan', priceX: BONUS_BUY_X },
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
  [SYM.H3]: 11,
  [SYM.H4]: 11,
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
  [SYM.H4]: [1, 1.6, 14],
  [SYM.L1]: [1, 1.6, 11],
  [SYM.L2]: [1, 1.6, 16],
  [SYM.L3]: [1, 2, 16],
  [SYM.L4]: [1, 2.4, 18],
  [SYM.L5]: [1, 3, 18],
};

/**
 * MULTIPLICADORES: valor → peso. Son las esferas de purpurina de la comparsa.
 *
 * En la función se ACUMULAN (ver `accumulateBombs`): por eso los valores son
 * más bajos que las bombas de El Kiosco, que se usan una vez y se van. Acá un
 * ×10 temprano sigue sumando en todas las secuencias que vienen.
 */
export const BOMB_WEIGHTS: readonly (readonly [number, number])[] = [
  [2, 300], [3, 220], [5, 160], [8, 110], [10, 80], [15, 55], [20, 40],
  [25, 30], [50, 24], [100, 16], [250, 8], [500, 4], [1000, 2],
];

/** Multiplicadores por columna en las tiras de los giros gratis. A medir. */
export const BOMBS_PER_REEL = 8;

/** Multiplicadores por columna en el juego base: pocos, pero existen. A medir. */
export const BASE_BOMBS_PER_REEL = 1;

/**
 * Los del juego base son más modestos: ahí multiplican una secuencia suelta y
 * no acumulan. Con los mismos valores que la función, la base se llevaba el
 * 77 % del RTP y la función —que es la gracia del juego— quedaba de adorno.
 */
export const BASE_BOMB_WEIGHTS: readonly (readonly [number, number])[] = [
  [2, 40], [3, 30], [4, 15], [5, 10], [10, 4], [25, 1],
];
