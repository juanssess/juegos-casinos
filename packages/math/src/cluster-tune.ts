/**
 * Medición y ajuste de la paytable de un juego de racimos.
 *
 * Sirve exactamente la misma idea que `tune.ts` para los juegos de líneas:
 *
 *   RTP = Σ_{símbolo, tramo}  frecuencia(símbolo, tramo) × premio(símbolo, tramo)
 *
 * y por lo tanto medís las frecuencias UNA vez —caro— y después resolvés los
 * premios con álgebra —gratis—. Que esa linealidad siga valiendo acá no es
 * obvio y merece decirse:
 *
 *   · Qué racimos se forman depende SOLO de las tiras.
 *   · Qué celdas se van depende de qué racimos se formaron, no de cuánto
 *     pagan. Entonces la cadena entera de cascadas es independiente de la
 *     paytable.
 *   · El multiplicador de cada cascada depende del NÚMERO de cascada, que
 *     también es independiente de los premios.
 *
 * Así que un racimo de tamaño 9 en la tercera cascada aporta siempre
 * `premio(sym, tramo(9)) × ×3`, y basta con contar cuántas veces pasa eso
 * PESADO por el multiplicador. Es lo que hace este archivo.
 *
 * Lo único que rompe la linealidad es el TOPE de premio, porque recorta. Por
 * eso se mide sin tope —igual que en Se Busca— y el simulador final reporta
 * cuánto RTP se lleva el recorte.
 */

import type { SymbolId } from './types.ts';
import { SYMBOL_NAMES, PAYING_SYMBOLS } from './types.ts';
import { Sfc32Rng, type Rng } from './rng.ts';
import { roundNice } from './tune.ts';
import {
  createClusterEvaluator,
  CLUSTER_TIERS,
  TIER_LABELS,
  type ClusterGameDef,
} from './cluster.ts';

export interface ClusterFreqReport {
  gameId: string;
  rounds: number;
  /** Cantidad de tramos: el ancho de fila de `base` y `free`. */
  stride: number;
  /** `base[símbolo * stride + tramo]`, pesado por el multiplicador de la cascada. */
  base: Float64Array;
  free: Float64Array;
  /** Rondas cuya caída inicial mostró exactamente `c` scatters. */
  scatter: Float64Array;
  triggers: number;
  freeSpinsPlayed: number;
  cascades: number;
  elapsedMs: number;
}

/**
 * Mide frecuencias consumiendo el RNG EXACTAMENTE igual que el motor:
 * `reels` paradas por caída, y nada más en toda la jugada.
 */
export function measureCluster(
  game: ClusterGameDef,
  opts: { rounds: number; seed?: number; rng?: Rng },
): ClusterFreqReport {
  const rng = opts.rng ?? new Sfc32Rng(opts.seed ?? 0xbeef);
  const ev = createClusterEvaluator(game);
  const cells = game.reels * game.rows;
  const stride = CLUSTER_TIERS.length;

  const grid = ev.newGrid();
  const stops = new Int32Array(game.reels);
  const feed = new Int32Array(game.reels);
  const remove = new Uint8Array(cells);

  const base = new Float64Array(16 * stride);
  const free = new Float64Array(16 * stride);
  const scatter = new Float64Array(cells + 1);

  const ladder = game.cascadeMults;
  const multAt = (i: number): number => ladder[i < ladder.length ? i : ladder.length - 1] ?? 1;

  let triggers = 0;
  let freeSpinsPlayed = 0;
  let cascades = 0;

  /** Corre la cadena de cascadas y acumula en `out`. Devuelve el escalón final. */
  function run(strips: readonly (readonly number[])[], out: Float64Array, rung: number): number {
    for (;;) {
      const list = ev.clusters(grid);
      if (list.length === 0) return rung;
      const mult = multAt(rung);
      for (const c of list) {
        const t = ev.tierOf(c.size);
        if (t >= 0) out[c.symbol * stride + t]! += mult;
      }
      cascades++;
      rung++;
      remove.fill(0);
      for (const c of list) for (const cell of c.cells) remove[cell] = 1;
      ev.tumble(grid, remove, strips, feed);
    }
  }

  const t0 = performance.now();

  for (let i = 0; i < opts.rounds; i++) {
    ev.drop(game.baseStrips, rng, grid, stops, feed);
    const sc = ev.countScatters(grid);
    scatter[sc]! += 1;
    run(game.baseStrips, base, 0);

    if (sc >= game.scattersToTrigger) {
      triggers++;
      let rung = 0;
      let remaining = game.freeSpinsAwarded;
      let played = 0;
      while (remaining > 0 && played < game.maxFreeSpins) {
        remaining--;
        played++;
        ev.drop(game.freeStrips, rng, grid, stops, feed);
        if (ev.countScatters(grid) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }
        const end = run(game.freeStrips, free, rung);
        if (game.freeCarriesLadder) rung = end;
      }
      freeSpinsPlayed += played;
    }
  }

  return {
    gameId: game.id,
    rounds: opts.rounds,
    stride,
    base,
    free,
    scatter,
    triggers,
    freeSpinsPlayed,
    cascades,
    elapsedMs: performance.now() - t0,
  };
}

