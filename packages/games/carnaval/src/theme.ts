/**
 * El Carnaval — skin del Carnaval del País (Gualeguaychú) sobre el modelo
 * `carnaval` (8 iguales en cualquier lado, cascadas y multiplicadores que se
 * acumulan en la función).
 *
 * Noche de corsódromo: plumas, lentejuelas y la comparsa que pasa. Paleta de
 * violeta profundo con dorado y fucsia: de todos los juegos de la casa es el
 * más saturado, porque el carnaval es eso. El fondo oscuro deja que brillen
 * las esferas de purpurina, que son las que deciden el premio.
 *
 * Criterio de siluetas, el mismo de El Kiosco (ocho iguales desparramados se
 * cuentan con la mirada): los altos son objetos de comparsa con forma propia
 * y los bajos son gemas de cinco cortes y cinco colores distintos.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `carnaval`. */
export const TITLE = 'El Carnaval';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  /* El multiplicador ocupa el slot del wild, que este juego no tiene: no
     sustituye, solo multiplica. */
  [SYM.WILD]: { id: SYM.WILD, label: 'Esfera de Purpurina' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Corona de la Reina' },
  [SYM.H1]: { id: SYM.H1, label: 'Tocado de Plumas' },
  [SYM.H2]: { id: SYM.H2, label: 'Máscara Dorada' },
  [SYM.H3]: { id: SYM.H3, label: 'Tambor de Comparsa' },
  [SYM.H4]: { id: SYM.H4, label: 'Pandero' },
  [SYM.L1]: { id: SYM.L1, label: 'Gema Roja' },
  [SYM.L2]: { id: SYM.L2, label: 'Gema Azul' },
  [SYM.L3]: { id: SYM.L3, label: 'Gema Verde' },
  [SYM.L4]: { id: SYM.L4, label: 'Gema Violeta' },
  [SYM.L5]: { id: SYM.L5, label: 'Gema Amarilla' },
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
  bgTop: 0x2a0f3d,
  bgBottom: 0x12061c,
  frame: 0x5a2a6e,
  frameLight: 0xf2c14e,
  reelBg: 0x1a0a26,
  reelBgAlt: 0x200d2e,
  text: 0xfdf0ff,
  textDim: 0xb39ac4,
  win: 0xffd35c,
  bigWin: 0xff8a4c,
  /* Fucsia de lentejuela: el color de la corona y del marco en la función. */
  scatter: 0xff4fb8,
  mult: 0xffd35c,
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
