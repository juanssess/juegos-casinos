/**
 * La Vendimia — skin de la cosecha mendocina sobre el modelo `vendimia`.
 *
 * Paleta de bodega al atardecer: berenjena y borra de vino en el fondo,
 * roble y bronce en el mueble, verde de parra en lo que hay que mirar. Es la
 * primera de las tres que no es marrón: Maverick es desierto azteca y Se
 * Busca es western polvoriento, los dos tierra. Un tercer juego de la misma
 * casa tiene que reconocerse como de la casa y NO parecer el mismo juego, y
 * el vino da esa vuelta sin salirse de la familia (sigue siendo cálido, con
 * oro).
 *
 * ---------------------------------------------------------------------
 * CRITERIO DE SILUETAS — más estricto que en los otros dos
 * ---------------------------------------------------------------------
 * Acá la grilla es 6×5: treinta celdas, las más chicas de los tres juegos.
 * Y encima el jugador no lee símbolos sueltos sino GRUPOS: tiene que poder
 * ver de un vistazo que cinco celdas pegadas son la misma cosa. Eso pide
 * silueta neta y, sobre todo, COLOR distinto de fondo a fondo:
 *
 *   copa      vertical y angosta, rojo vino
 *   botella   vertical y recta, verde botella oscuro
 *   canasto   ancha y baja, mimbre ámbar
 *   racimo    triangular, violeta profundo
 *   hoja      lobulada, verde parra
 *   uva       redonda y sola, dorada
 *
 * Ninguna de las seis se parece a otra ni en forma ni en color. Los dos
 * especiales —tijera dorada y barrica— son los únicos con metal a la vista,
 * que es lo que los separa del resto sin necesidad de un cartel.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `vendimia`. */
export const TITLE = 'La Vendimia';

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
  [SYM.WILD]: { id: SYM.WILD, label: 'Tijera de Podar', shape: 'shears', color: 0xe8c264, accent: 0x8a6b2e },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Barrica', shape: 'barrel', color: 0xa8703a, accent: 0xd9c07a },

  [SYM.H1]: { id: SYM.H1, label: 'Copa de Malbec', shape: 'glass', color: 0x8e1330, accent: 0xf0e2c8 },
  [SYM.H2]: { id: SYM.H2, label: 'Botella', shape: 'bottle', color: 0x1e4a2a, accent: 0xd9c07a },
  [SYM.H3]: { id: SYM.H3, label: 'Canasto', shape: 'basket', color: 0xc08b3e, accent: 0x6b4a22 },

  [SYM.L1]: { id: SYM.L1, label: 'Racimo Malbec', shape: 'bunch', color: 0x5b2a6e, accent: 0x9d6bb5 },
  [SYM.L2]: { id: SYM.L2, label: 'Hoja de Parra', shape: 'leaf', color: 0x4e7d2c, accent: 0x9ec96a },
  [SYM.L3]: { id: SYM.L3, label: 'Uva Torrontés', shape: 'grape', color: 0xcfa93c, accent: 0xf5e39a },

  // No aparecen en las tiras de este juego. Están para que el skin tenga la
  // misma forma que el de los otros dos y nada se rompa si alguien los pide.
  [SYM.H4]: { id: SYM.H4, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
  [SYM.L4]: { id: SYM.L4, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
  [SYM.L5]: { id: SYM.L5, label: '—', shape: 'grape', color: 0x777777, accent: 0x999999 },
};

export const PALETTE = {
  bgTop: 0x2b1226,
  bgBottom: 0x120711,
  frame: 0x5c3a1e,
  frameLight: 0xd9a441,
  reelBg: 0x1a0d18,
  reelBgAlt: 0x20111d,
  text: 0xf5e9d8,
  textDim: 0xa08a78,
  win: 0xffd35c,
  bigWin: 0xff8a4c,
  /* Verde de parra. En los otros dos el color del scatter es frío (turquesa,
     celeste) para separarse de la tierra; acá el fondo es violeta, así que
     el que se separa es el verde. */
  scatter: 0x8fd14f,
  mult: 0xffb347,
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
