/**
 * Tema activo del cliente.
 *
 * Los módulos de render (rodillos, HUD, efectos) importaban la paleta y los
 * tiempos directo del paquete de classic20. Funcionaba con un solo juego, y
 * se volvió el obstáculo apenas apareció el segundo: obligaba a duplicar el
 * cliente entero para cambiar cuatro colores.
 *
 * Ahora el tema es estado de módulo, fijado una vez al arrancar. Cada juego
 * trae el suyo y el render no se entera de cuál es.
 */

export interface Palette {
  bgTop: number;
  bgBottom: number;
  frame: number;
  frameLight: number;
  reelBg: number;
  reelBgAlt: number;
  text: number;
  textDim: number;
  win: number;
  bigWin: number;
  scatter: number;
  /** Solo en juegos con multiplicadores; cae al color de premio si falta. */
  mult?: number;
}

export interface Timing {
  firstReelStop: number;
  reelStagger: number;
  anticipationExtra: number;
  spinSpeed: number;
  anticipationSpeed: number;
  bounce: number;
  winCycle: number;
  countUp: number;
  freeSpinGap: number;
  wildReveal?: number;
}

/**
 * Valores por defecto: se pisan en el arranque con los del juego elegido.
 * Existen para que importar este módulo nunca devuelva `undefined` si algo
 * corre antes de `setActiveTheme` (por ejemplo, un test de render).
 */
export let PALETTE: Palette = {
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
};

export let TIMING: Timing = {
  firstReelStop: 450,
  reelStagger: 110,
  anticipationExtra: 1400,
  spinSpeed: 4200,
  anticipationSpeed: 900,
  bounce: 130,
  winCycle: 800,
  countUp: 900,
  freeSpinGap: 350,
};

/** Fija el tema del juego que se va a cargar. Llamar ANTES de crear la escena. */
export function setActiveTheme(palette: Palette, timing: Timing): void {
  PALETTE = palette;
  TIMING = timing;
}
