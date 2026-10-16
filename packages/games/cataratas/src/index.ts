/**
 * cataratas — modelo matemático "Las Cataratas": CAMINOS con columnas de
 * altura variable, cascadas y un multiplicador que sube con cada cascada en
 * la función y no vuelve atrás.
 *
 * El séptimo juego, y el primero donde la grilla cambia de forma en cada
 * jugada.
 *
 *  - Seis columnas, y cada una muestra de 2 a 7 símbolos: la altura se
 *    sortea en cada caída. Un premio es un símbolo en columnas SEGUIDAS
 *    desde la primera, y paga la tabla por la cantidad de CAMINOS: el
 *    producto de cuántas veces está en cada columna. Con todas en siete son
 *    117.649 caminos.
 *  - El wild (solo en las columnas 2 a 5) sustituye a cualquier pagador.
 *  - CASCADAS en todas las jugadas: lo que gana se va y cae lo de arriba. La
 *    altura de cada columna se mantiene hasta la próxima caída.
 *  - GIROS GRATIS: cuatro o más medallones. Ahí cada cascada que gana suma
 *    uno al multiplicador, y el multiplicador sigue donde quedó en el giro
 *    siguiente: la función empieza en ×1 y no vuelve a bajar.
 *
 * Usa el motor de racimos en modo `ways` (ver cluster.ts): de la caída para
 * adelante todo sale de las paradas y las alturas, sin un sorteo más.
 */

import {
  SYM,
  buildClusterStrips,
  Sfc32Rng,
  type ClusterGameDef,
  type SymbolCounts,
} from '@casino/math';
import { ANTE_SCATTERS, ANTE_COST_X, BONUS_VARIANTS, HEIGHT_WEIGHTS } from './tuning.ts';

const REELS = 6;
/** La altura MÁXIMA de una columna: la grilla se guarda siempre de 6×7. */
const ROWS = 7;

/** De tres columnas en adelante; un tramo por cantidad de columnas. */
const MIN_SIZE = 3;
const TIERS: readonly (readonly [number, number])[] = [[3, 3], [4, 4], [5, 5], [6, 6]];
const TIER_LABELS: readonly string[] = ['3', '4', '5', '6'];

/**
 * Tabla de pagos: `paytable[símbolo][columnas - 3]`, en múltiplos de la
 * FICHA (la apuesta dividida en 20), POR CAMINO.
 *
 * Resuelta por `node tools/tune.ts --game cataratas`. No editar a mano.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0]);
  //            3    4    5    6
  t[SYM.H1] = [5, 15, 40, 125];
  t[SYM.H2] = [3, 9, 30, 85];
  t[SYM.H3] = [3, 6, 20, 60];
  t[SYM.H4] = [3, 6, 15, 50];
  t[SYM.L1] = [2, 3, 8, 35];
  t[SYM.L2] = [1, 2, 6, 20];
  t[SYM.L3] = [1, 2, 4, 15];
  t[SYM.L4] = [1, 2, 3, 15];
  t[SYM.L5] = [1, 2, 3, 10];
  return t;
})();

/** Medallones, en múltiplos de la apuesta TOTAL, por cantidad en la caída. */
const SCATTER_PAYTABLE: readonly number[] = (() => {
  const t = new Array<number>(REELS * ROWS + 1).fill(0);
  t[4] = 2;
  t[5] = 5;
  for (let c = 6; c <= REELS * ROWS; c++) t[c] = 20;
  return t;
})();

/** Medallones por columna en el juego base. */
const BASE_SCATTERS: readonly number[] = [4, 3, 4, 3, 4, 3];

/**
 * Tiras del juego base. Largas (~120) porque una columna puede mostrar
 * siete: con tiras cortas la misma columna se repetiría a la vista.
 *
 * El wild solo en las columnas 2 a 5: en la primera arrancaría caminos de
 * cualquier símbolo, y en la sexta no agrega nada que no haga la quinta.
 */
const BASE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, (_, i) => ({
  [SYM.SCATTER]: BASE_SCATTERS[i]!,
  ...(i >= 1 && i <= 4 ? { [SYM.WILD]: 2 } : {}),
  [SYM.H1]: 8,
  [SYM.H2]: 9,
  [SYM.H3]: 10,
  [SYM.H4]: 11,
  [SYM.L1]: 13,
  [SYM.L2]: 14,
  [SYM.L3]: 15,
  [SYM.L4]: 16,
  [SYM.L5]: 17,
}));

/** Tiras de la función: algo más cargadas de bajos, para que cascadeen. */
const FREE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
  ...r,
  ...(i >= 1 && i <= 4 ? { [SYM.WILD]: 8 } : {}),
  [SYM.L3]: 17,
  [SYM.L4]: 18,
  [SYM.L5]: 19,
}));

const ANTE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
  ...r,
  [SYM.SCATTER]: ANTE_SCATTERS[i]!,
}));

const STRIP_SEED = 0x1605a7a;
const STACKS = { runPerCent: 50, triplePerCent: 30 };
const BASE_STRIPS = buildClusterStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED), STACKS);
const FREE_STRIPS = buildClusterStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xf4ee), STACKS);
const ANTE_STRIPS = buildClusterStrips(ANTE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xa17e), STACKS);

/** La escalera de la función: +1 por cascada que gana, sin techo práctico. */
const FREE_LADDER: readonly number[] = Array.from({ length: 500 }, (_, i) => i + 1);

export const GAME: ClusterGameDef = {
  id: 'cataratas',
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
  freeSpinsAwarded: 12,
  freeSpinsRetrigger: 5,
  freeSpinMultiplier: 1,
  maxFreeSpins: 300,

  payMode: 'ways',
  heightWeights: HEIGHT_WEIGHTS,
  minSize: MIN_SIZE,
  tiers: TIERS,
  tierLabels: TIER_LABELS,

  // La base paga sin multiplicar; en la función cada cascada suma uno y no se reinicia.
  baseCascadeMults: [1],
  cascadeMults: FREE_LADDER,
  freeCarriesLadder: true,

  maxWinX: 10_000,
};

export { BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
