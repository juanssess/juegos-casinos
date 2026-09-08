/**
 * Simulador Monte Carlo.
 *
 * Esto es lo que convierte "una animación linda" en "un juego". Sin esto no
 * sabés si tu slot paga 96% o 130%, y con 130% te fundís en una semana.
 *
 * Referencia de precisión: el error estándar del RTP cae con 1/sqrt(N).
 * Con 10^6 giros el RTP tiene ±0.5% aprox; con 10^8, ±0.05%. Para firmar una
 * math sheet se usan 10^8–10^9.
 */

import type { SlotGameDef } from './types.ts';
import type { Rng } from './rng.ts';
import { createRoundEngine, type FastRound, type RoundEngine } from './round.ts';
import { Sfc32Rng } from './rng.ts';

export interface SimOptions {
  rounds: number;
  /** Apuesta en créditos. Debe ser múltiplo de la cantidad de líneas. */
  bet?: number;
  seed?: number;
  rng?: Rng;
  /**
   * Motor a usar. Por defecto el genérico de líneas; un juego con mecánicas
   * propias (wilds pegajosos, cascadas) pasa el suyo y el simulador no
   * necesita saber nada de la mecánica: solo consume FastRound.
   */
  engine?: RoundEngine;
  /** Callback de progreso cada `chunk` rondas. */
  onProgress?: (done: number, total: number) => void;
  chunk?: number;
  /**
   * Simular con apuesta ante: tiras con mas scatters y costo multiplicado.
   * Es la medicion que decide si el ante es honesto, asi que el costo se
   * aplica de verdad al total apostado.
   */
  ante?: boolean;
}

export interface SimReport {
  gameId: string;
  rounds: number;
  bet: number;
  rtpTotal: number;
  rtpBase: number;
  rtpFeature: number;
  /** Porcentaje del RTP que aporta la feature. */
  featureShare: number;
  /** Fracción de rondas con premio > 0. */
  hitFrequency: number;
  /** 1 en N rondas dispara la feature. */
  triggerOneIn: number;
  triggers: number;
  avgFreeSpinsPerTrigger: number;
  /**
   * E[premio de la ronda | disparó], en múltiplos de apuesta. ESTE número es
   * el que define el precio de la compra del bonus: precio = EV / RTP_objetivo.
   */
  avgTriggerWinX: number;
  /** Distribución de niveles alcanzados en la Escalinata (índice 0 = nivel 1). */
  tierCounts: number[];
  /** Premio máximo observado, en múltiplos de la apuesta. */
  maxWinX: number;
  /** Desvío estándar del premio por ronda, en múltiplos de apuesta. */
  stdDev: number;
  /**
   * Error estándar del RTP estimado (sigma / sqrt(N)).
   *
   * Sin esto un reporte de RTP es una opinión. En un juego de cola pesada la
   * media converge lentísimo: con 5M rondas acá el RTP baila casi medio punto,
   * y medio punto es la diferencia entre ganar plata y perderla.
   */
  rtpStdError: number;
  /** Índice de volatilidad estándar de la industria (90% de confianza). */
  volatilityIndex: number;
  volatilityLabel: string;
  /** Distribución de premios: etiqueta → fracción de rondas. */
  distribution: { label: string; rounds: number; share: number }[];
  elapsedMs: number;
}

const BUCKETS: readonly { label: string; max: number }[] = [
  { label: 'sin premio', max: 0 },
  { label: '0–1x', max: 1 },
  { label: '1–2x', max: 2 },
  { label: '2–5x', max: 5 },
  { label: '5–10x', max: 10 },
  { label: '10–20x', max: 20 },
  { label: '20–50x', max: 50 },
  { label: '50–100x', max: 100 },
  { label: '100–500x', max: 500 },
  { label: '500x+', max: Infinity },
];

function classifyVolatility(vi: number): string {
  if (vi < 6) return 'baja';
  if (vi < 11) return 'media';
  if (vi < 16) return 'media-alta';
  if (vi < 22) return 'alta';
  return 'muy alta';
}

