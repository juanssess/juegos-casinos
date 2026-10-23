/**
 * La Hinchada — skin de la tribuna en noche de clásico sobre el modelo
 * `hinchada` (8 iguales en cualquier lado, cascadas y multiplicadores que se
 * acumulan en la función: la mecánica de El Carnaval, más volátil).
 *
 * Estadio de noche: humo de bengalas, reflectores, banderas y papelitos.
 * Paleta de azul noche con el rojo de la bengala y el blanco de los
 * reflectores. Los altos son objetos de cancha con forma propia; los bajos,
 * cosas de la tribuna en cinco colores distintos, para contar ocho de un
 * vistazo. Sin escudos ni colores de ningún club: la hinchada es de todos.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math se llama `hinchada`. */
export const TITLE = 'La Hinchada';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  /* El multiplicador ocupa el slot del wild, que este juego no tiene: no
     sustituye, solo multiplica. */
  [SYM.WILD]: { id: SYM.WILD, label: 'Bengala' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Copa' },
  [SYM.H1]: { id: SYM.H1, label: 'Pelota' },
  [SYM.H2]: { id: SYM.H2, label: 'Bombo' },
  [SYM.H3]: { id: SYM.H3, label: 'Botines' },
  [SYM.H4]: { id: SYM.H4, label: 'Silbato' },
  [SYM.L1]: { id: SYM.L1, label: 'Bufanda' },
  [SYM.L2]: { id: SYM.L2, label: 'Gorro' },
  [SYM.L3]: { id: SYM.L3, label: 'Bandera' },
  [SYM.L4]: { id: SYM.L4, label: 'Megáfono' },
  [SYM.L5]: { id: SYM.L5, label: 'Trompeta' },
};

/**
 * Color de la etiqueta de un multiplicador según su valor: el jugador aprende
 * la escala por el color antes de leer el número.
 */
export function bombColor(v: number): number {
  if (v >= 250) return 0xff4dd2;
  if (v >= 50) return 0xff3b3b;
  if (v >= 15) return 0xff8a2a;
  if (v >= 6) return 0xffd35c;
  return 0xfff1d0;
}

export const PALETTE = {
  bgTop: 0x0c1430,
  bgBottom: 0x050812,
  frame: 0x26346a,
  frameLight: 0xe8eefc,
  reelBg: 0x080d20,
  reelBgAlt: 0x0a1026,
  text: 0xf2f6ff,
  textDim: 0x98a6cc,
  win: 0xffd35c,
  bigWin: 0xff6a4a,
  /* El rojo de la bengala: el color de la copa y del marco en la función. */
  scatter: 0xff4a3a,
  mult: 0xff8a4a,
};

/** Tiempos: los de El Kiosco, que ya resolvieron las cadenas de cascadas. */
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
