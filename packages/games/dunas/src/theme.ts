/**
 * Las Dunas — skin del rally de motos en las dunas de Fiambalá (Catamarca)
 * sobre el modelo `sebusca` (5×5, 15 líneas, wilds pegajosos con
 * multiplicador en la función).
 *
 * Atardecer en el desierto: arena rojiza, cielo violeta que se apaga y el
 * naranja del polvo que levantan las motos. Más cálido y más luminoso que
 * Se Busca: este juego es de volatilidad media, una travesía y no un duelo.
 *
 * Criterio de siluetas (la grilla 5×5 deja las celdas chicas):
 *  - Los cuatro altos se distinguen por forma antes que por color: el
 *    piloto de frente, la moto de perfil en el aire, el casco redondo y el
 *    bidón cuadrado.
 *  - Los bajos son piezas de la moto, cada una con su silueta y su metal.
 *  - El wild (el piloto) y el scatter (la bandera a cuadros) son los únicos
 *    con saturación alta.
 *
 * Sin marcas reales: ni carreras ni fabricantes con nombre.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `sebusca`. */
export const TITLE = 'Las Dunas';

/** Formas del dibujo procedural de respaldo (el del molde). */
export type SymbolShape =
  | 'hat'
  | 'skull'
  | 'revolver'
  | 'star'
  | 'card'
  | 'poster'
  | 'dynamite';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
  shape: SymbolShape;
  color: number;
  accent: number;
  glyph?: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: {
    id: SYM.WILD,
    label: 'El Piloto',
    shape: 'poster',
    color: 0xff7a1f,
    accent: 0x1d1a2e,
  },
  [SYM.SCATTER]: {
    id: SYM.SCATTER,
    label: 'Bandera de Llegada',
    shape: 'dynamite',
    color: 0xf2f2f2,
    accent: 0x111111,
  },
  [SYM.H1]: {
    id: SYM.H1,
    label: 'Moto en el Aire',
    shape: 'hat',
    color: 0xe0571f,
    accent: 0x2b2b33,
  },
  [SYM.H2]: {
    id: SYM.H2,
    label: 'Casco de Rally',
    shape: 'skull',
    color: 0xf4efe6,
    accent: 0xd8462a,
  },
  [SYM.H3]: {
    id: SYM.H3,
    label: 'Bidón de Nafta',
    shape: 'revolver',
    color: 0xb3261e,
    accent: 0xe9c46a,
  },
  [SYM.H4]: {
    id: SYM.H4,
    label: 'Trofeo de Etapa',
    shape: 'star',
    color: 0xe0b44c,
    accent: 0x8a6420,
  },
  [SYM.L1]: { id: SYM.L1, label: 'Brújula', shape: 'card', glyph: 'A', color: 0xd9a65a, accent: 0x6e4b22 },
  [SYM.L2]: { id: SYM.L2, label: 'Antiparras', shape: 'card', glyph: 'K', color: 0x5fa8c9, accent: 0x2a4d5e },
  [SYM.L3]: { id: SYM.L3, label: 'Bujía', shape: 'card', glyph: 'Q', color: 0xcfd3d8, accent: 0x5a5f66 },
  [SYM.L4]: { id: SYM.L4, label: 'Piñón', shape: 'card', glyph: 'J', color: 0x9aa0a8, accent: 0x40454c },
  [SYM.L5]: { id: SYM.L5, label: 'Llave', shape: 'card', glyph: '10', color: 0x8c6a4a, accent: 0x4a3622 },
};

/** Paleta general: arena roja abajo, cielo violeta de atardecer arriba. */
export const PALETTE = {
  bgTop: 0x3a1f3d,
  bgBottom: 0x1a0c0a,
  frame: 0x6b3a22,
  frameLight: 0xe39a4a,
  reelBg: 0x1f110c,
  reelBgAlt: 0x26150f,
  text: 0xfbeedd,
  textDim: 0xb48e72,
  win: 0xffc85a,
  bigWin: 0xff7a1f,
  scatter: 0xf2f2f2,
  /** Color de los multiplicadores pegajosos: naranja de polvareda. */
  mult: 0xff8a2a,
} as const;

/**
 * Tiempos. Más ágiles que en Se Busca: acá el juego base paga seguido y no
 * hay que hacer esperar cada premio chico.
 */
export const TIMING = {
  firstReelStop: 380,
  reelStagger: 90,
  anticipationExtra: 1300,
  spinSpeed: 4400,
  anticipationSpeed: 850,
  bounce: 120,
  winCycle: 650,
  countUp: 650,
  freeSpinGap: 260,
  /** Cuánto dura la revelación del multiplicador de un wild nuevo. */
  wildReveal: 560,
} as const;

/** Color del marco de un pegajoso según su multiplicador. */
export function multColor(mult: number): number {
  if (mult >= 10) return 0xff3b2d;
  if (mult >= 5) return 0xff7a1f;
  if (mult >= 3) return 0xffb347;
  return 0xffe2a8;
}
