/**
 * El Asado — skin de un asado de domingo en el patio sobre el modelo `asado`
 * (8 iguales en cualquier lado con cascadas y brasas multiplicadoras: la
 * mecánica de El Kiosco con volatilidad MEDIA).
 *
 * Paleta de carbón y brasa: fondo casi negro, el naranja del fuego y el
 * dorado de la grasa en la parrilla. Como en El Kiosco, el jugador cuenta
 * ocho iguales desparramados con la mirada, así que cada símbolo se
 * distingue de los otros por COLOR y FORMA a la vez:
 *
 *   bife       ancho y marcado por la parrilla, marrón dorado
 *   chorizo    alargado y curvo, rojizo
 *   provoleta  disco, amarillo gratinado
 *   morcilla   alargada, casi negra
 *   morrón     rojo brillante
 *   choclo     alargado, amarillo
 *   papa       redonda, marrón claro
 *   limón      óvalo, amarillo verdoso
 *   ají        fino y curvo, verde
 *
 * La parrilla de hierro (scatter) y la brasa (multiplicador) son las únicas
 * con fuego.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math se llama `asado`. */
export const TITLE = 'El Asado';

export type SymbolShape =
  | 'bomb'
  | 'lollipop'
  | 'alfajor'
  | 'bonbon'
  | 'candy'
  | 'gum'
  | 'apple'
  | 'plum'
  | 'melon'
  | 'grapes'
  | 'banana';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
  shape: SymbolShape;
  color: number;
  accent: number;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  /* La bomba ocupa el slot del wild, que este juego no tiene. No sustituye:
     solo multiplica. El nombre lo dice para que nadie espere que complete un
     premio. */
  [SYM.WILD]: { id: SYM.WILD, label: 'Brasa', shape: 'bomb', color: 0xe8432e, accent: 0xffd35c },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Parrilla', shape: 'lollipop', color: 0xff5fa2, accent: 0xfff0f6 },

  [SYM.H1]: { id: SYM.H1, label: 'Bife', shape: 'alfajor', color: 0x5a3018, accent: 0xe8c264 },
  [SYM.H2]: { id: SYM.H2, label: 'Chorizo', shape: 'bonbon', color: 0xc8182f, accent: 0xff8a96 },
  [SYM.H3]: { id: SYM.H3, label: 'Provoleta', shape: 'candy', color: 0xf07f12, accent: 0xffd08a },
  [SYM.H4]: { id: SYM.H4, label: 'Morcilla', shape: 'gum', color: 0x2fb6e8, accent: 0xc8f2ff },

  [SYM.L1]: { id: SYM.L1, label: 'Morrón', shape: 'apple', color: 0x67b82c, accent: 0xc8f08a },
  [SYM.L2]: { id: SYM.L2, label: 'Choclo', shape: 'plum', color: 0x34265e, accent: 0x8a78c8 },
  [SYM.L3]: { id: SYM.L3, label: 'Papa', shape: 'melon', color: 0xe23a4a, accent: 0x3d8a2a },
  [SYM.L4]: { id: SYM.L4, label: 'Limón', shape: 'grapes', color: 0xb02a8c, accent: 0xf09ad8 },
  [SYM.L5]: { id: SYM.L5, label: 'Ají', shape: 'banana', color: 0xf2cf2e, accent: 0xfff2a0 },
};

/**
 * Color de la etiqueta de una bomba según su valor. Igual que los
 * pegajosos de Se Busca: el jugador aprende la escala por el color antes de
 * leer el número. Crema las chicas, naranja las medianas, rojo y violeta las
 * que cambian una partida.
 */
export function bombColor(v: number): number {
  if (v >= 250) return 0xc04dff;
  if (v >= 50) return 0xff3b3b;
  if (v >= 15) return 0xff8a2a;
  if (v >= 6) return 0xffc94a;
  return 0xfff1d0;
}

export const PALETTE = {
  bgTop: 0x2a120a,
  bgBottom: 0x0e0604,
  frame: 0x5a2a14,
  frameLight: 0xf0a24a,
  reelBg: 0x170a06,
  reelBgAlt: 0x1d0d08,
  text: 0xfff0e0,
  textDim: 0xc0987c,
  win: 0xffd35c,
  bigWin: 0xff7a3c,
  /* El naranja de la brasa: el color de la parrilla y del marco en la función. */
  scatter: 0xff7a2a,
  mult: 0xffb04a,
};

/**
 * Tiempos.
 *
 * Los de La Vendimia, que ya resolvieron el problema de las cadenas largas
 * (una jugada puede ser caída + seis cascadas). Un pelo más de pausa en el
 * premio: acá los premios son de símbolos desparramados y el ojo tarda más
 * en encontrarlos que un racimo pegado.
 */
export const TIMING = {
  firstReelStop: 250,
  reelStagger: 54,
  anticipationExtra: 850,
  spinSpeed: 4200,
  anticipationSpeed: 900,
  bounce: 120,
  winCycle: 600,
  countUp: 440,
  freeSpinGap: 150,
  wildReveal: 380,
};
