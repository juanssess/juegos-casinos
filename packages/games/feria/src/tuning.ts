/**
 * Objetivos de diseño de La Feria.
 *
 * Como en los otros juegos: este archivo es la INTENCIÓN. tools/tune.ts
 * resuelve la tabla de líneas y el QA mide el juego entero.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra del Hold & Win, en veces la apuesta. MEDIDO con el QA
 * (200.000 compras): EV 44,57× ± 0,68 → a 46,2× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 46.2;

/**
 * Apuesta ante: pilas de monedas algo más grandes, y la función sale el doble
 * de seguido (1 de cada 86 rondas contra 1 de cada 170).
 *
 * MEDICIÓN — retorno bruto sobre la apuesta base, 32M de rondas:
 *   una moneda suelta más por rodillo         98,6 %  1/120  → 1,02×
 *   pilas [3,2,1,1] / [3,2,2,1]              114,5 %  1/86   → 1,19×   <- elegida
 *   pilas [3,2,2,1] en todos                 134,3 %  1/64   → 1,39×
 * Agregar monedas sueltas casi no mueve el retorno (le sacan lugar a los
 * símbolos de línea); lo que encarece el ante son las pilas grandes.
 */
export const ANTE_COST_X = 1.19;

/**
 * PILAS DE MONEDAS por rodillo, en el juego base y en el ante.
 *
 * Seis monedas en quince celdas tienen que poder juntarse: por eso caen en
 * pilas de 1 a 3 (ver insertCoinStacks). El tamaño y la cantidad de pilas es
 * lo que regula cada cuánto dispara la función.
 */
export const BASE_STACKS: readonly (readonly number[])[] = [
  [2, 2, 1, 1], [3, 2, 1, 1], [3, 2, 1, 1], [3, 2, 1, 1], [2, 2, 1, 1],
];
export const ANTE_STACKS: readonly (readonly number[])[] = [
  [3, 2, 1, 1], [3, 2, 2, 1], [3, 2, 2, 1], [3, 2, 2, 1], [3, 2, 1, 1],
];

/**
 * Valores de las monedas, en veces la apuesta total: [valor, peso].
 *
 * Las chicas son las que llenan la pantalla; Mini, Minor y Major son
 * monedas como las demás, solo que raras. El Grand no cae: se gana llenando
 * las quince celdas.
 *
 * MEDICIÓN (32M de rondas por configuración; pilas y caída son las de abajo):
 *   pilas grandes, caída 70 ‰  → función 1/86, pantalla llena 1 de cada 91 funciones
 *   pilas medianas, caída 50 ‰ → función 1/170, valor 36×, llena 1/633
 *   ídem, valores más altos, caída 45 ‰ → 1/170, valor 41×, llena 1/1.139   <- elegida
 */
/**
 * El GRAND es el tope: llenar las quince celdas paga 5.000× la apuesta. Así
 * el premio máximo publicado es un premio que existe (1 de cada ~194.000
 * rondas) y no un número decorativo que nunca se acerca.
 */
export const JACKPOTS = { mini: 20, minor: 50, major: 200, grand: 5000 } as const;
export const COIN_WEIGHTS: readonly (readonly [number, number])[] = [
  [1, 200], [2, 230], [3, 170], [4, 110], [5, 100], [8, 65], [10, 55],
  [JACKPOTS.mini, 32], [JACKPOTS.minor, 10], [JACKPOTS.major, 2],
];

/** Probabilidad, en milésimas, de que una celda vacía reciba moneda en un re-giro. */
export const LAND_PER_MIL = 45;

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'Hold & Win', desc: 'Arrancás con 6 monedas o más y 3 re-giros', priceX: BONUS_BUY_X },
] as const;

/** Cuánto del RTP de LÍNEAS aporta cada símbolo (pesos relativos). */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 18,
  [SYM.H2]: 14,
  [SYM.H3]: 11,
  [SYM.H4]: 9,
  [SYM.L1]: 12,
  [SYM.L2]: 11,
  [SYM.L3]: 10,
  [SYM.L4]: 8,
  [SYM.L5]: 7,
};

/** Forma de cada fila: relación entre 3, 4 y 5 en línea. */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [0, 0, 0, 1, 6, 30],
  [SYM.H2]: [0, 0, 0, 1, 5, 20],
  [SYM.H3]: [0, 0, 0, 1, 5, 16],
  [SYM.H4]: [0, 0, 0, 1, 4, 14],
  [SYM.L1]: [0, 0, 0, 1, 4, 10],
  [SYM.L2]: [0, 0, 0, 1, 4, 10],
  [SYM.L3]: [0, 0, 0, 1, 3, 8],
  [SYM.L4]: [0, 0, 0, 1, 3, 8],
  [SYM.L5]: [0, 0, 0, 1, 3, 6],
};
