/**
 * Las Dunas — nacida de `sebusca` (npm run new-game) y re-ajustada para
 * volatilidad MEDIA. Misma mecánica, otro juego:
 *
 *  - Grilla 5×5, 15 líneas, wilds pegajosos con multiplicador en la función
 *    y multiplicadores que se MULTIPLICAN en una línea, como en Se Busca.
 *  - Pero la tabla de multiplicadores corta en ×10 (Se Busca llega a ×50)
 *    y la función sale más seguido: dos banderas en el rodillo central.
 *    El valor se mueve del bonus al juego base, que acá paga de verdad.
 *  - Tope duro: 5.000× la apuesta (Se Busca: 10.000×).
 *
 * Por qué: la casa no tenía ninguna tragamonedas de volatilidad media. Las
 * Dunas es la travesía larga; Se Busca sigue siendo el duelo.
 *
 * El TEMA (rally de motos en Fiambalá) vive en theme.ts y art.ts. Acá los
 * símbolos son H1..L5, como siempre.
 */

import {
  SYM,
  buildStrips,
  Sfc32Rng,
  type SlotGameDef,
  type SymbolCounts,
} from '@casino/math';
import { ANTE_SCATTERS, ANTE_COST_X, BONUS_VARIANTS } from './tuning.ts';
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
 * Resuelta por tools/tune.ts --game dunas. No editar a mano.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0, 0]);
  //                    3    4     5
  t[SYM.H1] = [0, 0, 0, 70, 200, 700];
  t[SYM.H2] = [0, 0, 0, 35, 100, 275];
  t[SYM.H3] = [0, 0, 0, 35, 80, 225];
  t[SYM.H4] = [0, 0, 0, 20, 50, 125];
  t[SYM.L1] = [0, 0, 0, 15, 40, 75];
  t[SYM.L2] = [0, 0, 0, 15, 40, 75];
  t[SYM.L3] = [0, 0, 0, 15, 30, 75];
  t[SYM.L4] = [0, 0, 0, 15, 30, 60];
  t[SYM.L5] = [0, 0, 0, 15, 30, 60];
  return t;
})();

/** Scatter en múltiplos de la apuesta total. La cola es más brava que en classic20. */
const SCATTER_PAYTABLE: readonly number[] = [0, 0, 0, 2, 15, 100];

/**
 * Tiras del juego base (largo ~64). Decisiones:
 *  - Una bandera por rodillo y DOS en el central: la función sale bastante
 *    más seguido que en Se Busca (1 de 258), y cada una vale menos.
 *  - Sin wilds en los rodillos 1 y 5 (mide exacto el tuner, y el wild
 *    central se siente especial).
 */
const BASE_COUNTS: readonly SymbolCounts[] = [
  // rodillo 1 — sin wild
  { [SYM.H1]: 5, [SYM.H2]: 6, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 1 },
  // rodillo 2
  { [SYM.WILD]: 3, [SYM.H1]: 5, [SYM.H2]: 6, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 1 },
  // rodillo 3 — dos banderas
  { [SYM.WILD]: 4, [SYM.H1]: 5, [SYM.H2]: 6, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 2 },
  // rodillo 4
  { [SYM.WILD]: 3, [SYM.H1]: 5, [SYM.H2]: 6, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 1 },
  // rodillo 5 — sin wild
  { [SYM.H1]: 5, [SYM.H2]: 6, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 1 },
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
  { [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 2, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 2, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.WILD]: 2, [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
  { [SYM.H1]: 3, [SYM.H2]: 4, [SYM.H3]: 5, [SYM.H4]: 6, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 1 },
];

/**
 * TIRAS DE APUESTA ANTE.
 *
 * Se Busca arranca con UN scatter por tira —es el juego de volatilidad muy
 * alta, la feature tiene que costar de encontrar— asi que subir a dos es un
 * salto grande. Como en Maverick, el conteo no se elige: se ajusta midiendo
 * hasta que el RTP con ante coincide con el del base.
 */
const ANTE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
  ...r,
  [SYM.SCATTER]: ANTE_SCATTERS[i]!,
}));

const STRIP_SEED = 0x5eb0_5ca;

export const GAME: SebuscaDef = {
  id: 'dunas',
  reels: REELS,
  rows: ROWS,
  paylines: PAYLINES,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: buildStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED)),
  anteStrips: buildStrips(ANTE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xa17e)),
  anteCostX: ANTE_COST_X,
  bonusVariants: BONUS_VARIANTS,
  freeStrips: buildStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead)),
  scattersToTrigger: 3,
  freeSpinsAwarded: 8,
  freeSpinsRetrigger: 3,
  /** No se usa: acá el multiplicador vive en los wilds pegajosos. */
  freeSpinMultiplier: 1,
  maxFreeSpins: 500,
  /**
   * Multiplicador de un wild nuevo en giros gratis. E[mult] ≈ 2,5.
   *
   * Corta en ×10 (Se Busca llega a ×50). Como los multiplicadores de una
   * línea se multiplican entre sí, el techo de la tabla es lo que más
   * decide la cola: con ×10 dos pegajosos grandes hacen ×100, no ×2.500.
   */
  wildMultsFree: [
    { mult: 2, perMil: 820 },
    { mult: 3, perMil: 160 },
    { mult: 5, perMil: 20 },
  ],
  maxWinX: 5_000,
};

export { PAYLINES, BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
