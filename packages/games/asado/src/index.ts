/**
 * asado — modelo matemático "El Asado": 8 o más iguales en cualquier lado,
 * cascadas, y en los giros gratis BRASAS multiplicadoras (el slot del wild)
 * que se quedan hasta el final de la secuencia y multiplican su premio por la
 * suma de todas.
 *
 * Es la mecánica de El Kiosco con volatilidad MEDIA: brasas de hasta ×50,
 * nueve por columna, tres parrillas (scatters) en cada columna del juego base
 * —el bonus sale 1 de cada ~183— y tope 2.500×. Las decisiones medidas están
 * en tuning.ts y en docs/asado-math-sheet.md.
 */

import {
  SYM,
  buildClusterStrips,
  Sfc32Rng,
  type ClusterGameDef,
  type ReelStrips,
  type SymbolCounts,
} from '@casino/math';
import { ANTE_SCATTERS, ANTE_COST_X, BONUS_VARIANTS, BOMB_WEIGHTS, BOMBS_PER_REEL } from './tuning.ts';

const REELS = 6;
const ROWS = 5;

/** Ocho o más en cualquier parte; tramos 8-9, 10-11 y 12+. */
const MIN_SIZE = 8;
const TIERS: readonly (readonly [number, number])[] = [[8, 9], [10, 11], [12, 999]];
const TIER_LABELS: readonly string[] = ['8-9', '10-11', '12+'];

/**
 * Tabla de pagos: `paytable[símbolo][tramo]` en múltiplos de la FICHA
 * (la apuesta dividida en 20).
 *
 * Resuelta por `node tools/tune.ts --game kiosco`. No editar a mano.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0]);
  //           8-9  10-11  12+
  t[SYM.H1] = [175, 450, 1450];
  t[SYM.H2] = [100, 325, 1300];
  t[SYM.H3] = [50, 125, 500];
  t[SYM.H4] = [50, 75, 475];
  t[SYM.L1] = [30, 45, 450];
  t[SYM.L2] = [20, 30, 325];
  t[SYM.L3] = [10, 25, 200];
  t[SYM.L4] = [6, 15, 125];
  t[SYM.L5] = [3, 9, 55];
  return t;
})();

/** Chupetines, en múltiplos de la apuesta TOTAL, por cantidad. */
const SCATTER_PAYTABLE: readonly number[] = (() => {
  const t = new Array<number>(REELS * ROWS + 1).fill(0);
  t[4] = 3;
  t[5] = 5;
  for (let c = 6; c <= REELS * ROWS; c++) t[c] = 100;
  return t;
})();

/**
 * Tiras del juego base.
 *
 * Al revés que en La Vendimia, acá la densidad SÍ manda la jerarquía: un
 * premio es "ocho de treinta", y la probabilidad de juntar ocho cae muy
 * rápido con el conteo. Los bajos van cargados y los altos escasos.
 */
/** Chupetines por columna: tres en las impares y dos en las pares. */
const BASE_SCATTERS: readonly number[] = [3, 3, 3, 3, 3, 3];

const BASE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, (_, i) => ({
  [SYM.SCATTER]: BASE_SCATTERS[i]!,
  [SYM.H1]: 7,
  [SYM.H2]: 8,
  [SYM.H3]: 9,
  [SYM.H4]: 10,
  [SYM.L1]: 11,
  [SYM.L2]: 12,
  [SYM.L3]: 13,
  [SYM.L4]: 14,
  [SYM.L5]: 15,
}));

/** Tiras de los giros gratis: las mismas más las bombas (slot WILD). */
const FREE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r) => ({
  ...r,
  [SYM.WILD]: BOMBS_PER_REEL,
  [SYM.H1]: 5,
  [SYM.H2]: 6,
  [SYM.L3]: 16,
  [SYM.L4]: 20,
  [SYM.L5]: 24,
}));

const ANTE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
  ...r,
  [SYM.SCATTER]: ANTE_SCATTERS[i]!,
}));

/**
 * El valor de cada bomba, alineado con la tira de giros gratis.
 *
 * Se sortea UNA vez, al construir el juego, con semilla fija: es parte de
 * la tira igual que el orden de los símbolos. En juego no se sortea nada.
 */
function bombValuesFor(strips: ReelStrips, seed: number): number[][] {
  const rng = new Sfc32Rng(seed);
  const total = BOMB_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  const pick = (): number => {
    let r = rng.nextInt(total);
    for (const [v, w] of BOMB_WEIGHTS) {
      if (r < w) return v;
      r -= w;
    }
    return BOMB_WEIGHTS[0]![0];
  };
  return strips.map((strip) => strip.map((s) => (s === SYM.WILD ? pick() : 0)));
}

const STRIP_SEED = 0x51055c0;
const FREE_STRIPS = buildClusterStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead));

export const GAME: ClusterGameDef = {
  id: 'asado',
  reels: REELS,
  rows: ROWS,
  paylines: [],
  betDivisor: 20,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: buildClusterStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED)),
  anteStrips: buildClusterStrips(ANTE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xa17e)),
  anteCostX: ANTE_COST_X,
  bonusVariants: BONUS_VARIANTS,
  freeStrips: FREE_STRIPS,

  scattersToTrigger: 4,
  scattersToRetrigger: 3,
  freeSpinsAwarded: 10,
  freeSpinsRetrigger: 5,
  freeSpinMultiplier: 1,
  maxFreeSpins: 300,

  payMode: 'anywhere',
  minSize: MIN_SIZE,
  tiers: TIERS,
  tierLabels: TIER_LABELS,
  bombValues: bombValuesFor(FREE_STRIPS, STRIP_SEED ^ 0xb0b),

  // Sin escalera: las cascadas no suben el multiplicador.
  cascadeMults: [1],
  freeCarriesLadder: false,

  /** Tope de premio por ronda: 2.500×. Es un juego de volatilidad media (el QA controla que se alcance). */
  maxWinX: 2_500,
};

export { BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
