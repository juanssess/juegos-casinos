/**
 * Objetivos de diseño de El Gran Premio.
 *
 * Igual que en los otros juegos: este archivo es la INTENCIÓN, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra, en múltiplos de la apuesta: EV medido 81,81× ± 0,19
 * (`npm run buyprice`, 2M de compras) ÷ 96,5 %. El QA completo lo mide de
 * nuevo antes de publicar.
 */
export const BONUS_BUY_X = 84.8;

/**
 * APUESTA ANTE: cinco medallas en las columnas impares en vez de cuatro.
 *
 * MEDICIÓN — retorno bruto sobre la apuesta base (20M de rondas cada una):
 *   medallas [5,4,5,4,5,4]  → 115,2 %, función 1/152, precio justo 1,19×  <- elegida
 *   medallas [5,5,5,5,5,5]  → 138,5 %, 1/102, precio justo 1,44×
 *   medallas [6,5,5,5,5,6]  → 156,6 %, 1/83, precio justo 1,62×
 * La elegida casi duplica la función (1/229 → 1/152) por menos de un 20 %
 * más de apuesta.
 */
export const ANTE_COST_X = 1.19;
export const ANTE_SCATTERS: readonly number[] = [5, 4, 5, 4, 5, 4];

export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Largada', desc: '12 giros gratis: cada cascada sube la marcha, +1', priceX: BONUS_BUY_X },
] as const;

/**
 * Altura de cada columna: [símbolos a la vista, peso]. La del medio es la
 * más común; siete en las seis columnas (117.649 caminos) es la jugada rara
 * que se celebra.
 */
export const HEIGHT_WEIGHTS: readonly (readonly [number, number])[] = [
  [2, 10], [3, 22], [4, 26], [5, 22], [6, 13], [7, 7],
];

/**
 * Reparto del RTP por símbolo: más plano que en Las Cataratas, para que los
 * bajos carguen más del juego base y los altos no concentren tanto.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 9,
  [SYM.H2]: 10,
  [SYM.H3]: 10,
  [SYM.H4]: 11,
  [SYM.L1]: 11,
  [SYM.L2]: 12,
  [SYM.L3]: 12,
  [SYM.L4]: 12,
  [SYM.L5]: 13,
};

/** Forma de cada fila: relación entre 3, 4, 5 y 6 columnas. Más plana que en el molde. */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [1, 2.2, 5.5, 16],
  [SYM.H2]: [1, 2.2, 5.5, 15],
  [SYM.H3]: [1, 2, 4.5, 13],
  [SYM.H4]: [1, 2, 4, 12],
  [SYM.L1]: [1, 1.8, 4, 12],
  [SYM.L2]: [1, 1.6, 3.5, 10],
  [SYM.L3]: [1, 1.6, 3.5, 10],
  [SYM.L4]: [1, 1.6, 3, 9],
  [SYM.L5]: [1, 1.5, 3, 8],
};
