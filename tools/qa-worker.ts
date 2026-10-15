/**
 * Un trabajo del QA, en su propio proceso.
 *
 * Lo lanza `qa.ts`, uno por núcleo. Devuelve SUMAS CRUDAS y no promedios:
 * así el orquestador combina los trabajos de forma exacta (la varianza de la
 * unión no es el promedio de las varianzas) y no hay que confiar en que
 * todos los trabajos hayan sido del mismo tamaño.
 *
 *   node tools/qa-worker.ts '{"game":"kiosco","kind":"base","rounds":5e7,"seed":1}'
 */

import { Sfc32Rng, type FastRound } from '@casino/math';
import { loadGame } from './games.ts';

export interface QaJob {
  game: string;
  kind: 'base' | 'ante' | 'buy';
  rounds: number;
  seed: number;
  /** Solo en `buy`: la variante a comprar ('' = la compra simple). */
  variant?: string;
}

export interface QaJobResult {
  job: QaJob;
  n: number;
  /** Premio en veces la apuesta: suma, suma de cuadrados y máximo. */
  sumX: number;
  sumX2: number;
  maxX: number;
  /** Solo rondas: lo que aporta el juego base y la feature. */
  sumBaseX: number;
  sumFeatX: number;
  hits: number;
  triggers: number;
  freeSpins: number;
  /** Rondas o compras que llegaron al tope. */
  capped: number;
  ms: number;
}

async function run(job: QaJob): Promise<QaJobResult> {
  const m = await loadGame(job.game);
  const game = m.game;
  const engine = m.engine();
  const rng = new Sfc32Rng(job.seed);
  const bet = game.paylines.length || game.betDivisor || 20;
  const cap = (game as { maxWinX?: number }).maxWinX ?? Infinity;
  const r: QaJobResult = {
    job, n: job.rounds, sumX: 0, sumX2: 0, maxX: 0, sumBaseX: 0, sumFeatX: 0,
    hits: 0, triggers: 0, freeSpins: 0, capped: 0, ms: 0,
  };
  const t0 = performance.now();

  if (job.kind === 'buy') {
    const variant = job.variant ? (game.bonusVariants ?? []).find((v) => v.id === job.variant) : undefined;
    for (let i = 0; i < job.rounds; i++) {
      const x = engine.playBonus(rng, bet, variant).totalWin / bet;
      r.sumX += x;
      r.sumX2 += x * x;
      if (x > r.maxX) r.maxX = x;
      if (x >= cap - 1e-9) r.capped++;
    }
  } else {
    const ante = job.kind === 'ante';
    const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
    for (let i = 0; i < job.rounds; i++) {
      engine.playFast(rng, bet, out, ante);
      const x = out.totalWin / bet;
      r.sumX += x;
      r.sumX2 += x * x;
      r.sumBaseX += out.baseWin / bet;
      r.sumFeatX += out.featureWin / bet;
      if (x > r.maxX) r.maxX = x;
      if (x > 0) r.hits++;
      if (out.triggered) {
        r.triggers++;
        r.freeSpins += out.freeSpinsPlayed;
      }
      if (x >= cap - 1e-9) r.capped++;
    }
  }

  r.ms = performance.now() - t0;
  return r;
}

const job = JSON.parse(process.argv[2] ?? '{}') as QaJob;
const result = await run(job);
if (process.send) process.send(result);
else console.log(JSON.stringify(result));