export function simulate(game: SlotGameDef, opts: SimOptions): SimReport {
  const rounds = opts.rounds;
  const bet = opts.bet ?? game.paylines.length;
  if (bet % game.paylines.length !== 0) {
    throw new Error(
      `La apuesta (${bet}) debe ser múltiplo de la cantidad de líneas (${game.paylines.length})`,
    );
  }

  const rng = opts.rng ?? new Sfc32Rng(opts.seed ?? 0x1234abcd);
  const engine = opts.engine ?? createRoundEngine(game);
  const chunk = opts.chunk ?? 1_000_000;

  const out: FastRound = {
    baseWin: 0,
    featureWin: 0,
    totalWin: 0,
    triggered: false,
    freeSpinsPlayed: 0,
    tier: 0,
  };

  let sumBase = 0;
  let sumFeature = 0;
  let hits = 0;
  let triggers = 0;
  let freeSpins = 0;
  let sumTriggerWin = 0;
  const tierCounts = new Float64Array(game.climb ? game.climb.tiers.length : 0);
  let maxWin = 0;
  let sumX = 0;
  let sumX2 = 0;
  const bucketCounts = new Float64Array(BUCKETS.length);

  const t0 = performance.now();

  for (let i = 0; i < rounds; i++) {
    engine.playFast(rng, bet, out, opts.ante === true);

    sumBase += out.baseWin;
    sumFeature += out.featureWin;
    if (out.totalWin > 0) hits++;
    if (out.triggered) {
      triggers++;
      freeSpins += out.freeSpinsPlayed;
      sumTriggerWin += out.totalWin;
      if (out.tier > 0) tierCounts[out.tier - 1]! += 1;
    }

    const x = out.totalWin / bet;
    if (x > maxWin) maxWin = x;
    sumX += x;
    sumX2 += x * x;

    // Bucket: el primero cuyo techo alcanza a x (0 exacto cae en "sin premio").
    let b = 0;
    if (x > 0) {
      b = 1;
      while (b < BUCKETS.length - 1 && x > BUCKETS[b]!.max) b++;
    }
    bucketCounts[b]!++;

    if (opts.onProgress && (i + 1) % chunk === 0) opts.onProgress(i + 1, rounds);
  }

  const elapsedMs = performance.now() - t0;
  /* Con apuesta ante cada ronda cuesta mas, asi que lo apostado NO es
     rondas x apuesta. Olvidarse de esto daria un RTP inflado justo en la
     medicion que decide si el ante es honesto. */
  const costoX = opts.ante === true ? (game.anteCostX ?? 1) : 1;
  const totalBet = rounds * bet * costoX;
  const rtpBase = sumBase / totalBet;
  const rtpFeature = sumFeature / totalBet;
  const rtpTotal = rtpBase + rtpFeature;

  const mean = sumX / rounds;
  const variance = Math.max(0, sumX2 / rounds - mean * mean);
  const stdDev = Math.sqrt(variance);
  // Índice de volatilidad: z * sigma con z = 1.645 (90% de confianza).
  const volatilityIndex = 1.645 * stdDev;

  return {
    gameId: game.id,
    rounds,
    bet,
    rtpTotal,
    rtpBase,
    rtpFeature,
    featureShare: rtpTotal > 0 ? rtpFeature / rtpTotal : 0,
    hitFrequency: hits / rounds,
    triggerOneIn: triggers > 0 ? rounds / triggers : Infinity,
    triggers,
    avgFreeSpinsPerTrigger: triggers > 0 ? freeSpins / triggers : 0,
    avgTriggerWinX: triggers > 0 ? sumTriggerWin / triggers / bet : 0,
    tierCounts: Array.from(tierCounts),
    maxWinX: maxWin,
    stdDev,
    rtpStdError: stdDev / Math.sqrt(rounds),
    volatilityIndex,
    volatilityLabel: classifyVolatility(volatilityIndex),
    distribution: BUCKETS.map((b, i) => ({
      label: b.label,
      rounds: bucketCounts[i]!,
      share: bucketCounts[i]! / rounds,
    })),
    elapsedMs,
  };
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export function formatReport(r: SimReport): string {
  const lines: string[] = [];
  const spinsPerSec = r.rounds / (r.elapsedMs / 1000);

  lines.push(`Juego: ${r.gameId}`);
  lines.push(
    `Rondas: ${r.rounds.toLocaleString('es-AR')}  ·  apuesta ${r.bet} créditos  ·  ` +
      `${(r.elapsedMs / 1000).toFixed(1)}s (${Math.round(spinsPerSec).toLocaleString('es-AR')}/s)`,
  );
  lines.push('');
  lines.push('RTP');
  const ci = 1.96 * r.rtpStdError;
  lines.push(
    `  total .................. ${pct(r.rtpTotal)}  ± ${(ci * 100).toFixed(3)} ` +
      `(95% conf.)  →  [${pct(r.rtpTotal - ci)}, ${pct(r.rtpTotal + ci)}]`,
  );
  lines.push(`  juego base ............. ${pct(r.rtpBase)}`);
  lines.push(`  giros gratis ........... ${pct(r.rtpFeature)}  (${pct(r.featureShare)} del total)`);
  lines.push('');
  lines.push('Comportamiento');
  lines.push(`  frecuencia de premio ... ${pct(r.hitFrequency)}  (1 de cada ${(1 / r.hitFrequency).toFixed(1)})`);
  lines.push(`  disparo de feature ..... 1 de cada ${r.triggerOneIn.toFixed(0)} rondas`);
  lines.push(`  giros gratis / disparo . ${r.avgFreeSpinsPerTrigger.toFixed(2)}`);
  lines.push(`  EV del bonus ........... ${r.avgTriggerWinX.toFixed(2)}x la apuesta`);
  lines.push(
    `  precio de compra ....... a RTP 96.5% → ${(r.avgTriggerWinX / 0.965).toFixed(1)}x` +
      `  ·  a 96.0% → ${(r.avgTriggerWinX / 0.96).toFixed(1)}x`,
  );
  if (r.tierCounts.length > 0 && r.triggers > 0) {
    lines.push('');
    lines.push('Escalinata (nivel alcanzado)');
    for (let i = 0; i < r.tierCounts.length; i++) {
      const share = r.tierCounts[i]! / r.triggers;
      const bar = '█'.repeat(Math.round(share * 30));
      lines.push(`  nivel ${i + 1} ..... ${pct(share).padStart(7)}  ${bar}`);
    }
  }
  lines.push(`  premio máximo .......... ${r.maxWinX.toFixed(1)}x`);
  lines.push(`  desvío estándar ........ ${r.stdDev.toFixed(2)}`);
  lines.push(`  índice de volatilidad .. ${r.volatilityIndex.toFixed(1)} (${r.volatilityLabel})`);
  lines.push('');
  lines.push('Distribución de premios');
  const maxShare = Math.max(...r.distribution.map((d) => d.share));
  for (const d of r.distribution) {
    const bar = '█'.repeat(Math.round((d.share / maxShare) * 28));
    lines.push(`  ${d.label.padEnd(11)} ${pct(d.share).padStart(7)}  ${bar}`);
  }
  return lines.join('\n');
}
