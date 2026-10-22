/**
 * La Milonga — skin de una milonga de San Telmo sobre el modelo `milonga`
 * (racimos con cascadas, la mecánica de La Vendimia con la escalera más
 * empinada).
 *
 * Noche de tango en un salón de baile antiguo: piso de madera, cortinas de
 * terciopelo rojo, arañas encendidas. Paleta de negro y rojo profundo con el
 * dorado del salón. Como en La Vendimia, el jugador lee GRUPOS en una grilla
 * de 6×5: las seis siluetas son distintas en forma y en color.
 *
 *   zapatos     bajos y anchos, negro y blanco
 *   sombrero    ancho y redondo, negro con cinta roja
 *   abanico     abierto en semicírculo, rojo
 *   broche      redondo y chico, perlas blancas y oro
 *   gemelos     dos piezas, dorados
 *   moño        horizontal, negro satinado
 *
 * Los especiales —la rosa roja (wild) y el disco de pasta (scatter)— son los
 * únicos con brillo propio.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math se llama `milonga`. */
export const TITLE = 'La Milonga';

export type SymbolShape =
  | 'shears'
  | 'barrel'
  | 'glass'
  | 'bottle'
  | 'basket'
  | 'bunch'
  | 'leaf'
  | 'grape';

export interface SymbolSkin {
  id: SymbolId;
  label: string;
  shape: SymbolShape;
  color: number;
  accent: number;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  /* La tijera de podar como wild y no un racimo dorado: un racimo de oro se
     confundiría con el racimo Malbec justo cuando más importa distinguirlos
     —adentro de un grupo de cinco—, y además la tijera dice lo que hace.
     Corta el racimo y lo une a otro. */
  [SYM.WILD]: { id: SYM.WILD, label: 'Rosa Roja', shape: 'shears', color: 0xe8c264, accent: 0x8a6b2e },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Disco de Pasta', shape: 'barrel', color: 0xa8703a, accent: 0xd9c07a },

  [SYM.H1]: { id: SYM.H1, label: 'Zapatos de Tango', shape: 'glass', color: 0x8e1330, accent: 0xf0e2c8 },
  [SYM.H2]: { id: SYM.H2, label: 'Sombrero', shape: 'bottle', color: 0x1e4a2a, accent: 0xd9c07a },
  [SYM.H3]: { id: SYM.H3, label: 'Abanico', shape: 'basket', color: 0xc08b3e, accent: 0x6b4a22 },

  [SYM.L1]: { id: SYM.L1, label: 'Broche de Perlas', shape: 'bunch', color: 0x5b2a6e, accent: 0x9d6bb5 },
  [SYM.L2]: { id: SYM.L2, label: 'Gemelos', shape: 'leaf', color: 0x4e7d2c, accent: 0x9ec96a },
  [SYM.L3]: { id: SYM.L3, label: 'Moño', shape: 'grape', color: 0xcfa93c, accent: 0xf5e39a },

  // No aparecen en las tiras de este juego. Están para que el skin tenga la
  // misma forma que el de los otros dos y nada se rompa si alguien los pide.
  [SYM.H4]: { id: SYM.H4, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
  [SYM.L4]: { id: SYM.L4, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
  [SYM.L5]: { id: SYM.L5, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
};

export const PALETTE = {
  bgTop: 0x2a0a10,
  bgBottom: 0x0e0406,
  frame: 0x5a1a22,
  frameLight: 0xe0b768,
  reelBg: 0x160608,
  reelBgAlt: 0x1c080b,
  text: 0xfbecdc,
  textDim: 0xb08f86,
  win: 0xffd35c,
  bigWin: 0xff7a4c,
  /* El dorado del disco de pasta: separa al scatter del rojo del salón. */
  scatter: 0xf2c14e,
  mult: 0xff6b6b,
};

/**
 * Tiempos.
 *
 * MUCHO más cortos que en los otros dos, y no por gusto.
 *
 * En un slot de líneas una jugada es un giro y sus premios: dos tiempos. Acá
 * una jugada puede ser caída + cinco cascadas, y cada cascada tiene su
 * explosión, su caída y su premio. Son quince tiempos encadenados.
 *
 * La primera versión usaba tiempos "cómodos" —los de Maverick, apenas
 * recortados— y una tanda de giros gratis tardaba CUARENTA SEGUNDOS de
 * punta a punta. No es que estuviera mal animada: es que quince pausas
 * razonables, una atrás de otra, dan una espera irrazonable. En un juego de
 * cadenas los tiempos no se eligen mirando un paso, se eligen multiplicando.
 */
export const TIMING = {
  firstReelStop: 250,
  reelStagger: 54,
  anticipationExtra: 850,
  spinSpeed: 4200,
  anticipationSpeed: 900,
  bounce: 120,
  winCycle: 560,
  countUp: 420,
  freeSpinGap: 150,
  wildReveal: 380,
};
