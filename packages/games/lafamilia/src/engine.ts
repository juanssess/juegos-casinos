/** Rival campaign with ammunition, symbol promotion, extra spins and the final vault.
 * Inspired by the bullet/HP progression documented for Mafia Gold. Own odds and payouts.
 * RNG order per feature spin: 5 reel stops, ammunition draw, then 3 vault draws in Cash Hit.
 * All events are server outcomes, persisted in the round and replayed by the client. */
import { SYM, createRoundEngine, createEvaluator, type Rng, type RoundEngine, type RoundResult, type SpinRecord, type BonusVariant } from '@casino/math';
import type { StoryBonusDto } from '@casino/protocol';
import { GAME } from './index.ts';
export const RIVAL_HP = 6;
export const FEATURE_PAY_SCALE = .48;
export type WarRecord = SpinRecord & {
    story: Extract<StoryBonusDto, {
        kind: 'war';
    }>;
};
export function createWarEngine(): RoundEngine {
    const base = createRoundEngine({ ...GAME, freeSpinsAwarded: 0, maxFreeSpins: 0 });
    const ev = createEvaluator({ ...GAME, paytable: GAME.paytable.map(row => row.map(v => Math.round(v * FEATURE_PAY_SCALE))) });
    const grid = ev.newGrid(), stops = new Int32Array(GAME.reels), symbols = [SYM.H2, SYM.H3, SYM.H4, SYM.L1];
    let played = 0;
    function campaign(rng: Rng, bet: number, room: number, records: SpinRecord[] | null, variant?: BonusVariant): number {
        const hp = [RIVAL_HP, RIVAL_HP, RIVAL_HP, RIVAL_HP];
        let remaining = GAME.freeSpinsAwarded + (variant?.extraSpins ?? 0), total = 0;
        played = 0;
        while (remaining > 0 && played < GAME.maxFreeSpins && total < room) {
            remaining--;
            played++;
            ev.spin(GAME.freeStrips, rng, grid, stops);
            const before = [...hp], cashHit = hp.every(v => v === 0), roll = rng.nextInt(1000);
            const bullets = cashHit ? 0 : roll < 350 ? 0 : roll < 650 ? 1 : roll < 850 ? 2 : roll < 950 ? 3 : 4;
            const defeated: number[] = [];
            let awarded = 0;
            for (let b = 0; b < bullets; b++) {
                const rival = hp.findIndex(v => v > 0);
                if (rival < 0)
                    break;
                hp[rival]!--;
                if (hp[rival] === 0) {
                    defeated.push(rival);
                    awarded += rival === 3 ? 4 : 2;
                }
            }
            remaining += awarded;
            const rawGrid = records ? Array.from(grid) : null;
            const promoted: number[] = [];
            for (let c = 0; c < grid.length; c++)
                for (let j = 0; j < 4; j++)
                    if (hp[j] === 0 && grid[c] === symbols[j]) {
                        grid[c] = SYM.H1;
                        if (records)
                            promoted.push(c);
                        break;
                    }
            const safes: number[] = [];
            let collect = 0;
            if (cashHit)
                for (let row = 0; row < GAME.rows; row++) {
                    const r = rng.nextInt(1000000);
                    // Rare maximum safe is an actual outcome; cap applies to the complete round.
                    const value = r < 2 ? 5000 : r < 1002 ? 100 : r < 11002 ? 25 : r < 61002 ? 10 : r < 211002 ? 5 : r < 461002 ? 2 : r < 711002 ? 1 : 0;
                    safes.push(value);
                    for (let col = 0; col < GAME.reels; col++)
                        if (grid[col * GAME.rows + row] === SYM.H1)
                            collect += value * bet;
                }
            let result = records ? ev.evaluate(grid, bet / GAME.paylines.length, 0, 1) : null;
            let lineWin = result ? result.totalWin : ev.evaluateTotal(grid, bet / GAME.paylines.length, 0, 1);
            const available = Math.max(0, room - total), paidLines = Math.min(available, lineWin), paidCollect = Math.min(Math.max(0, available - paidLines), collect);
            if (result) {
                if (lineWin > paidLines) {
                    let left = paidLines;
                    for (const w of result.lineWins) {
                        w.amount = Math.min(left, w.amount);
                        left -= w.amount;
                    }
                }
                result.totalWin = paidLines + paidCollect;
                result.scatterWin = paidCollect;
            }
            total += paidLines + paidCollect;
            if (records) {
                const record: WarRecord = { grid: Array.from(grid), stops: Array.from(stops), multiplier: 1, awarded, result: result!, story: { kind: 'war', rawGrid: rawGrid!, hp: [...hp], before, bullets, defeated, promoted, safes, collect: paidCollect, cashHit, left: remaining } };
                records.push(record);
            }
        }
        return total;
    }
    function finish(rng: Rng, round: RoundResult, variant?: BonusVariant): RoundResult {
        const cap = GAME.maxWinX! * round.bet;
        if (round.baseWin > cap) {
            let left = cap;
            for (const w of round.base.result.lineWins) {
                w.amount = Math.min(left, w.amount);
                left -= w.amount;
            }
            round.base.result.totalWin = cap;
            round.baseWin = cap;
        }
        round.base.awarded = round.triggered ? GAME.freeSpinsAwarded + (variant?.extraSpins ?? 0) : 0;
        if (round.triggered)
            round.featureWin = campaign(rng, round.bet, Math.max(0, cap - round.baseWin), round.free, variant);
        round.totalWin = round.baseWin + round.featureWin;
        return round;
    }
    return { game: GAME, evaluator: base.evaluator!,
        play: (rng, bet, ante) => finish(rng, base.play(rng, bet, ante)),
        playBonus: (rng, bet, variant) => finish(rng, base.playBonus(rng, bet), variant),
        playFast(rng, bet, out, ante) { base.playFast(rng, bet, out, ante); out.baseWin = Math.min(out.baseWin, GAME.maxWinX! * bet); out.featureWin = out.triggered ? campaign(rng, bet, Math.max(0, GAME.maxWinX! * bet - out.baseWin), null) : 0; out.freeSpinsPlayed = out.triggered ? played : 0; out.totalWin = out.baseWin + out.featureWin; }
    };
}
