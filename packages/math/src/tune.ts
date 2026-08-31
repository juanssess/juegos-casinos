/**
 * Medición de frecuencias y ajuste de la paytable.
 *
 * La idea clave: el RTP es LINEAL en los premios.
 *
 *   RTP = Σ_{símbolo, cantidad}  frecuencia(símbolo, cantidad) × premio(símbolo, cantidad)
 *
 * Las frecuencias dependen SOLO de las tiras de rodillo. Los premios son
 * variables libres. Entonces no hace falta simular en cada intento: medís las
 * frecuencias una vez (caro) y después resolvés la paytable con una cuenta
 * (gratis). Así se tunea un slot de verdad — no probando números a ojo.
 *
 * Corolario práctico: si querés cambiar la SENSACIÓN del juego (volatilidad,
 * cada cuánto entra la feature) tocás las TIRAS y volvés a medir. Si querés
 * cambiar el RTP, tocás los PREMIOS y no hace falta re-medir.
 */

import type { SlotGameDef, SymbolId } from './types.ts';
import { SYMBOL_NAMES, PAYING_SYMBOLS } from './types.ts';
import { Sfc32Rng, type Rng } from './rng.ts';
import { createEvaluator } from './evaluate.ts';
import { resolveClimb } from './round.ts';

export interface FreqReport {
  gameId: string;
  rounds: number;
  lineCount: number;
  stride: number;
  /** Veces que (símbolo, cantidad) ganó una línea en el juego base. */
  base: Float64Array;
  /**
   * Ídem dentro de la feature, YA PESADO por el multiplicador de cada giro.
   * Así el RTP sigue siendo `Σ frecuencia × premio` aunque el multiplicador
   * varíe por paquete de la Escalinata.
   */
  free: Float64Array;
  /** Rondas en las que el giro base mostró exactamente `c` scatters. */
  scatter: Float64Array;
  triggers: number;
  freeSpinsPlayed: number;
  elapsedMs: number;
}

export function measure(
  game: SlotGameDef,
  opts: { rounds: number; seed?: number; rng?: Rng },
): FreqReport {
  const rng = opts.rng ?? new Sfc32Rng(opts.seed ?? 0xbeef);
  const ev = createEvaluator(game);
  const grid = ev.newGrid();
  const stride = ev.tallyStride;
  const size = 16 * stride;

  const base = new Float64Array(size);
  const free = new Float64Array(size);
  const scatter = new Float64Array(game.reels * game.rows + 1);

  let triggers = 0;
  let freeSpinsPlayed = 0;

  const t0 = performance.now();

  for (let i = 0; i < opts.rounds; i++) {
    ev.spin(game.baseStrips, rng, grid);
    ev.tallyLineWins(grid, base);
    const sc = ev.countScatters(grid);
    scatter[sc] = (scatter[sc] ?? 0) + 1;

    if (sc >= game.scattersToTrigger) {
      triggers++;
      let remaining = game.freeSpinsAwarded;
      let multiplier = game.freeSpinMultiplier;
      if (game.climb) {
        // MISMO orden de sorteos que el motor: base → escalada → giros.
        const climb = resolveClimb(game, rng);
        remaining = climb.spins;
        multiplier = climb.multiplier;
      }
      let played = 0;
      while (remaining > 0 && played < game.maxFreeSpins) {
        remaining--;
        played++;
        ev.spin(game.freeStrips, rng, grid);
        ev.tallyLineWins(grid, free, multiplier);
        if (ev.countScatters(grid) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }
      }
      freeSpinsPlayed += played;
    }
  }

  return {
    gameId: game.id,
    rounds: opts.rounds,
    lineCount: game.paylines.length,
    stride,
    base,
    free,
    scatter,
    triggers,
    freeSpinsPlayed,
    elapsedMs: performance.now() - t0,
  };
}

