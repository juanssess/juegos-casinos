/** Calibration intention and measured purchase prices. See the generated QA sheet. */
import { SYM, type SymbolId } from '@casino/math';
export const TARGET_RTP = .965;
export const BONUS_BUY_X = 54.7;
export const ANTE_COST_X = 1.59;
export const ANTE_SCATTERS: readonly number[] = [3, 3, 2, 2, 3, 3];
export const BONUS_VARIANTS = [
    { id: 'simple', label: 'La cacería', desc: '8 giros · dos infectados persiguen radios y acumulan potencia', priceX: BONUS_BUY_X },
    { id: 'grande', label: 'Noche sin salida', desc: '12 giros · más tiempo para que crezcan los infectados', extraSpins: 4, priceX: 94.5 },
    { id: 'reserva', label: 'Contagio avanzado', desc: '8 giros · ambos infectados arrancan con potencia ×3', minMultiplier: 3, priceX: 104.0 },
] as const;
export const SHARES: Partial<Record<SymbolId, number>> = {
    [SYM.H1]: 20,
    [SYM.H2]: 18,
    [SYM.H3]: 17,
    [SYM.L1]: 16,
    [SYM.L2]: 15,
    [SYM.L3]: 14,
};
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
    [SYM.H1]: [1, 3.2, 10, 34, 140],
    [SYM.H2]: [1, 3.1, 9, 30, 120],
    [SYM.H3]: [1, 3.0, 8.5, 27, 100],
    [SYM.L1]: [1, 2.9, 8, 24, 85],
    [SYM.L2]: [1, 2.8, 7.5, 22, 75],
    [SYM.L3]: [1, 2.7, 7, 20, 68],
};
