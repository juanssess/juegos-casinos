/**
 * kermes — "La Kermés", el Plinko de la casa.
 *
 * El juego de la bolita de la kermés del barrio: la bola cae por un tablero
 * de clavos y termina en uno de los casilleros de abajo, que paga lo que
 * dice. Se elige cuántas filas (8, 12 o 16) y el riesgo: con riesgo bajo
 * casi todo devuelve algo; con alto el centro paga poco y las puntas, mucho.
 *
 * La matemática está en `@casino/math` → originals.ts: el casillero es la
 * binomial de n monedas, y cada tabla está armada para devolver el 97 %.
 * Las tablas salieron de un diseño (centro, punta y una curva entre los
 * dos) resuelto para el RTP y redondeado a números que se leen; el QA
 * controla cada una con su retorno exacto.
 */

import type { PlinkoDef } from '@casino/math';

export const DEF: PlinkoDef = {
  kind: 'plinko',
  id: 'kermes',
  rtp: 0.97,
  rows: [8, 12, 16],
  risks: [
    { id: 'bajo', label: 'Bajo' },
    { id: 'medio', label: 'Medio' },
    { id: 'alto', label: 'Alto' },
  ],
  tables: {
    '8-bajo': [5.6, 2.7, 1.35, 0.75, 0.49, 0.75, 1.35, 2.7, 5.6],
    '8-medio': [13, 3.6, 1.26, 0.59, 0.4, 0.59, 1.26, 3.6, 13],
    '8-alto': [29, 4.8, 1.08, 0.35, 0.2, 0.35, 1.08, 4.8, 29],
    '12-bajo': [10, 5.5, 3.1, 1.79, 1.08, 0.69, 0.5, 0.69, 1.08, 1.79, 3.1, 5.5, 10],
    '12-medio': [33, 13, 5, 2.1, 0.97, 0.49, 0.3, 0.49, 0.97, 2.1, 5, 13, 33],
    '12-alto': [170, 30, 6.6, 1.78, 0.62, 0.29, 0.2, 0.29, 0.62, 1.78, 6.6, 30, 170],
    '16-bajo': [16, 9.6, 5.8, 3.6, 2.2, 1.45, 0.96, 0.67, 0.5, 0.67, 0.96, 1.45, 2.2, 3.6, 5.8, 9.6, 16],
    '16-medio': [110, 42, 17, 7, 3.1, 1.48, 0.76, 0.43, 0.3, 0.43, 0.76, 1.48, 3.1, 7, 17, 42, 110],
    '16-alto': [1000, 180, 39, 9.7, 2.9, 1.05, 0.46, 0.26, 0.2, 0.26, 0.46, 1.05, 2.9, 9.7, 39, 180, 1000],
  },
};
