/** Calibration intention and measured purchase prices. See the generated QA sheet. */
import { SYM, type SymbolId } from '@casino/math';
export const TARGET_RTP = .965;
export const BONUS_BUY_X = 45.4;
export const ANTE_COST_X = 1.218;
export const BASE_STACKS: readonly (readonly number[])[] = [[2, 2, 1, 1], [3, 2, 1, 1], [3, 2, 1, 1], [3, 2, 1, 1], [2, 2, 1, 1]];
export const ANTE_STACKS: readonly (readonly number[])[] = [[3, 2, 1, 1], [3, 2, 2, 1], [3, 2, 2, 1], [3, 2, 2, 1], [3, 2, 1, 1]];
export const BONUS_VARIANTS = [{ id: 'simple', label: 'Guerra de familias', desc: '8 giros · balas, cuatro rivales y acceso a la bóveda final', priceX: BONUS_BUY_X }] as const;
export const SHARES: Partial<Record<SymbolId, number>> = {
    [SYM.H1]: 18,
    [SYM.H2]: 14,
    [SYM.H3]: 11,
    [SYM.H4]: 9,
    [SYM.L1]: 12,
    [SYM.L2]: 11,
    [SYM.L3]: 10,
    [SYM.L4]: 8,
    [SYM.L5]: 7,
};
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
    [SYM.H1]: [0, 0, 0, 1, 6, 30],
    [SYM.H2]: [0, 0, 0, 1, 5, 20],
    [SYM.H3]: [0, 0, 0, 1, 5, 16],
    [SYM.H4]: [0, 0, 0, 1, 4, 14],
    [SYM.L1]: [0, 0, 0, 1, 4, 10],
    [SYM.L2]: [0, 0, 0, 1, 4, 10],
    [SYM.L3]: [0, 0, 0, 1, 3, 8],
    [SYM.L4]: [0, 0, 0, 1, 3, 8],
    [SYM.L5]: [0, 0, 0, 1, 3, 6],
};
