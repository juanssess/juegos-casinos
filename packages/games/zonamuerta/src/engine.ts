/** Infection hunt: two persistent hunters consume radios and carry their power.
 * Base cascades stay unchanged. Bonus spins settle one connected board, without cascades.
 * RNG order: base, two unique hunter positions, then six reel stops per bonus spin.
 * Inspired by the moving/feeding wild structure documented for Zombie Carnival. */
import { SYM, createClusterEngine, createClusterEvaluator, type Rng, type RoundEngine, type RoundResult, type SpinRecord, type FastRound, type BonusVariant, type SpinEval } from '@casino/math';
import type { StoryBonusDto } from '@casino/protocol';
import { GAME } from './index.ts';
export const HUNT_POWER = 3;
export type HuntRecord = SpinRecord & {
    story: Extract<StoryBonusDto, {
        kind: 'hunt';
    }>;
};
export function createHuntEngine(): RoundEngine {
    const base = createClusterEngine({ ...GAME, freeSpinsAwarded: 0, maxFreeSpins: 0 });
    const ev = createClusterEvaluator(GAME), grid = ev.newGrid(), stops = new Int32Array(GAME.reels), feed = new Int32Array(GAME.reels);
    let played = 0;
    function hunt(rng: Rng, bet: number, room: number, records: SpinRecord[] | null, variant?: BonusVariant): number {
        const hunters = [{ cell: rng.nextInt(30), power: variant?.minMultiplier ?? 1 }, { cell: 0, power: variant?.minMultiplier ?? 1 }];
        const second = rng.nextInt(29);
        hunters[1]!.cell = second >= hunters[0]!.cell ? second + 1 : second;
        let total = 0;
        played = 0;
        const count = GAME.freeSpinsAwarded + (variant?.extraSpins ?? 0);
        while (played < count && total < room) {
            ev.drop(GAME.freeStrips, rng, grid, stops, feed);
            // Existing hunter cells are reserved before consuming radios; hunters cannot merge.
            for (const h of hunters)
                grid[h.cell] = SYM.WILD;
            const before = records ? Array.from(grid) : null;
            const moves: {
                from: number;
                to: number;
                power: number;
            }[] = [];
            for (let cell = 0; cell < 30; cell++)
                if (grid[cell] === SYM.SCATTER) {
                    let nearest = 0, distance = Infinity;
                    for (let j = 0; j < hunters.length; j++) {
                        const from = hunters[j]!.cell, d = Math.abs(Math.floor(from / 5) - Math.floor(cell / 5)) + Math.abs(from % 5 - cell % 5);
                        if (d < distance) {
                            distance = d;
                            nearest = j;
                        }
                    }
                    const h = hunters[nearest]!, from = h.cell;
                    // Vacated cells recover their original symbol; a consumed radio becomes H3.
                    // Fast and detailed recover the same symbol using the deterministic reel stops.
                    const col = Math.floor(from / 5), strip = GAME.freeStrips[col]!;
                    const original = strip[(stops[col]! + from % 5) % strip.length]!;
                    grid[from] = original === SYM.SCATTER ? SYM.H3 : original;
                    h.cell = cell;
                    h.power = Math.min(20, h.power + 1);
                    grid[cell] = SYM.WILD;
                    if (records)
                        moves.push({ from, to: cell, power: h.power });
                }
            for (const h of hunters)
                grid[h.cell] = SYM.WILD;
            const clusters = ev.clusters(grid);
            let win = 0;
            const lineWins: SpinEval['lineWins'] = [];
            for (const cluster of clusters) {
                let power = 0;
                for (const h of hunters)
                    if (cluster.cells.includes(h.cell))
                        power += h.power;
                const mult = Math.max(1, power) * HUNT_POWER;
                const amount = Math.min(Math.max(0, room - total - win), ev.payOf(cluster.symbol, cluster.size) * (bet / (GAME.betDivisor ?? 20)) * mult);
                win += amount;
                if (records)
                    lineWins.push({ line: -1, symbol: cluster.symbol, count: cluster.size, mult, amount, cells: [...cluster.cells] });
            }
            total += win;
            played++;
            if (records) {
                const mults = new Array(30).fill(0);
                for (const h of hunters)
                    mults[h.cell] = h.power;
                const record: HuntRecord = { grid: Array.from(grid), stops: Array.from(stops), mults, multiplier: HUNT_POWER, awarded: 0,
                    result: { lineWins, scatterCount: 0, scatterWin: 0, totalWin: win },
                    story: { kind: 'hunt', hunters: hunters.map(h => ({ ...h })), moves, rawGrid: before!, left: count - played } };
                records.push(record);
            }
        }
        return total;
    }
    function finish(rng: Rng, round: RoundResult, variant?: BonusVariant): RoundResult {
        round.base.awarded = round.triggered ? GAME.freeSpinsAwarded + (variant?.extraSpins ?? 0) : 0;
        if (round.triggered)
            round.featureWin = hunt(rng, round.bet, Math.max(0, GAME.maxWinX * round.bet - round.baseWin), round.free, variant);
        round.totalWin = round.baseWin + round.featureWin;
        return round;
    }
    return { game: GAME,
        play: (rng, bet, ante) => finish(rng, base.play(rng, bet, ante)),
        playBonus: (rng, bet, variant) => finish(rng, base.playBonus(rng, bet), variant),
        playFast(rng, bet, out, ante) { base.playFast(rng, bet, out, ante); out.featureWin = out.triggered ? hunt(rng, bet, Math.max(0, GAME.maxWinX * bet - out.baseWin), null) : 0; out.freeSpinsPlayed = out.triggered ? played : 0; out.totalWin = out.baseWin + out.featureWin; }
    };
}
