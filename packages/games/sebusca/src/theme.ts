/**
 * Se Busca — skin western sobre el modelo `sebusca`.
 *
 * Paleta de western sucio: madera quemada, polvo, sangre seca y el latón de
 * los casquillos. Nada de saturación alegre — este juego es un duelo al sol,
 * no una fiesta.
 *
 * Criterio de siluetas (lo mismo que en Maverick, y más difícil acá porque
 * la grilla 5×5 deja las celdas más chicas):
 *  - Los cuatro altos se distinguen por forma antes que por color: sombrero
 *    de ala ancha, calavera de toro con cuernos, revólver horizontal,
 *    estrella de sheriff.
 *  - Los bajos son naipes de saloon, planos y monocromos.
 *  - El wild (cartel SE BUSCA) y el scatter (dinamita) son los únicos con
 *    saturación alta.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `sebusca`. */
export const TITLE = 'Se Busca';

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
    label: 'Cartel de Recompensa',
    shape: 'poster',
    color: 0xe8d3a0,
    accent: 0x8c2f1e,
  },
  [SYM.SCATTER]: {
    id: SYM.SCATTER,
    label: 'Dinamita',
    shape: 'dynamite',
    color: 0xd94f2b,
    accent: 0xffc247,
  },
  [SYM.H1]: {
    id: SYM.H1,
    label: 'El Forajido',
    shape: 'hat',
    color: 0x2e2620,
    accent: 0xc8452f,
  },
  [SYM.H2]: {
    id: SYM.H2,
    label: 'Cráneo de Toro',
    shape: 'skull',
    color: 0xe4dccb,
    accent: 0x8a7c63,
  },
  [SYM.H3]: {
    id: SYM.H3,
    label: 'Revólver',
    shape: 'revolver',
    color: 0xb9bec4,
    accent: 0x6b4a2a,
  },
  [SYM.H4]: {
    id: SYM.H4,
    label: 'Estrella de Sheriff',
    shape: 'star',
    color: 0xd9a53c,
    accent: 0x8a6420,
  },
  [SYM.L1]: { id: SYM.L1, label: 'As', shape: 'card', glyph: 'A', color: 0xd8cbb2, accent: 0x7a6647 },
  [SYM.L2]: { id: SYM.L2, label: 'Rey', shape: 'card', glyph: 'K', color: 0xccbfa6, accent: 0x71603f },
  [SYM.L3]: { id: SYM.L3, label: 'Reina', shape: 'card', glyph: 'Q', color: 0xc0b49c, accent: 0x685838 },
  [SYM.L4]: { id: SYM.L4, label: 'Jota', shape: 'card', glyph: 'J', color: 0xb4a992, accent: 0x5f5133 },
  [SYM.L5]: { id: SYM.L5, label: 'Diez', shape: 'card', glyph: '10', color: 0xa89e89, accent: 0x574a2e },
};

/** Paleta general: madera quemada de día, con el cielo del desierto arriba. */
export const PALETTE = {
  bgTop: 0x3a2a1c,
  bgBottom: 0x120c08,
  frame: 0x5a3d22,
  frameLight: 0xa9793c,
  reelBg: 0x191108,
  reelBgAlt: 0x1f160c,
  text: 0xf0e3c8,
  textDim: 0x9c8460,
  win: 0xf5c451,
  bigWin: 0xe8722c,
  scatter: 0xd94f2b,
  /** Color de los multiplicadores pegajosos: rojo pólvora. */
  mult: 0xff5a3c,
} as const;

/**
 * Tiempos. Más nerviosos que en Maverick: el juego base es seco y hay que
 * pasar rápido por él para llegar al bonus, que es donde está todo.
 */
export const TIMING = {
  firstReelStop: 420,
  reelStagger: 100,
  anticipationExtra: 1500,
  spinSpeed: 4400,
  anticipationSpeed: 850,
  bounce: 120,
  winCycle: 750,
  countUp: 850,
  freeSpinGap: 300,
  /** Cuánto dura la revelación del multiplicador de un wild nuevo. */
  wildReveal: 620,
} as const;

/** Color del marco de un pegajoso según su multiplicador. */
export function multColor(mult: number): number {
  if (mult >= 50) return 0xff2d2d;
  if (mult >= 25) return 0xff6b1f;
  if (mult >= 10) return 0xffa023;
  if (mult >= 5) return 0xffcf47;
  return 0xe8d3a0;
}
