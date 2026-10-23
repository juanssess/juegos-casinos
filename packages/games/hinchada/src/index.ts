/**
 * hinchada — modelo matemático "La Hinchada": 8 o más iguales en cualquier
 * lado, cascadas, y BENGALAS multiplicadoras (el slot del wild). En el juego
 * base multiplican la secuencia que gana; en los giros gratis se ACUMULAN en
 * un total que no vuelve a cero en toda la función.
 *
 * Es la mecánica de El Carnaval con volatilidad más alta: bengalas de hasta
 * ×1000, ocho por columna en la función, y tope 15.000×. Las decisiones
 * medidas están en tuning.ts y en docs/hinchada-math-sheet.md.
 */

import {
  SYM,
  buildClusterStrips,
  Sfc32Rng,
  type ClusterGameDef,
  type ReelStrips,
  type SymbolCounts,
} from '@casino/math';
import {
  ANTE_SCATTERS, ANTE_COST_X, BASE_BOMB_WEIGHTS, BASE_BOMBS_PER_REEL, BONUS_VARIANTS, BOMB_WEIGHTS, BOMBS_PER_REEL,
} from './tuning.ts';

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
  t[SYM.H1] = [125, 300, 950];
  t[SYM.H2] = [60, 175, 700];
  t[SYM.H3] = [25, 65, 275];
  t[SYM.H4] = [15, 25, 200];
  t[SYM.L1] = [15, 25, 150];
  t[SYM.L2] = [8, 15, 125];
  t[SYM.L3] = [3, 6, 50];
  t[SYM.L4] = [1, 4, 25];
  t[SYM.L5] = [1, 2, 10];
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
const BASE_SCATTERS: readonly number[] = [3, 2, 3, 2, 3, 2];

const BASE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, (_, i) => ({
  [SYM.SCATTER]: BASE_SCATTERS[i]!,
  [SYM.WILD]: BASE_BOMBS_PER_REEL,
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
function bombValuesFor(strips: ReelStrips, seed: number, weights = BOMB_WEIGHTS): number[][] {
  const rng = new Sfc32Rng(seed);
  const total = weights.reduce((a, [, w]) => a + w, 0);
  const pick = (): number => {
    let r = rng.nextInt(total);
    for (const [v, w] of weights) {
      if (r < w) return v;
      r -= w;
    }
    return weights[0]![0];
  };
  return strips.map((strip) => strip.map((s) => (s === SYM.WILD ? pick() : 0)));
}

const STRIP_SEED = 0x51055c0;
const FREE_STRIPS = buildClusterStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead));
const BASE_STRIPS = buildClusterStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED));
const ANTE_STRIPS = buildClusterStrips(ANTE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xa17e));

export const GAME: ClusterGameDef = {
  id: 'hinchada',
  reels: REELS,
  rows: ROWS,
  paylines: [],
  betDivisor: 20,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: BASE_STRIPS,
  anteStrips: ANTE_STRIPS,
  anteCostX: ANTE_COST_X,
  bonusVariants: BONUS_VARIANTS,
  freeStrips: FREE_STRIPS,

  scattersToTrigger: 4,
  scattersToRetrigger: 3,
  freeSpinsAwarded: 15,
  freeSpinsRetrigger: 5,
  freeSpinMultiplier: 1,
  maxFreeSpins: 300,

  payMode: 'anywhere',
  minSize: MIN_SIZE,
  tiers: TIERS,
  tierLabels: TIER_LABELS,
  bombValues: bombValuesFor(FREE_STRIPS, STRIP_SEED ^ 0xb0b),
  baseBombValues: bombValuesFor(BASE_STRIPS, STRIP_SEED ^ 0xba5e, BASE_BOMB_WEIGHTS),
  anteBombValues: bombValuesFor(ANTE_STRIPS, STRIP_SEED ^ 0xa17b, BASE_BOMB_WEIGHTS),
  // LA mecánica de este juego: en la función los multiplicadores se suman.
  accumulateBombs: true,

  // Sin escalera: las cascadas no suben el multiplicador.
  cascadeMults: [1],
  freeCarriesLadder: false,

  /**
   * Tope por ronda: 15.000×. La Hinchada es la versión más volátil de El
   * Carnaval: bengalas de hasta ×1000 que se acumulan. Se probó 20.000× y en
   * 80M de rondas el mayor premio fue ~6.800×: hubiera sido decorativo. El QA
   * controla que este se alcance.
   */
  maxWinX: 15_000,
};

export { BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