export interface ClusterContribution {
  symbol: SymbolId;
  name: string;
  base: number;
  feature: number;
  total: number;
  /** Cada cuántas rondas gana un racimo de este símbolo (juego base). */
  oneInBase: number;
}

export interface ClusterRtp {
  base: number;
  feature: number;
  scatter: number;
  total: number;
  bySymbol: ClusterContribution[];
}

/** RTP a partir de frecuencias medidas + una paytable candidata. */
export function clusterRtp(
  game: ClusterGameDef,
  f: ClusterFreqReport,
  paytable: readonly (readonly number[])[] = game.paytable,
): ClusterRtp {
  const divisor = game.betDivisor ?? 20;
  // Un premio está en múltiplos de FICHA, y la apuesta son `divisor` fichas.
  const norm = 1 / (f.rounds * divisor);

  let baseRtp = 0;
  let featureRtp = 0;
  const bySymbol: ClusterContribution[] = [];

  for (const sym of PAYING_SYMBOLS) {
    let b = 0;
    let ft = 0;
    let hits = 0;
    for (let t = 0; t < f.stride; t++) {
      const pay = paytable[sym]?.[t] ?? 0;
      const nb = f.base[sym * f.stride + t] ?? 0;
      const nf = f.free[sym * f.stride + t] ?? 0;
      hits += nb;
      if (pay === 0) continue;
      b += nb * pay * norm;
      ft += nf * pay * norm;
    }
    baseRtp += b;
    featureRtp += ft;
    bySymbol.push({
      symbol: sym,
      name: SYMBOL_NAMES[sym] ?? String(sym),
      base: b,
      feature: ft,
      total: b + ft,
      oneInBase: hits > 0 ? f.rounds / hits : Infinity,
    });
  }

  let scatterRtp = 0;
  for (let c = 0; c < game.scatterPaytable.length; c++) {
    const pay = game.scatterPaytable[c] ?? 0;
    if (pay === 0) continue;
    scatterRtp += ((f.scatter[c] ?? 0) / f.rounds) * pay;
  }

  bySymbol.sort((a, b) => b.total - a.total);
  return {
    base: baseRtp,
    feature: featureRtp,
    scatter: scatterRtp,
    total: baseRtp + featureRtp + scatterRtp,
    bySymbol,
  };
}

/**
 * Legibilidad de la tabla: dentro de un símbolo un racimo más grande tiene
 * que pagar más, y ningún símbolo puede pagar más que otro de arriba suyo.
 *
 * La misma regla que en los juegos de líneas y por la misma razón: el
 * jugador no ve las tiras, ve la tabla, y una tabla desordenada se lee como
 * un error del juego.
 */
export function validateClusterPaytable(
  paytable: readonly (readonly number[])[],
  order: readonly SymbolId[] = PAYING_SYMBOLS,
): string[] {
  const problems: string[] = [];
  const name = (s: SymbolId) => SYMBOL_NAMES[s] ?? String(s);
  const T = CLUSTER_TIERS.length;

  /* Un juego de racimos usa menos símbolos de los que enumera el motor: los
     que no aparecen en ninguna tira tienen la fila en cero. Compararlos
     contra los que sí existen daría "L1 paga más que H4 (9 vs 0)", que es
     verdad y no significa nada. */
  const usados = order.filter((s) => (paytable[s] ?? []).some((v) => v > 0));

  for (const s of usados) {
    const row = paytable[s];
    if (!row) continue;
    for (let t = 1; t < T; t++) {
      const prev = row[t - 1] ?? 0;
      const cur = row[t] ?? 0;
      if (prev > 0 && cur <= prev) {
        problems.push(`${name(s)}: ${TIER_LABELS[t]} paga ${cur}, no más que ${TIER_LABELS[t - 1]} (${prev})`);
      }
    }
  }

  for (let i = 0; i < usados.length - 1; i++) {
    const hi = usados[i]!;
    const lo = usados[i + 1]!;
    for (let t = 0; t < T; t++) {
      const a = paytable[hi]?.[t] ?? 0;
      const b = paytable[lo]?.[t] ?? 0;
      if (b > a) {
        problems.push(`${name(lo)} paga más que ${name(hi)} en ${TIER_LABELS[t]} (${b} vs ${a})`);
      }
    }
  }
  return problems;
}

export interface ClusterSolveOptions {
  targetRtp: number;
  /** Cuánto del RTP de racimos aporta cada símbolo (pesos relativos). */
  shares: Partial<Record<SymbolId, number>>;
  /** Forma de cada fila: relación entre los cinco tramos. */
  shape: Partial<Record<SymbolId, readonly number[]>>;
  tolerance?: number;
}

export interface ClusterSolveResult {
  paytable: number[][];
  rtp: ClusterRtp;
  error: number;
}

/**
 * Resuelve la paytable para un RTP objetivo y un reparto por símbolo.
 *
 * Mismos tres pasos que el solver de líneas: escala exacta por fila,
 * redondeo presentable, y un ajuste goloso que recupera las décimas que se
 * perdieron al redondear — con la monotonía como restricción DURA, para que
 * el optimizador no arregle el RTP rompiendo la jerarquía de la tabla.
 */
