/**
 * Las Cataratas — skin de las Cataratas del Iguazú sobre el modelo
 * `cataratas` (caminos con columnas de altura variable y cascadas).
 *
 * Las cascadas del juego son el agua: la grilla cae como cae la Garganta del
 * Diablo. Selva misionera, bruma y piedras de Wanda. Paleta de verde selva
 * profundo con turquesa de agua y oro; el fondo oscuro deja que se lean las
 * columnas, que cambian de alto en cada jugada.
 *
 * Criterio de siluetas: los altos son animales y flores de la selva, cada
 * uno con su forma; los bajos son las piedras de las minas de Wanda, cinco
 * colores distintos para que se cuenten de un vistazo en columnas angostas.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `cataratas`. */
export const TITLE = 'Las Cataratas';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: { id: SYM.WILD, label: 'Gota Arcoíris' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Medallón de la Garganta' },
  [SYM.H1]: { id: SYM.H1, label: 'Yaguareté' },
  [SYM.H2]: { id: SYM.H2, label: 'Tucán' },
  [SYM.H3]: { id: SYM.H3, label: 'Mariposa Azul' },
  [SYM.H4]: { id: SYM.H4, label: 'Orquídea' },
  [SYM.L1]: { id: SYM.L1, label: 'Amatista' },
  [SYM.L2]: { id: SYM.L2, label: 'Ágata' },
  [SYM.L3]: { id: SYM.L3, label: 'Cuarzo' },
  [SYM.L4]: { id: SYM.L4, label: 'Topacio' },
  [SYM.L5]: { id: SYM.L5, label: 'Jaspe' },
};

export const PALETTE = {
  bgTop: 0x0c2a24,
  bgBottom: 0x05140f,
  frame: 0x1f5a48,
  frameLight: 0xe7c873,
  reelBg: 0x082019,
  reelBgAlt: 0x0a261e,
  text: 0xeefcf6,
  textDim: 0x9cc4b6,
  win: 0xffd76a,
  bigWin: 0xff9e4a,
  /* Turquesa de agua: el color del medallón y del marco en la función. */
  scatter: 0x3fd6c8,
  mult: 0x7ff3e6,
};

/** Tiempos: los de los juegos de cascadas, un poco más ágiles (hay más celdas). */
export const TIMING = {
  firstReelStop: 250,
  reelStagger: 54,
  anticipationExtra: 850,
  spinSpeed: 4200,
  anticipationSpeed: 900,
  bounce: 120,
  winCycle: 600,
  countUp: 420,
  freeSpinGap: 150,
  wildReveal: 380,
};
