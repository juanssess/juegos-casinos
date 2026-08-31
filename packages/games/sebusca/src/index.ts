/**
 * sebusca — modelo matemático "Se Busca" (western, estilo Wanted Dead or a Wild).
 *
 * Qué lo define, y en qué se diferencia de classic20:
 *
 *  - Grilla 5×5, 15 líneas.
 *  - VOLATILIDAD EXTREMA. La feature es rara (1 en ~250) y ahí vive la mitad
 *    del RTP. El juego base es un desierto a propósito: el jugador está
 *    comprando boletos para el duelo.
 *  - Wilds con MULTIPLICADOR. En el juego base valen ×1; en los giros gratis
 *    cada wild que cae sortea un multiplicador (×2..×50) y queda PEGADO en
 *    su celda hasta el final de la feature.
 *  - Los multiplicadores de una línea se MULTIPLICAN entre sí. Un ×10 y un
 *    ×25 en la misma línea es ×250. Esa composición multiplicativa es la que
 *    fabrica la cola larga — y la razón del tope de premio.
 *  - Tope duro: 10.000× la apuesta. La ronda se corta ahí.
 *
 * El TEMA (forajidos, cantina, revólveres) vive en la capa de skin del
 * cliente. Acá los símbolos son H1..L5, como siempre.
 */

import {
  SYM,
  buildStrips,
  Sfc32Rng,
  type SlotGameDef,
  type SymbolCounts,
} from '@casino/math';
import { PAYLINES } from './paylines.ts';

const REELS = 5;
const ROWS = 5;

/** Un escalón de la tabla de multiplicadores de wild. */
export interface WildMult {
  mult: number;
  /** Peso en milésimas; la tabla completa suma 1000. */
  perMil: number;
}

/** Definición extendida: lo que Se Busca agrega sobre un slot de líneas. */
export interface SebuscaDef extends SlotGameDef {
  /** Multiplicadores posibles de un wild NUEVO durante los giros gratis. */
  wildMultsFree: readonly WildMult[];
  /** Tope de premio por ronda, en múltiplos de la apuesta. */
  maxWinX: number;
}

/**
 * Tabla de pagos, en múltiplos de la apuesta por línea.
 * Resuelta por tools/tune.ts --game sebusca. No editar a mano.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0, 0]);
  //                    3    4     5
  t[SYM.H1] = [0, 0, 0, 60, 400, 2900];
  t[SYM.H2] = [0, 0, 0, 30, 175, 850];
  t[SYM.H3] = [0, 0, 0, 20, 90, 350];
  t[SYM.H4] = [0, 0, 0, 15, 55, 250];
  t[SYM.L1] = [0, 0, 0, 7, 30, 85];
  t[SYM.L2] = [0, 0, 0, 7, 20, 75];
  t[SYM.L3] = [0, 0, 0, 6, 20, 65];
  t[SYM.L4] = [0, 0, 0, 6, 15, 50];
  t[SYM.L5] = [0, 0, 0, 6, 15, 45];
  return t;
})();

/** Scatter en múltiplos de la apuesta total. La cola es más brava que en classic20. */
const SCATTER_PAYTABLE: readonly number[] = [0, 0, 0, 2, 15, 100];

/**
 * Tiras del juego base (largo ~64). Decisiones:
 *  - UN scatter por rodillo: con ventana de 5 filas, es lo que deja el
 *    disparo en ~1 de 250 rondas.
 *  - Sin wilds en los rodillos 1 y 5 (mide exacto el tuner, y el wild
 *    central se siente especial).
 *  - Los altos son raros: el juego base tiene que ser un desierto.
 */
const BASE_COUNTS: readonly SymbolCounts[] = [
  // rodillo 1 — sin wild
  { [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  // rodillo 2
  { [SYM.WILD]: 3, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  // rodillo 3
  { [SYM.WILD]: 4, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  // rodillo 4
  { [SYM.WILD]: 3, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  // rodillo 5 — sin wild
  { [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
];

/**
 * Tiras de los giros gratis.
 *
 * POCOS wilds, a propósito: cada pegajoso ayuda a TODOS los giros que
 * siguen, así que su valor se compone. La primera versión tenía 4-5 por
 * rodillo y la feature valía 5 veces el juego entero — el tuner la delató.
 * Con 2-3 por rodillo central, cada wild que cae es un evento.
 */
const FREE_COUNTS: readonly SymbolCounts[] = [
  { [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 2, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 3, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 2, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
];

const STRIP_SEED = 0x5eb0_5ca;

export const GAME: SebuscaDef = {
  id: 'sebusca',
  reels: REELS,
  rows: ROWS,
  paylines: PAYLINES,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: buildStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED)),
  freeStrips: buildStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead)),
  scattersToTrigger: 3,
  freeSpinsAwarded: 8,
  freeSpinsRetrigger: 3,
  /** No se usa: acá el multiplicador vive en los wilds pegajosos. */
  freeSpinMultiplier: 1,
  maxFreeSpins: 500,
  /**
   * Multiplicador de un wild nuevo en giros gratis. E[mult] ≈ 3.1.
   *
   * La primera versión llegaba a ×100: la cola compuesta era tan pesada que
   * el tope de 10.000× recortaba 3.7 puntos de RTP — o sea que el 4% del
   * valor del juego vivía en premios que casi nadie ve jamás. Un juego así
   * declara un RTP que la experiencia real no entrega. Tope de la tabla en
   * ×50 (3 en mil): sigue siendo la historia que se cuenta, sin esconder el
   * RTP en la estratósfera.
   */
  wildMultsFree: [
    { mult: 2, perMil: 660 },
    { mult: 3, perMil: 215 },
    { mult: 5, perMil: 80 },
    { mult: 10, perMil: 30 },
    { mult: 25, perMil: 12 },
    { mult: 50, perMil: 3 },
  ],
  maxWinX: 10_000,
};

export { PAYLINES, BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