export interface SymbolContribution {
  symbol: SymbolId;
  name: string;
  /** Aporte al RTP del juego base. */
  base: number;
  /** Aporte al RTP dentro de la feature (ya con multiplicador). */
  feature: number;
  total: number;
  /** Cada cuántas rondas aparece una combinación pagadora de este símbolo. */
  oneInBase: number;
}

export interface RtpBreakdown {
  base: number;
  feature: number;
  scatter: number;
  total: number;
  bySymbol: SymbolContribution[];
}

/**
 * Calcula el RTP a partir de frecuencias medidas + una paytable candidata.
 * Es una suma ponderada: cuesta microsegundos, no minutos.
 */
export function rtpFromFreq(
  game: SlotGameDef,
  f: FreqReport,
  paytable: readonly (readonly number[])[] = game.paytable,
  scatterPaytable: readonly number[] = game.scatterPaytable,
): RtpBreakdown {
  const { rounds, lineCount, stride } = f;
  // Un premio de línea está en múltiplos de lineBet, y bet = lineCount × lineBet.
  // Entonces su aporte al RTP es premio / lineCount.
  const norm = 1 / (rounds * lineCount);

  let baseRtp = 0;
  let featureRtp = 0;
  const bySymbol: SymbolContribution[] = [];

  for (const sym of PAYING_SYMBOLS) {
    let b = 0;
    let ft = 0;
    let hitsBase = 0;
    for (let c = 0; c <= game.reels; c++) {
      const pay = paytable[sym]?.[c] ?? 0;
      if (pay === 0) continue;
      const nb = f.base[sym * stride + c] ?? 0;
      const nf = f.free[sym * stride + c] ?? 0; // ya pesado por multiplicador
      b += nb * pay * norm;
      ft += nf * pay * norm;
      hitsBase += nb;
    }
    baseRtp += b;
    featureRtp += ft;
    bySymbol.push({
      symbol: sym,
      name: SYMBOL_NAMES[sym] ?? String(sym),
      base: b,
      feature: ft,
      total: b + ft,
      oneInBase: hitsBase > 0 ? rounds / hitsBase : Infinity,
    });
  }

  let scatterRtp = 0;
  for (let c = 0; c < scatterPaytable.length; c++) {
    const pay = scatterPaytable[c] ?? 0;
    if (pay === 0) continue;
    scatterRtp += ((f.scatter[c] ?? 0) / rounds) * pay;
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
 * Factor por el que hay que multiplicar TODOS los premios de línea para
 * llegar al RTP objetivo, dejando los pagos de scatter como están.
 *
 * Sale de despejar:  objetivo = k × rtpLíneas + rtpScatter
 */
export function solveLineScale(
  game: SlotGameDef,
  f: FreqReport,
  targetRtp: number,
  paytable: readonly (readonly number[])[] = game.paytable,
): number {
  const r = rtpFromFreq(game, f, paytable);
  const lineRtp = r.base + r.feature;
  if (lineRtp <= 0) throw new Error('La paytable candidata no paga nada');
  return (targetRtp - r.scatter) / lineRtp;
}

/**
 * Redondea a un valor presentable de tabla de pagos.
 *
 * Los jugadores leen 5, 10, 25, 100 — no 13.47. Pero cuanto más grueso el
 * redondeo, más se corre el RTP: por eso solo redondeamos fuerte los números
 * grandes, donde un escalón representa un porcentaje chico del valor.
 */
export function roundNice(v: number): number {
  if (v <= 0) return 0;
  if (v < 10) return Math.max(1, Math.round(v));
  if (v < 100) return Math.round(v / 5) * 5;
  if (v < 500) return Math.round(v / 25) * 25;
  return Math.round(v / 50) * 50;
}

/** Contribución al RTP de UNA fila de la paytable (un símbolo). */
function rowContribution(
  game: SlotGameDef,
  f: FreqReport,
  sym: SymbolId,
  row: readonly number[],
): number {
  const norm = 1 / (f.rounds * f.lineCount);
  let acc = 0;
  for (let c = 0; c <= game.reels; c++) {
    const pay = row[c] ?? 0;
    if (pay === 0) continue;
    const nb = f.base[sym * f.stride + c] ?? 0;
    const nf = f.free[sym * f.stride + c] ?? 0; // ya pesado por multiplicador
    acc += (nb + nf) * pay * norm;
  }
  return acc;
}

export interface SolveOptions {
  targetRtp: number;
  /**
   * Cuánto del RTP de líneas debe aportar cada símbolo. Los valores se
   * normalizan, así que podés pasar pesos relativos (5, 3, 1...) sin que
   * sumen 1. Esta es LA decisión de diseño: define si el juego se siente
   * generoso y chato o tacaño y explosivo.
   */
  shares: Partial<Record<SymbolId, number>>;
  /**
   * Forma de cada fila: la relación entre pagar 3, 4 y 5 símbolos.
   * Solo importa la proporción; la escala la resuelve el solver.
   * Por defecto se toma la forma de la paytable actual del juego.
   */
  shape?: Partial<Record<SymbolId, readonly number[]>>;
  /** Tolerancia de RTP para el ajuste final. */
  tolerance?: number;
}

export interface SolveResult {
  paytable: number[][];
  rtp: RtpBreakdown;
  /** Diferencia contra el objetivo, en puntos de RTP. */
  error: number;
}

/**
 * Resuelve la paytable para un RTP objetivo Y un reparto deseado por símbolo.
 *
 * Tres pasos:
 *  1. Escala cada fila para que aporte exactamente lo que le toca (exacto).
 *  2. Redondea a números presentables (esto rompe el RTP unas décimas).
 *  3. Recupera esas décimas con un ajuste goloso: prueba mover cada premio un
 *     escalón y se queda con el movimiento que más acerca al objetivo.
 *
 * El paso 3 es el que en la práctica hace la diferencia entre "96.5%" y
 * "92% porque redondeé".
 */
export function solveByTargets(
  game: SlotGameDef,
  f: FreqReport,
  opts: SolveOptions,
): SolveResult {
  const tolerance = opts.tolerance ?? 0.0002;
  const scatterRtp = rtpFromFreq(game, f, game.paytable).scatter;
  const lineTarget = opts.targetRtp - scatterRtp;
  if (lineTarget <= 0) throw new Error('Los scatters solos ya superan el RTP objetivo');

  const symbols = PAYING_SYMBOLS.filter((s) => (opts.shares[s] ?? 0) > 0);
  const totalShare = symbols.reduce((a, s) => a + (opts.shares[s] ?? 0), 0);

  // 1) Escala exacta por fila.
  const paytable: number[][] = game.paytable.map((r) => [...r]);
  for (const sym of symbols) {
    const shape = opts.shape?.[sym] ?? game.paytable[sym] ?? [];
    const unit = rowContribution(game, f, sym, shape);
    if (unit <= 0) continue;
    const want = lineTarget * ((opts.shares[sym] ?? 0) / totalShare);
    const k = want / unit;
    paytable[sym] = shape.map((v) => v * k);
  }

  // 2) Redondeo presentable.
  for (const sym of symbols) {
    paytable[sym] = paytable[sym]!.map((v) => (v === 0 ? 0 : roundNice(v)));
  }

  // 3) Ajuste goloso sobre el residual del redondeo, CON la monotonía como
  //    restricción dura. Sin esta restricción el optimizador arregla el RTP
  //    rompiendo la jerarquía (le sube el premio al símbolo que le resulte más
  //    barato mover) y termina con un H4 que paga más que un H3.
  const step = (v: number) => (v < 10 ? 1 : v < 100 ? 5 : v < 500 ? 25 : 50);

  /** Puntaje lexicográfico: primero legibilidad, después precisión de RTP. */
  const score = (): [number, number] => [
    validatePaytable(game, paytable, symbols).length,
    Math.abs(rtpFromFreq(game, f, paytable).total - opts.targetRtp),
  ];
  const better = (a: [number, number], b: [number, number]) =>
    a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1] - 1e-12;

  for (let iter = 0; iter < 500; iter++) {
    let best = score();
    if (best[0] === 0 && best[1] <= tolerance) break;

    let bestSym = -1;
    let bestC = -1;
    let bestVal = 0;

    for (const sym of symbols) {
      const row = paytable[sym]!;
      for (let c = 3; c <= game.reels; c++) {
        const v = row[c] ?? 0;
        if (v === 0) continue;
        for (const d of [step(v), -step(v)]) {
          const nv = v + d;
          if (nv < 1) continue;
          row[c] = nv;
          const s = score();
          row[c] = v;
          if (better(s, best)) {
            best = s;
            bestSym = sym;
            bestC = c;
            bestVal = nv;
          }
        }
      }
    }

    if (bestSym < 0) break; // ningún movimiento mejora: piso de granularidad
    paytable[bestSym]![bestC] = bestVal;
  }

  const rtp = rtpFromFreq(game, f, paytable);
  return { paytable, rtp, error: rtp.total - opts.targetRtp };
}

/** Aplica un factor a los premios de línea y redondea a valores presentables. */
export function scalePaytable(
  paytable: readonly (readonly number[])[],
  k: number,
  nice = true,
): number[][] {
  return paytable.map((row) =>
    row.map((v) => (v === 0 ? 0 : nice ? roundNice(v * k) : v * k)),
  );
}

/**
 * Verifica que la paytable sea LEÍBLE para un jugador.
 *
 * Un solver puede alcanzar el RTP objetivo con una tabla que no tiene sentido:
 * si un símbolo quedó raro en las tiras, el solver le va a subir el premio
 * hasta que pague más que uno "mejor". El jugador no ve las tiras — ve la
 * tabla, y una tabla desordenada se lee como un error.
 *
 * Reglas:
 *  - Dentro de un símbolo, más cantidad tiene que pagar más.
 *  - En el orden de jerarquía (H1 arriba, L5 abajo), ningún símbolo puede
 *    pagar más que otro que está por encima suyo.
 *
 * Si esto falla, el arreglo va en las TIRAS o en los pesos, nunca parcheando
 * el premio a mano: eso te rompe el RTP.
 */
export function validatePaytable(
  game: SlotGameDef,
  paytable: readonly (readonly number[])[],
  order: readonly SymbolId[] = PAYING_SYMBOLS,
): string[] {
  const problems: string[] = [];
  const name = (s: SymbolId) => SYMBOL_NAMES[s] ?? String(s);

  for (const s of order) {
    const row = paytable[s];
    if (!row) continue;
    for (let c = 4; c <= game.reels; c++) {
      const prev = row[c - 1] ?? 0;
      const cur = row[c] ?? 0;
      if (prev > 0 && cur <= prev) {
        problems.push(`${name(s)}: ${c} símbolos paga ${cur}, no más que ${c - 1} (${prev})`);
      }
    }
  }

  for (let i = 0; i < order.length - 1; i++) {
    const hi = order[i]!;
    const lo = order[i + 1]!;
    for (let c = 3; c <= game.reels; c++) {
      const a = paytable[hi]?.[c] ?? 0;
      const b = paytable[lo]?.[c] ?? 0;
      if (b > a) {
        problems.push(
          `${name(lo)} paga más que ${name(hi)} con ${c} símbolos (${b} vs ${a})`,
        );
      }
    }
  }

  return problems;
}

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export function formatBreakdown(game: SlotGameDef, f: FreqReport, r: RtpBreakdown): string {
  const out: string[] = [];
  out.push(`Frecuencias medidas sobre ${f.rounds.toLocaleString('es-AR')} rondas`);
  out.push(
    `  feature: 1 de cada ${(f.rounds / f.triggers).toFixed(0)} rondas  ·  ` +
      `${(f.freeSpinsPlayed / f.triggers).toFixed(2)} giros gratis por disparo`,
  );
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
