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
 * Precio de la compra, en múltiplos de la apuesta. MEDIDO con las bombas
 * actuales (12 por columna, hasta ×500) y la tabla vigente:
 * 8 × `node tools/buyprice.ts --game kiosco --rounds 2.5e5 --bet 20 --seed N`
 * (2M de compras) → EV 150,60× ± 0,23 → a 156,1× el RTP de la compra es 96,5 %.
 */
export const BONUS_BUY_X = 156.1;

/**
 * APUESTA ANTE: pone más chupetines en las tiras y el bonus sale el doble de
 * seguido (1 de cada 183 rondas contra 1 de cada 372).
 *
 * Con las bombas grandes la feature vale tanto que cada chupetín extra
 * encarece mucho el ante. MEDICIÓN — retorno bruto sobre la apuesta base,
 * 5M a 25M de rondas por configuración:
 *
 *   chupetines por columna   bruto      feature        precio justo
 *   [3,2,3,3,3,2]             93,9 %    1 de cada 291      0,97×
 *   [3,3,3,3,3,2]            108,2 %    1 de cada 229      1,12×
 *   [3,3,3,3,3,3]            ~127 %     1 de cada 183      1,31×   <- elegida
 *   [4,3,3,3,3,3]            138,2 %    1 de cada 153      1,43×
 *
 * La elegida queda a tiro del 1,25× del género con el bonus al doble de
 * frecuencia. Precio fijado con 400M de rondas: a 1,30× el ante devolvía
 * 97,62 % ± 0,15; a 1,31× devuelve ~96,9 %, apenas arriba del juego normal.
 */
export const ANTE_COST_X = 1.31;
export const ANTE_SCATTERS: readonly number[] = [3, 3, 3, 3, 3, 3];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'Vuelta al Kiosco', desc: '10 giros gratis con bombas multiplicadoras', priceX: BONUS_BUY_X },
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
  [2, 160], [3, 130], [4, 105], [5, 90], [6, 70], [8, 60],
  [10, 50], [12, 38], [15, 30], [20, 24], [25, 18], [50, 14],
  [100, 20], [250, 10], [500, 5],
];

/** Bombas por columna en las tiras de los giros gratis (ver arriba). */
export const BOMBS_PER_REEL = 12;
