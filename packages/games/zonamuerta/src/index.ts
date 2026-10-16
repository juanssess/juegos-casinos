/** Zona Muerta: connected base cascades; the separate hunt engine owns the bonus. */
import { SYM, buildClusterStrips, Sfc32Rng, type ClusterGameDef, type SymbolCounts, } from '@casino/math';
import { ANTE_SCATTERS, ANTE_COST_X, BONUS_VARIANTS } from './tuning.ts';
const REELS = 6;
const ROWS = 5;
const PAYTABLE: readonly (readonly number[])[] = (() => {
    const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0]);
    t[SYM.H1] = [11, 41, 129, 414, 1861];
    t[SYM.H2] = [9, 25, 72, 233, 982];
    t[SYM.H3] = [7, 21, 62, 181, 672];
    t[SYM.L1] = [5, 16, 41, 129, 439];
    t[SYM.L2] = [4, 10, 26, 83, 284];
    t[SYM.L3] = [3, 8, 21, 57, 207];
    return t;
})();
const SCATTER_PAYTABLE: readonly number[] = (() => {
    const t = new Array<number>(REELS * ROWS + 1).fill(0);
    t[4] = 3;
    t[5] = 15;
    t[6] = 60;
    t[7] = 200;
    t[8] = 500;
    return t;
})();
const BASE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, () => ({
    [SYM.WILD]: 1,
    [SYM.SCATTER]: 2,
    [SYM.H1]: 7,
    [SYM.H2]: 8,
    [SYM.H3]: 9,
    [SYM.L1]: 10,
    [SYM.L2]: 11,
    [SYM.L3]: 12,
}));
const FREE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, () => ({
    [SYM.WILD]: 2,
    [SYM.SCATTER]: 1,
    [SYM.H1]: 7,
    [SYM.H2]: 8,
    [SYM.H3]: 9,
    [SYM.L1]: 11,
    [SYM.L2]: 12,
    [SYM.L3]: 12,
}));
const ANTE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
    ...r,
    [SYM.SCATTER]: ANTE_SCATTERS[i]!,
}));
const STRIP_SEED = 0x7ed111a;
export const GAME: ClusterGameDef = {
    id: 'zonamuerta',
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
    freeStrips: buildClusterStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead)),
    scattersToTrigger: 4,
    freeSpinsAwarded: 8,
    freeSpinsRetrigger: 5,
    freeSpinMultiplier: 1,
    maxFreeSpins: 300,
    cascadeMults: [1, 2, 3, 5, 8, 12, 20, 30, 50],
    freeCarriesLadder: false,
    maxWinX: 5000,
};
export { BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
