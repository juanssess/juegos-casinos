/**
 * NACIDO DE FERIA (npm run new-game). La matemática es la del molde
 * hasta que se cambien las tiras o la tabla y se vuelva a medir con el QA.
 *
 * feria — modelo matemático "La Feria" (Hold & Win).
 *
 * El quinto juego, y el primero de la familia Hold & Win (ver
 * `@casino/math` → holdwin.ts): 5×3 con 20 líneas, y monedas con valor en
 * el lugar del scatter. Seis o más arrancan los re-giros con las monedas
 * fijas; llenar la pantalla paga el Grand.
 *
 * El TEMA (la feria de antigüedades de San Telmo) vive en theme.ts.
 */

import {
  SYM,
  buildStrips,
  insertCoinStacks,
  Sfc32Rng,
  type HoldWinDef,
  type ReelStrips,
  type SymbolCounts,
} from '@casino/math';
import { PAYLINES } from './paylines.ts';
import {
  ANTE_STACKS, ANTE_COST_X, BASE_STACKS, BONUS_VARIANTS, COIN_WEIGHTS, JACKPOTS, LAND_PER_MIL,
} from './tuning.ts';

const REELS = 5;
const ROWS = 3;
/** Monedas para disparar y re-giros, las reglas del género. */
const TRIGGER = 6;
const RESPINS = 3;

/**
 * Tabla de líneas: `paytable[símbolo][cantidad]`, en múltiplos de la
 * apuesta por línea. Resuelta por `node tools/tune.ts --game feria` y
 * ajustada después del primer QA: el motor midió 96,25 % ± 0,09 y se subió
 * un escalón a ocho premios de 5 iguales (+0,28 puntos) para llegar al 96,5 %.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0, 0]);
  //                    3    4     5
  t[SYM.H1] = [0, 0, 0, 175, 1100, 5500];
  t[SYM.H2] = [0, 0, 0, 90, 450, 1900];
  t[SYM.H3] = [0, 0, 0, 45, 225, 775];
  t[SYM.H4] = [0, 0, 0, 25, 125, 400];
  t[SYM.L1] = [0, 0, 0, 20, 75, 200];
  t[SYM.L2] = [0, 0, 0, 15, 70, 180];
  t[SYM.L3] = [0, 0, 0, 15, 40, 105];
  t[SYM.L4] = [0, 0, 0, 10, 30, 90];
  t[SYM.L5] = [0, 0, 0, 10, 30, 60];
  return t;
})();

/** Las monedas no pagan en el juego base: su valor se cobra en la función. */
const SCATTER_PAYTABLE: readonly number[] = new Array(16).fill(0);

/** Las tiras de líneas, sin monedas: las monedas se insertan en pilas aparte. */
const LINE_COUNTS: SymbolCounts[] = [0, 1, 2, 3, 4].map((r) => ({
  ...(r >= 1 && r <= 3 ? { [SYM.WILD]: r === 2 ? 4 : 3 } : {}),
  [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7,
  [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 10, [SYM.L4]: 10, [SYM.L5]: 10,
}));

const STRIP_SEED = 0xfe41a;

/**
 * El valor de cada moneda, alineado con la tira: se sortea UNA vez al
 * construir el juego, con semilla fija. En juego no se sortea.
 */
function coinValuesFor(strips: ReelStrips, seed: number): number[][] {
  const rng = new Sfc32Rng(seed);
  const total = COIN_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  const pick = (): number => {
    let r = rng.nextInt(1_000_000) / 1_000_000 * total;
    for (const [v, w] of COIN_WEIGHTS) {
      if (r < w) return v;
      r -= w;
    }
    return COIN_WEIGHTS[0]![0];
  };
  return strips.map((strip) => strip.map((s) => (s === SYM.SCATTER ? pick() : 0)));
}

const LINE_STRIPS = buildStrips(LINE_COUNTS, new Sfc32Rng(STRIP_SEED));
const BASE_STRIPS = insertCoinStacks(LINE_STRIPS, BASE_STACKS, new Sfc32Rng(STRIP_SEED ^ 0x5ac));
const ANTE_STRIPS = insertCoinStacks(LINE_STRIPS, ANTE_STACKS, new Sfc32Rng(STRIP_SEED ^ 0xa17e));

/* Los pesos de los re-giros son enteros (el motor sortea sobre enteros):
   los de la tabla se llevan a milésimas. */
const RESPIN_VALUES = COIN_WEIGHTS.map(([v, w]) => [v, Math.round(w * 1000)] as const);

export const GAME: HoldWinDef = {
  id: 'lafamilia',
  reels: REELS,
  rows: ROWS,
  paylines: PAYLINES,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: BASE_STRIPS,
  // Sin giros gratis: la función es el Hold & Win. Las tiras "free" no se usan.
  freeStrips: BASE_STRIPS,
  anteStrips: ANTE_STRIPS,
  anteCostX: ANTE_COST_X,
  bonusVariants: BONUS_VARIANTS,
  scattersToTrigger: TRIGGER,
  freeSpinsAwarded: 0,
  freeSpinsRetrigger: 0,
  freeSpinMultiplier: 1,
  maxFreeSpins: 0,
  holdWin: {
    trigger: TRIGGER,
    respins: RESPINS,
    baseCoinValues: coinValuesFor(BASE_STRIPS, STRIP_SEED ^ 0xc01),
    anteCoinValues: coinValuesFor(ANTE_STRIPS, STRIP_SEED ^ 0xc02),
    landPerMil: LAND_PER_MIL,
    respinValues: RESPIN_VALUES,
    jackpots: JACKPOTS,
  },
  /** Tope por ronda: 5.000×, el piso del género. */
  maxWinX: 5000,
};

export { PAYLINES, PAYTABLE };
