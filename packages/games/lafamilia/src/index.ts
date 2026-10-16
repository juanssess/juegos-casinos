/** La Familia: 20 base paylines; the separate campaign engine owns the bonus. */
import { SYM, buildStrips, insertCoinStacks, Sfc32Rng, type SlotGameDef, type SymbolCounts, } from '@casino/math';
import { PAYLINES } from './paylines.ts';
import { ANTE_STACKS, ANTE_COST_X, BASE_STACKS, BONUS_VARIANTS, } from './tuning.ts';
const REELS = 5;
const ROWS = 3;
const TRIGGER = 6;
const PAYTABLE: readonly (readonly number[])[] = (() => {
    const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0, 0]);
    t[SYM.H1] = [0, 0, 0, 175, 1100, 5500];
    t[SYM.H2] = [0, 0, 0, 90, 450, 1900];
    t[SYM.H3] = [0, 0, 0, 45, 225, 775];
    t[SYM.H4] = [0, 0, 0, 25, 125, 400];
    t[SYM.L1] = [0, 0, 0, 21, 75, 200];
    t[SYM.L2] = [0, 0, 0, 15, 70, 180];
    t[SYM.L3] = [0, 0, 0, 15, 40, 105];
    t[SYM.L4] = [0, 0, 0, 10, 30, 90];
    t[SYM.L5] = [0, 0, 0, 10, 30, 60];
    return t;
})();
const SCATTER_PAYTABLE: readonly number[] = new Array(16).fill(0);
const LINE_COUNTS: SymbolCounts[] = [0, 1, 2, 3, 4].map((r) => ({
    ...(r >= 1 && r <= 3 ? { [SYM.WILD]: r === 2 ? 4 : 3 } : {}),
    [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7,
    [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 10, [SYM.L4]: 10, [SYM.L5]: 10,
}));
const STRIP_SEED = 0xfe41a;
const LINE_STRIPS = buildStrips(LINE_COUNTS, new Sfc32Rng(STRIP_SEED));
const BASE_STRIPS = insertCoinStacks(LINE_STRIPS, BASE_STACKS, new Sfc32Rng(STRIP_SEED ^ 0x5ac));
const ANTE_STRIPS = insertCoinStacks(LINE_STRIPS, ANTE_STACKS, new Sfc32Rng(STRIP_SEED ^ 0xa17e));
export const GAME: SlotGameDef & {
    maxWinX: number;
} = {
    id: 'lafamilia',
    reels: REELS,
    rows: ROWS,
    paylines: PAYLINES,
    paytable: PAYTABLE,
    scatterPaytable: SCATTER_PAYTABLE,
    baseStrips: BASE_STRIPS,
    freeStrips: BASE_STRIPS,
    anteStrips: ANTE_STRIPS,
    anteCostX: ANTE_COST_X,
    bonusVariants: BONUS_VARIANTS,
    scattersToTrigger: TRIGGER,
    freeSpinsAwarded: 8,
    freeSpinsRetrigger: 0,
    freeSpinMultiplier: 1,
    maxFreeSpins: 18,
    maxWinX: 5000,
};
export { PAYLINES, PAYTABLE };
