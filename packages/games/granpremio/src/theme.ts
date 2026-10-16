/**
 * El Gran Premio — skin de las carreras de ruta de los años 50 y 60 sobre el
 * modelo `cataratas` (caminos con columnas de altura variable y cascadas).
 *
 * Carreteras por caminos de tierra: la polvareda, los pueblos que salen a la
 * banquina, el banderillero con la bandera a cuadros. Las cascadas del juego
 * son los cambios: en la función cada cascada "sube la marcha" y el
 * multiplicador no vuelve atrás. Paleta de tierra quemada y ocre de
 * atardecer con el rojo de la cupé; el fondo oscuro deja que se lean las
 * columnas, que cambian de alto en cada jugada.
 *
 * Criterio de siluetas: los altos son las piezas del piloto (la cupé, el
 * casco, el volante, la copa), cada una con su forma; los bajos son
 * repuestos del taller con siluetas bien distintas (redonda, larga, en cruz,
 * de reloj, de trompeta) para que se cuenten de un vistazo en columnas
 * angostas.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math se llama `granpremio`. */
export const TITLE = 'El Gran Premio';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: { id: SYM.WILD, label: 'Bandera a Cuadros' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Medalla de Largada' },
  [SYM.H1]: { id: SYM.H1, label: 'Cupé de Carrera' },
  [SYM.H2]: { id: SYM.H2, label: 'Casco y Antiparras' },
  [SYM.H3]: { id: SYM.H3, label: 'Volante de Madera' },
  [SYM.H4]: { id: SYM.H4, label: 'Copa del Gran Premio' },
  [SYM.L1]: { id: SYM.L1, label: 'Llanta de Rayos' },
  [SYM.L2]: { id: SYM.L2, label: 'Bujía' },
  [SYM.L3]: { id: SYM.L3, label: 'Llave Cruz' },
  [SYM.L4]: { id: SYM.L4, label: 'Manómetro' },
  [SYM.L5]: { id: SYM.L5, label: 'Bocina' },
};

export const PALETTE = {
  bgTop: 0x2e1a10,
  bgBottom: 0x120a06,
  frame: 0x6b3a1e,
  frameLight: 0xe9b862,
  reelBg: 0x1c110a,
  reelBgAlt: 0x22140c,
  text: 0xfff3e2,
  textDim: 0xc9a98a,
  win: 0xffd36a,
  bigWin: 0xff7a3c,
  /* Rojo de la cupé: el color de la medalla y del marco en la función. */
  scatter: 0xe8443a,
  mult: 0xffc14d,
};

/** Tiempos: los de Las Cataratas, un poco más ágiles (es una carrera). */
export const TIMING = {
  firstReelStop: 240,
  reelStagger: 50,
  anticipationExtra: 850,
  spinSpeed: 4400,
  anticipationSpeed: 900,
  bounce: 110,
  winCycle: 580,
  countUp: 420,
  freeSpinGap: 140,
  wildReveal: 380,
};