export function solveCluster(
  game: ClusterGameDef,
  f: ClusterFreqReport,
  opts: ClusterSolveOptions,
): ClusterSolveResult {
  const tolerance = opts.tolerance ?? 0.0002;
  const T = f.stride;
  const divisor = game.betDivisor ?? 20;
  const norm = 1 / (f.rounds * divisor);

  const scatterRtp = clusterRtp(game, f).scatter;
  const lineTarget = opts.targetRtp - scatterRtp;
  if (lineTarget <= 0) throw new Error('Los scatters solos ya superan el RTP objetivo');

  const symbols = PAYING_SYMBOLS.filter((s) => (opts.shares[s] ?? 0) > 0);
  const totalShare = symbols.reduce((a, s) => a + (opts.shares[s] ?? 0), 0);

  /** Aporte al RTP de una fila candidata. */
  const rowContribution = (sym: SymbolId, row: readonly number[]): number => {
    let acc = 0;
    for (let t = 0; t < T; t++) {
      const pay = row[t] ?? 0;
      if (pay === 0) continue;
      acc += ((f.base[sym * T + t] ?? 0) + (f.free[sym * T + t] ?? 0)) * pay * norm;
    }
    return acc;
  };

  // 1) Escala exacta por fila.
  const paytable: number[][] = Array.from({ length: 16 }, () => new Array<number>(T).fill(0));
  for (const sym of symbols) {
    const shape = opts.shape[sym] ?? game.paytable[sym] ?? [];
    const unit = rowContribution(sym, shape);
    if (unit <= 0) continue;
    const want = lineTarget * ((opts.shares[sym] ?? 0) / totalShare);
    const k = want / unit;
    paytable[sym] = Array.from({ length: T }, (_, t) => (shape[t] ?? 0) * k);
  }

  // 2) Redondeo presentable.
  for (const sym of symbols) {
    paytable[sym] = paytable[sym]!.map((v) => (v === 0 ? 0 : roundNice(v)));
  }

  // 3) Ajuste goloso sobre el residual del redondeo.
  const stepOf = (v: number) => (v < 10 ? 1 : v < 100 ? 5 : v < 500 ? 25 : 50);
  const score = (): [number, number] => [
    validateClusterPaytable(paytable, symbols).length,
    Math.abs(clusterRtp(game, f, paytable).total - opts.targetRtp),
  ];
  const better = (a: [number, number], b: [number, number]) =>
    a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1] - 1e-12;

  for (let iter = 0; iter < 400; iter++) {
    let best = score();
    if (best[0] === 0 && best[1] <= tolerance) break;

    let bestSym = -1;
    let bestT = -1;
    let bestVal = 0;

    for (const sym of symbols) {
      const row = paytable[sym]!;
      for (let t = 0; t < T; t++) {
        const v = row[t] ?? 0;
        if (v === 0) continue;
        for (const d of [stepOf(v), -stepOf(v)]) {
          const nv = v + d;
          if (nv < 1) continue;
          row[t] = nv;
          const s = score();
          row[t] = v;
          if (better(s, best)) {
            best = s;
            bestSym = sym;
            bestT = t;
            bestVal = nv;
          }
        }
      }
    }
    if (bestSym < 0) break;
    paytable[bestSym]![bestT] = bestVal;
  }

  const rtp = clusterRtp(game, f, paytable);
  return { paytable, rtp, error: rtp.total - opts.targetRtp };
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export function formatClusterBreakdown(
  game: ClusterGameDef,
  f: ClusterFreqReport,
  r: ClusterRtp,
): string {
  const out: string[] = [];
  out.push(`Frecuencias medidas sobre ${f.rounds.toLocaleString('es-AR')} rondas`);
  out.push(
    `  feature: 1 de cada ${f.triggers ? (f.rounds / f.triggers).toFixed(0) : '—'} rondas  ·  ` +
      `${f.triggers ? (f.freeSpinsPlayed / f.triggers).toFixed(2) : '—'} giros gratis por disparo`,
  );
  out.push(`  cascadas: ${(f.cascades / f.rounds).toFixed(3)} por ronda`);
  out.push('');
  out.push('Aporte al RTP por símbolo');
  out.push('  símbolo    base     feature   total     frecuencia');
  for (const s of r.bySymbol) {
    out.push(
      `  ${s.name.padEnd(9)} ${pct(s.base).padStart(7)} ${pct(s.feature).padStart(9)} ` +
        `${pct(s.total).padStart(9)}   1 de ${s.oneInBase.toFixed(1)}`,
    );
  }
  out.push(`  ${'SCATTER'.padEnd(9)} ${pct(r.scatter).padStart(7)} ${'—'.padStart(9)} ${pct(r.scatter).padStart(9)}`);
  out.push('');
  out.push(`  RTP base ...... ${pct(r.base + r.scatter)}`);
  out.push(`  RTP feature ... ${pct(r.feature)}`);
  out.push(`  RTP total ..... ${pct(r.total)}`);
  return out.join('\n');
}
