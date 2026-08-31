/**
 * Maverick — skin azteca sobre el modelo matemático `classic20`.
 *
 * Acá vive TODO lo que es tema y nada de lo que es matemática. Si mañana
 * querés sacar el mismo juego con tema vikingo, copiás este archivo y no
 * tocás una sola probabilidad. Así es como un proveedor saca cinco juegos con
 * una math: el modelo es el activo caro, el skin es la variación barata.
 *
 * Criterios de las siluetas (esto es lo que hace legible un slot, no el
 * detalle del dibujo):
 *  - Los cuatro altos se distinguen por FORMA GENERAL antes que por color:
 *    horizontal serpenteada, cabeza felina, óvalo de máscara, cráneo.
 *  - Los cinco bajos son glifos de piedra sobre naipes, planos y en un solo
 *    tono, para que nunca le compitan a un alto en la mirada rápida.
 *  - Wild y scatter son los únicos con brillo y saturación alta: tienen que
 *    saltar a la vista en 200 ms de movimiento.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial del juego. La math sigue llamándose `classic20`. */
export const TITLE = 'Maverick';

export type SymbolShape =
  | 'serpent'
  | 'jaguar'
  | 'mask'
  | 'skull'
  | 'glyph'
  | 'sun'
  | 'temple';

export interface SymbolSkin {
  id: SymbolId;
  /** Nombre visible en la tabla de pagos. */
  label: string;
  /** Forma que dibuja el renderer. */
  shape: SymbolShape;
  /** Color principal de la figura. */
  color: number;
  /** Color secundario, para el detalle interno. */
  accent: number;
  /** Fondo de la ficha. */
  plate: number;
  /** Texto del glifo, solo para los bajos. */
  glyph?: string;
}

export const SKIN: Record<SymbolId, SymbolSkin> = {
  [SYM.WILD]: {
    id: SYM.WILD,
    label: 'Piedra del Sol',
    shape: 'sun',
    color: 0xffc93c,
    accent: 0xff7a1a,
    plate: 0x3a2410,
  },
  [SYM.SCATTER]: {
    id: SYM.SCATTER,
    label: 'Templo',
    shape: 'temple',
    color: 0x3fe0d0,
    accent: 0x0e7f78,
    plate: 0x08302f,
  },
  [SYM.H1]: {
    id: SYM.H1,
    label: 'Serpiente Emplumada',
    shape: 'serpent',
    color: 0xf2b134,
    accent: 0xc4442a,
    plate: 0x2a1a0e,
  },
  [SYM.H2]: {
    id: SYM.H2,
    label: 'Jaguar',
    shape: 'jaguar',
    color: 0xe08a3c,
    accent: 0x2b1508,
    plate: 0x2a1a0e,
  },
  [SYM.H3]: {
    id: SYM.H3,
    label: 'Máscara de Jade',
    shape: 'mask',
    color: 0x4fbf8b,
    accent: 0x1d5c46,
    plate: 0x14261f,
  },
  [SYM.H4]: {
    id: SYM.H4,
    label: 'Cráneo de Obsidiana',
    shape: 'skull',
    color: 0xb9a7d4,
    accent: 0x3b2d55,
    plate: 0x1d1729,
  },
  [SYM.L1]: { id: SYM.L1, label: 'As', shape: 'glyph', glyph: 'A', color: 0xd9c9a3, accent: 0x8a7550, plate: 0x241d14 },
  [SYM.L2]: { id: SYM.L2, label: 'Rey', shape: 'glyph', glyph: 'K', color: 0xcdbfa0, accent: 0x7d6a48, plate: 0x241d14 },
  [SYM.L3]: { id: SYM.L3, label: 'Reina', shape: 'glyph', glyph: 'Q', color: 0xc2b69c, accent: 0x736247, plate: 0x241d14 },
  [SYM.L4]: { id: SYM.L4, label: 'Jota', shape: 'glyph', glyph: 'J', color: 0xb7ac97, accent: 0x695a44, plate: 0x241d14 },
  [SYM.L5]: { id: SYM.L5, label: 'Diez', shape: 'glyph', glyph: '10', color: 0xaca292, accent: 0x5f5340, plate: 0x241d14 },
};

/**
 * Paleta general. Base oscura y cálida (piedra volcánica) para que el oro y
 * el turquesa del scatter tengan contra qué brillar.
 */
export const PALETTE = {
  bgTop: 0x1a1108,
  bgBottom: 0x0b0906,
  frame: 0x6b4a22,
  frameLight: 0xb08540,
  reelBg: 0x16100a,
  reelBgAlt: 0x1c150d,
  text: 0xf3e6cc,
  textDim: 0x9c8a6b,
  win: 0xffd35c,
  bigWin: 0xff9c3c,
  scatter: 0x3fe0d0,
} as const;

/**
 * Tiempos de animación, en milisegundos.
 *
 * Esto es lo que de verdad diferencia un slot bueno de uno malo, y no tiene
 * nada que ver con el arte. La probabilidad ya está resuelta antes de que el
 * primer rodillo se mueva: todo lo que pasa acá es teatro sobre un resultado
 * que ya existe.
 *
 * `anticipation` es el truco central: cuando ya cayeron los scatters
 * suficientes para que el siguiente rodillo pueda disparar la feature, ese
 * rodillo gira mucho más lento y más tiempo. El jugador siente que el juego
 * "duda". No cambia ni una probabilidad — cambia toda la experiencia.
 */
export const TIMING = {
  /** Cuánto tarda en frenar el primer rodillo. */
  firstReelStop: 450,
  /** Diferencia entre la parada de un rodillo y el siguiente. */
  reelStagger: 110,
  /** Duración extra del rodillo en modo expectativa. */
  anticipationExtra: 1400,
  /** Velocidad de giro en píxeles por segundo. */
  spinSpeed: 4200,
  /** Velocidad durante la expectativa (bien más lenta). */
  anticipationSpeed: 900,
  /** Rebote al frenar. */
  bounce: 130,
  /** Cuánto queda encendida cada línea ganadora en el ciclo. */
  winCycle: 800,
  /** Duración del conteo del premio total. */
  countUp: 900,
  /** Pausa entre giros gratis. */
  freeSpinGap: 350,
} as const;
