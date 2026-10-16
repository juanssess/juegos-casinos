/** Exploratory calibration only. Publication still requires the independent QA gate. */
import { Sfc32Rng, type FastRound } from '@casino/math';
import { loadSlot } from './games.ts';
const id = process.argv[2] ?? 'zonamuerta', n = Number(process.argv[3] ?? 5e6), buys = Number(process.argv[4] ?? 50000);
const m = await loadSlot(id), engine = m.engine(), bet = 20;
const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
for (const ante of [false, true]) {
    const rng = new Sfc32Rng(42312);
    let base = 0, feature = 0, triggers = 0, max = 0, sq = 0;
    for (let i = 0; i < n; i++) {
        engine.playFast(rng, bet, out, ante);
        base += out.baseWin / bet;
        feature += out.featureWin / bet;
        sq += (out.totalWin / bet) ** 2;
        max = Math.max(max, out.totalWin / bet);
        triggers += Number(out.triggered);
    }
    const mean = (base + feature) / n;
    console.log(JSON.stringify({ id, ante, n, base: base / n, feature: feature / n, gross: mean, rtp: mean / (ante ? m.game.anteCostX! : 1), ci: 1.96 * Math.sqrt(sq / n - mean * mean) / Math.sqrt(n), triggerEvery: n / triggers, max }));
}
for (const variant of m.game.bonusVariants ?? []) {
    const rng = new Sfc32Rng(9517);
    let sum = 0, sq = 0, max = 0, final = 0;
    for (let i = 0; i < buys; i++) {
        const r = engine.playBonus(rng, bet, variant), v = r.totalWin / bet;
        sum += v;
        sq += v * v;
        max = Math.max(max, v);
        final += Number(r.free.some(s => (s as any).story?.cashHit));
    }
    const mean = sum / buys;
    console.log(JSON.stringify({ id, variant: variant.id, buys, ev: mean, ci: 1.96 * Math.sqrt(sq / buys - mean * mean) / Math.sqrt(buys), price: mean / .965, max, finalRate: final / buys }));
}
