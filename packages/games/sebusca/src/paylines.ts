/**
 * Las 15 líneas de pago del 5×5.
 *
 * Cada línea dice qué FILA se toma en cada rodillo (0 = arriba, 4 = abajo).
 * Mismo criterio que en classic20: nunca saltan más de una fila entre
 * rodillos contiguos, para que el ojo pueda seguirlas.
 */

import type { Payline } from '@casino/math';

export const PAYLINES: readonly Payline[] = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [3, 3, 3, 3, 3],
  [4, 4, 4, 4, 4],
  [0, 1, 2, 1, 0],
  [4, 3, 2, 3, 4],
  [1, 2, 3, 2, 1],
  [3, 2, 1, 2, 3],
  [0, 0, 1, 0, 0],
  [4, 4, 3, 4, 4],
  [2, 1, 0, 1, 2],
  [2, 3, 4, 3, 2],
  [1, 1, 2, 3, 3],
  [3, 3, 2, 1, 1],
];
