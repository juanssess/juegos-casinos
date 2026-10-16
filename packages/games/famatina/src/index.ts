/**
 * famatina — "Famatina", el Mines de la casa.
 *
 * Un frente de mina de 5×5 rocas en el cerro Famatina (La Rioja), con su
 * cablecarril. Debajo de cada roca hay una pepita de oro o una carga de
 * dinamita. El jugador elige cuántas cargas hay (de 1 a 24) y destapa rocas
 * de a una: cada pepita sube el multiplicador, y puede cobrar cuando
 * quiera. La dinamita se lleva la apuesta.
 *
 * La matemática está en `@casino/math` → originals.ts: el multiplicador
 * después de k pepitas es rtp / P(sobrevivir k), así que el retorno es el
 * 97 % para cualquier cantidad de cargas y cualquier momento de cobro.
 */

import type { MinesDef } from '@casino/math';

export const DEF: MinesDef = {
  kind: 'mines',
  id: 'famatina',
  rtp: 0.97,
  cells: 25,
  minMines: 1,
  maxMines: 24,
  // Tope por ronda: antes de pasarlo, la ronda se cobra sola.
  maxMult: 10_000,
};
