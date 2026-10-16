/**
 * La Kermés — el Plinko de la fiesta del barrio.
 *
 * Noche de kermés en el patio de la escuela: guirnaldas de lamparitas,
 * banderines y puestos de madera pintada. El tablero es de madera con
 * clavos de bronce, y la bola es dorada. Paleta de azul noche con rojo de
 * banderín y el amarillo cálido de las lamparitas.
 */

import type { SymbolId } from '@casino/math';

export const TITLE = 'La Kermés';

/** Las piezas pintadas del juego, numeradas como los símbolos (mismo atlas). */
export const PIECE = { PEG: 0, BALL: 1, STAR: 2 } as const;

export const SKIN: Partial<Record<SymbolId, { label: string }>> = {
  [PIECE.PEG]: { label: 'Clavo de bronce' },
  [PIECE.BALL]: { label: 'Bolita dorada' },
  [PIECE.STAR]: { label: 'Estrella de la kermés' },
};

export const PALETTE = {
  bgTop: 0x14203a,
  bgBottom: 0x080d1a,
  frame: 0x5a3a24,
  frameLight: 0xf4c86a,
  reelBg: 0x101a30,
  reelBgAlt: 0x132038,
  text: 0xfff4e0,
  textDim: 0xa9b4cc,
  win: 0xffd35c,
  bigWin: 0xff7a4a,
  /* El rojo de los banderines. */
  scatter: 0xe8463c,
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
