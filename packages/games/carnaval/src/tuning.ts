/**
 * Objetivos de diseño de El Kiosco.
 *
 * Igual que en los otros tres: este archivo es la INTENCIÓN, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra, en múltiplos de la apuesta. MEDIDO con el QA (2M de
 * compras): EV 166,49× ± 0,23 → a 172,5× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 172.5;

/**
 * APUESTA ANTE: una corona más en dos columnas, y la función sale 1 de cada
 * 301 rondas en vez de 1 de cada 386.
 *
 * MEDICIÓN — retorno bruto sobre la apuesta base (24M de rondas):
 *   coronas [3,3,3,3,3,3] (el molde)  → precio justo ~1,6×: demasiado caro
 *   coronas [3,3,3,2,3,2]             → 115,8 %, 1/302, precio justo 1,20×
 *   coronas [3,2,3,3,3,2]             → 121,4 %, 1/301, precio justo 1,26×  <- elegida
 * Con la tabla final el QA (400M) dio 97,18 % a 1,24×: +0,70 contra el juego
 * normal, del lado del jugador.
 */
export const ANTE_COST_X = 1.24;
export const ANTE_SCATTERS: readonly number[] = [3, 2, 3, 3, 3, 2];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'Noche de Comparsas', desc: '15 giros gratis: los multiplicadores se acumulan', priceX: BONUS_BUY_X },
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
  [SYM.H4]: [1, 1.6, 10],
  [SYM.L1]: [1, 1.6, 16],
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
  [2, 400], [3, 300], [4, 220], [5, 180], [6, 120], [8, 100], [10, 80],
  [12, 50], [15, 40], [20, 30], [25, 20], [50, 12], [100, 6], [250, 2], [500, 1],
];

/** Multiplicadores por columna en las tiras de los giros gratis. A medir. */
export const BOMBS_PER_REEL = 6;

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
