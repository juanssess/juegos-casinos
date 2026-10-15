/**
 * El Kiosco — skin del kiosco de barrio sobre el modelo `kiosco`.
 *
 * Paleta de noche de vereda: azul petróleo de fondo, la luz cálida de la
 * vidriera y el rosa del neón. Los otros tres juegos de la casa son cálidos
 * de punta a punta —desierto, atardecer, bodega—; este es el primero FRÍO
 * de fondo, y por contraste las golosinas brillan como en una vidriera de
 * verdad a las once de la noche.
 *
 * ---------------------------------------------------------------------
 * CRITERIO DE SILUETAS — el más exigente de los cuatro
 * ---------------------------------------------------------------------
 * Acá un premio son ocho iguales EN CUALQUIER LADO. No hay grupo pegado que
 * ayude a leer: el jugador tiene que contar con la mirada, por toda la
 * grilla, cuántas sandías hay. Eso solo funciona si cada símbolo se
 * distingue de los otros ocho por COLOR y por FORMA a la vez:
 *
 *   alfajor    disco ancho y bajo, chocolate con sello dorado
 *   bombón     corazón, envoltorio rojo metalizado
 *   caramelo   moño (envoltorio retorcido), naranja
 *   chicle     bola, celeste brillante
 *   manzana    redonda con cabito, verde
 *   ciruela    óvalo, azul ciruela casi negro
 *   sandía     cuña, rojo con cáscara verde
 *   uva        racimo, magenta
 *   banana     media luna, amarilla
 *
 * Las golosinas (altos) llevan envoltorio o brillo de metal; las frutas
 * (bajos) son mate y naturales. Esa diferencia de MATERIAL es la que dice
 * "esto paga más" sin necesidad de mirar la tabla.
 *
 * El chupetín (scatter) es el único con espiral de colores, y la bomba es
 * la única con mecha: ninguno de los dos se confunde con nada.
 */

import { SYM, type SymbolId } from '@casino/math';

/** Nombre comercial. La math sigue llamándose `kiosco`. */
export const TITLE = 'El Kiosco';

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
  [SYM.WILD]: { id: SYM.WILD, label: 'Bomba de Caramelo', shape: 'bomb', color: 0xe8432e, accent: 0xffd35c },
  [SYM.SCATTER]: { id: SYM.SCATTER, label: 'Chupetín', shape: 'lollipop', color: 0xff5fa2, accent: 0xfff0f6 },

  [SYM.H1]: { id: SYM.H1, label: 'Alfajor', shape: 'alfajor', color: 0x5a3018, accent: 0xe8c264 },
  [SYM.H2]: { id: SYM.H2, label: 'Bombón', shape: 'bonbon', color: 0xc8182f, accent: 0xff8a96 },
  [SYM.H3]: { id: SYM.H3, label: 'Caramelo', shape: 'candy', color: 0xf07f12, accent: 0xffd08a },
  [SYM.H4]: { id: SYM.H4, label: 'Chicle', shape: 'gum', color: 0x2fb6e8, accent: 0xc8f2ff },

  [SYM.L1]: { id: SYM.L1, label: 'Manzana', shape: 'apple', color: 0x67b82c, accent: 0xc8f08a },
  [SYM.L2]: { id: SYM.L2, label: 'Ciruela', shape: 'plum', color: 0x34265e, accent: 0x8a78c8 },
  [SYM.L3]: { id: SYM.L3, label: 'Sandía', shape: 'melon', color: 0xe23a4a, accent: 0x3d8a2a },
  [SYM.L4]: { id: SYM.L4, label: 'Uva', shape: 'grapes', color: 0xb02a8c, accent: 0xf09ad8 },
  [SYM.L5]: { id: SYM.L5, label: 'Banana', shape: 'banana', color: 0xf2cf2e, accent: 0xfff2a0 },
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
  bgTop: 0x0f2230,
  bgBottom: 0x071017,
  frame: 0x2a3d4a,
  frameLight: 0xffb3d1,
  reelBg: 0x0c1a24,
  reelBgAlt: 0x0f202c,
  text: 0xfdf3ea,
  textDim: 0x8fa6b4,
  win: 0xffd35c,
  bigWin: 0xff8a4c,
  /* Rosa neón: el color del cartel del kiosco y del chupetín. En un fondo
     azul petróleo es lo que más se separa, y por eso es el del scatter y el
     del marco en la feature. */
  scatter: 0xff5fa2,
  mult: 0xffb347,
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
