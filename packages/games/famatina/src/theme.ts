/**
 * Famatina — el Mines en la vieja mina de oro de La Rioja.
 *
 * Un socavón iluminado por faroles, con vigas de quebracho y el cablecarril
 * al fondo. Las rocas son el tablero; abajo, oro o dinamita. Paleta de
 * piedra rojiza y madera oscura con el oro como único color vivo.
 */

import type { SymbolId } from '@casino/math';

export const TITLE = 'Famatina';

/** Las piezas pintadas del juego, numeradas como los símbolos (mismo atlas). */
export const PIECE = { DYNAMITE: 0, NUGGET: 1, ROCK: 2, CART: 3 } as const;

export const SKIN: Partial<Record<SymbolId, { label: string }>> = {
  [PIECE.DYNAMITE]: { label: 'Dinamita' },
  [PIECE.NUGGET]: { label: 'Pepita de oro' },
  [PIECE.ROCK]: { label: 'Roca' },
  [PIECE.CART]: { label: 'Vagoneta de oro' },
};

export const PALETTE = {
  bgTop: 0x2a1812,
  bgBottom: 0x110906,
  frame: 0x5a3320,
  frameLight: 0xf0c060,
  reelBg: 0x1c100b,
  reelBgAlt: 0x22140e,
  text: 0xfff0dc,
  textDim: 0xc4a58a,
  win: 0xffd35c,
  bigWin: 0xff8a3c,
  /* El rojo de la dinamita. */
  scatter: 0xe5462e,
  mult: 0xffd35c,
};

export const TIMING = {
  firstReelStop: 0,
  reelStagger: 0,
  anticipationExtra: 0,
  spinSpeed: 0,
  anticipationSpeed: 0,
  bounce: 0,
  winCycle: 600,
  countUp: 500,
  freeSpinGap: 0,
};
