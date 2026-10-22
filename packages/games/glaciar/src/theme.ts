/**
 * El Glaciar — skin del Perito Moreno (Santa Cruz) sobre el modelo `glaciar`
 * (Hold & Win, la mecánica de La Feria con volatilidad media).
 *
 * El frente de hielo azul sobre el lago, montañas nevadas y luz fría de la
 * tarde. Paleta de azul glaciar y blanco con el oro de las monedas como único
 * color cálido: lo que brilla en el tablero son las monedas de hielo.
 *
 * Criterio de siluetas: los altos son la fauna patagónica (cada uno con su
 * forma), los bajos son objetos de expedición, y la moneda es un disco de
 * hielo con borde dorado y un número encima.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math se llama `glaciar`. */
export const TITLE = 'El Glaciar';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: { id: SYM.WILD, label: 'Témpano Azul' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Moneda de Hielo' },
  [SYM.H1]: { id: SYM.H1, label: 'Cóndor' },
  [SYM.H2]: { id: SYM.H2, label: 'Huemul' },
  [SYM.H3]: { id: SYM.H3, label: 'Zorro Colorado' },
  [SYM.H4]: { id: SYM.H4, label: 'Pingüino' },
  [SYM.L1]: { id: SYM.L1, label: 'Calafate' },
  [SYM.L2]: { id: SYM.L2, label: 'Piolet' },
  [SYM.L3]: { id: SYM.L3, label: 'Brújula' },
  [SYM.L4]: { id: SYM.L4, label: 'Farol' },
  [SYM.L5]: { id: SYM.L5, label: 'Cuerda' },
};

/** Color de la etiqueta de una moneda según su valor (veces la apuesta). */
export function coinColor(v: number): number {
  if (v >= 2500) return 0xff4d6d; // Grand
  if (v >= 150) return 0xc77dff; // Major
  if (v >= 40) return 0x4cc9f0; // Minor
  if (v >= 15) return 0x7ae582; // Mini
  return 0xfff1c9;
}

export const PALETTE = {
  bgTop: 0x10243a,
  bgBottom: 0x06101c,
  frame: 0x2f5878,
  frameLight: 0xcfe6f5,
  reelBg: 0x0a1726,
  reelBgAlt: 0x0d1c2e,
  text: 0xeef8ff,
  textDim: 0x93b3cc,
  win: 0xffd35c,
  bigWin: 0xff9c3c,
  /* El oro de las monedas: el único color cálido de la mesa. */
  scatter: 0xffc94a,
  mult: 0xa8e6ff,
} as const;

/** Tiempos: los del juego de líneas de la casa, con el re-giro más ágil. */
export const TIMING = {
  firstReelStop: 450,
  reelStagger: 110,
  anticipationExtra: 1200,
  spinSpeed: 4200,
  anticipationSpeed: 900,
  bounce: 130,
  winCycle: 800,
  countUp: 900,
  freeSpinGap: 260,
  wildReveal: 420,
} as const;
