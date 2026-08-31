/**
 * Las 20 líneas de pago clásicas de un 5x3.
 *
 * Cada línea dice qué FILA se toma en cada rodillo (0 = arriba, 2 = abajo).
 * Están elegidas para que nunca salten más de una fila entre rodillos
 * contiguos: eso hace que el jugador pueda seguir la línea con la vista.
 */

import type { Payline } from '@casino/math';

export const PAYLINES: readonly Payline[] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [1, 0, 1, 0, 1],
  [1, 2, 1, 2, 1],
  [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2],
  [0, 1, 0, 1, 0],
  [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1],
  [1, 1, 2, 1, 1],
  [0, 1, 2, 2, 2],
  [2, 1, 0, 0, 0],
  [1, 0, 1, 1, 1],
];
