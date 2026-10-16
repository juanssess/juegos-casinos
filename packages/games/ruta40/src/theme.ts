/**
 * Ruta 40 — el Crash sobre la ruta más larga del país.
 *
 * Atardecer en la Puna: asfalto que se pierde entre cerros de siete colores,
 * cardones al costado y un camión de rally levantando polvo. Paleta de
 * ocre y naranja quemado sobre un cielo violeta; el multiplicador en dorado.
 */

import type { SymbolId } from '@casino/math';

export const TITLE = 'Ruta 40';

/** Las piezas pintadas del juego, numeradas como los símbolos (mismo atlas). */
export const PIECE = { BURST: 0, TRUCK: 1, CACTUS: 2, TROPHY: 3 } as const;

export const SKIN: Partial<Record<SymbolId, { label: string }>> = {
  [PIECE.BURST]: { label: 'Motor fundido' },
  [PIECE.TRUCK]: { label: 'Camión del rally' },
  [PIECE.CACTUS]: { label: 'Cardón' },
  [PIECE.TROPHY]: { label: 'Copa de la etapa' },
};

export const PALETTE = {
  bgTop: 0x2b1636,
  bgBottom: 0x120a14,
  frame: 0x6b3a22,
  frameLight: 0xf2c46b,
  reelBg: 0x1a0f14,
  reelBgAlt: 0x21131a,
  text: 0xfff1de,
  textDim: 0xc9a990,
  win: 0xffd35c,
  bigWin: 0xff8a3c,
  /* El naranja del polvo: la curva y el camión. */
  scatter: 0xff9a3c,
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

/**
 * Velocidad de la subida: m(t) = e^(GROWTH · t), t en ms; ×2 a los ~11,5 s.
 * Es presentación pura: el punto de quiebre ya está sorteado al arrancar.
 */
export const GROWTH = 0.00006;
