/**
 * La Feria — skin de la feria de antigüedades de San Telmo sobre el modelo
 * `feria` (Hold & Win).
 *
 * Domingo a la tarde en la plaza Dorrego: puestos de antigüedades, faroles,
 * adoquines y un bandoneón que suena en la esquina. Paleta de sepia y bronce,
 * cálida como los otros juegos de la casa pero más apagada: acá lo que brilla
 * son las MONEDAS, y el tablero tiene que dejarlas brillar.
 *
 * Criterio de siluetas: los altos son objetos de feria con forma propia
 * (reloj redondo, sifón alto, cámara ancha, gramófono con bocina); los bajos
 * son letras en fileteado porteño, planas, que no compiten. La moneda es el
 * único objeto dorado y redondo con un número encima.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `feria`. */
export const TITLE = 'La Feria';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: { id: SYM.WILD, label: 'Bandoneón' },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Moneda' },
  [SYM.H1]: { id: SYM.H1, label: 'Reloj de Bolsillo' },
  [SYM.H2]: { id: SYM.H2, label: 'Sifón' },
  [SYM.H3]: { id: SYM.H3, label: 'Cámara Antigua' },
  [SYM.H4]: { id: SYM.H4, label: 'Gramófono' },
  [SYM.L1]: { id: SYM.L1, label: 'As' },
  [SYM.L2]: { id: SYM.L2, label: 'Rey' },
  [SYM.L3]: { id: SYM.L3, label: 'Reina' },
  [SYM.L4]: { id: SYM.L4, label: 'Jota' },
  [SYM.L5]: { id: SYM.L5, label: 'Diez' },
};

/** Color de la etiqueta de una moneda según su valor (veces la apuesta). */
export function coinColor(v: number): number {
  if (v >= 5000) return 0xff4d6d; // Grand
  if (v >= 200) return 0xc77dff; // Major
  if (v >= 50) return 0x4cc9f0; // Minor
  if (v >= 20) return 0x7ae582; // Mini
  return 0xfff1c9;
}

export const PALETTE = {
  bgTop: 0x2a1d12,
  bgBottom: 0x120c08,
  frame: 0x6e4f2c,
  frameLight: 0xc9a46a,
  reelBg: 0x1a120b,
  reelBgAlt: 0x20170e,
  text: 0xf4e7cf,
  textDim: 0xa8936f,
  win: 0xffd35c,
  bigWin: 0xff9c3c,
  scatter: 0xffc94a,
  mult: 0xffe08a,
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
