/**
 * Control de calidad de un juego: lo mide en serio y decide si se publica.
 *
 *   npm run qa -- --game kiosco          medición completa, escribe qa.ts y la ficha
 *   npm run qa -- --all                  todos los juegos, uno detrás de otro
 *   npm run qa -- --game kiosco --quick  una décima parte, solo para mirar (no escribe)
 *
 * Por qué así y no con `sim.ts`: con bombas de ×500 o wilds de ×50 la cola es
 * tan pesada que 100M de rondas pueden errar el RTP por medio punto (le pasó
 * a El Kiosco: una corrida dio 95,87 % y la medición grande 96,54 %). Para
 * fijarlo a ±0,1 hacen falta cientos de millones, y eso solo es razonable
 * repartiéndolo en todos los núcleos. Cada trabajo corre en su proceso
 * (`qa-worker.ts`) y devuelve sumas crudas que acá se combinan de forma exacta.
 *
 * Lo que mide: el juego normal, el juego con apuesta ante y cada variante de
 * la compra del bonus. Lo que controla está en `checks()`: los `error` frenan
 * la publicación (`qa-check.ts` los mira antes de compilar para el casino) y
 * los `warn` son lo que el mercado espera pero no rompe nada.
 */

import { fork } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  classifyVolatility, originalConfigs,
  type OriginalManifest, type QaCheck, type QaSummary, type SlotManifest,
} from '@casino/math';
import { GAMES_DIR, ROOT, gameIds, loadGame } from './games.ts';
import { sourceHash } from './qa-lib.ts';
import type { QaJob, QaJobResult } from './qa-worker.ts';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}
const has = (name: string) => process.argv.includes(`--${name}`);

const QUICK = has('quick');
const SCALE = QUICK ? 0.1 : 1;
const CORES = Number(arg('cores', String(availableParallelism())));
const BASE_ROUNDS = Number(arg('rounds', '8e8')) * SCALE;
const ANTE_ROUNDS = Number(arg('ante-rounds', '4e8')) * SCALE;
const BUYS = Number(arg('buys', '2e6')) * SCALE;
/** Techo de la precisión adaptativa: más allá de esto, el juego necesita otro diseño. */
const MAX_ROUNDS = Number(arg('max-rounds', '4e9'));

/* ── Criterios ────────────────────────────────────────────────────────────
   Los de publicación son de honestidad: el número que se muestra tiene que
   ser el que el juego paga. Los de mercado vienen de la tabla del plan
   (lo que hace "competitivo" a un juego) y son avisos, no frenos. */
const RTP_TOL = 0.002; // ±0,2 puntos sobre el objetivo
const RTP_CI_MAX = 0.0015; // la medición tiene que ser más fina que eso
const BUY_TOL = 0.005; // la compra: ±0,5 puntos
const ANTE_MIN = -0.005; // el ante no puede devolver menos que el juego…
const ANTE_MAX = 0.01; // …ni regalar más de un punto
const CAP_REACH = 0.5; // un tope que nunca se acerca al 50 % es decorativo

const WORKER = resolve(ROOT, 'tools/qa-worker.ts');

/** Corre los trabajos en un pool de procesos, uno por núcleo. */
async function runJobs(jobs: QaJob[], label: string): Promise<QaJobResult[]> {
  const results: QaJobResult[] = [];
  let next = 0;
  let done = 0;
  const t0 = Date.now();
  const tick = () => {
    const secs = (Date.now() - t0) / 1000;
    const eta = done > 0 ? (secs / done) * (jobs.length - done) : 0;
    process.stdout.write(`  ${label}: ${done}/${jobs.length}  ·  ${secs.toFixed(0)}s  ·  faltan ~${eta.toFixed(0)}s   \r`);
  };
  const lane = async (): Promise<void> => {
    while (next < jobs.length) {
      const job = jobs[next++]!;
      results.push(await new Promise<QaJobResult>((ok, fail) => {
        const child = fork(WORKER, [JSON.stringify(job)], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
        let got: QaJobResult | null = null;
        child.on('message', (m) => { got = m as QaJobResult; });
        child.on('exit', (code) => (got ? ok(got) : fail(new Error(`trabajo ${job.kind} #${job.seed} salió con ${code}`))));
      }));
      done++;
      tick();
    }
  };
  tick();
  await Promise.all(Array.from({ length: Math.min(CORES, jobs.length) }, lane));
  process.stdout.write('\n');
  return results;
}

/** Parte `total` en trabajos de tamaño parecido, con semillas distintas. */
function split(game: string, kind: QaJob['kind'], total: number, seedBase: number, variant?: string): QaJob[] {
  // Dos trabajos por núcleo: el que termina antes agarra otro y nadie queda ocioso.
  const parts = Math.max(1, Math.min(CORES * 2, Math.ceil(total / 1000)));
  const each = Math.ceil(total / parts);
  return Array.from({ length: parts }, (_, i) => ({
    game, kind, rounds: each, seed: seedBase + i, ...(variant !== undefined ? { variant } : {}),
  }));
}

interface Agg { n: number; mean: number; ci: number; sd: number; maxX: number; capped: number; r: QaJobResult[] }

function aggregate(rs: QaJobResult[]): Agg {
  let n = 0, s = 0, s2 = 0, maxX = 0, capped = 0;
  for (const r of rs) {
    n += r.n; s += r.sumX; s2 += r.sumX2; capped += r.capped;
    if (r.maxX > maxX) maxX = r.maxX;
  }
  const mean = s / n;
  const sd = Math.sqrt(Math.max(0, s2 / n - mean * mean));
  return { n, mean, sd, ci: (1.96 * sd) / Math.sqrt(n), maxX, capped, r: rs };
}

const sum = (rs: QaJobResult[], k: keyof QaJobResult): number =>
  rs.reduce((a, r) => a + (r[k] as number), 0);

function variantsOf(m: SlotManifest): { id: string; label: string; priceX: number }[] {
  const vs = m.game.bonusVariants ?? [];
  return vs.length ? vs.map((v) => ({ id: v.id, label: v.label, priceX: v.priceX }))
    : [{ id: '', label: 'Compra del bonus', priceX: m.bonusBuyX }];
}

const pct = (v: number, d = 2) => `${(v * 100).toFixed(d).replace('.', ',')} %`;
const pp = (v: number) => `${(v * 100).toFixed(2).replace('.', ',')}`;
/** Número con coma decimal, como se lee en castellano. */
const num = (v: number, d = 2) => v.toLocaleString('es-AR', { maximumFractionDigits: d });

function checks(m: SlotManifest, q: Omit<QaSummary, 'checks' | 'passed'>): QaCheck[] {
  const t = m.targetRtp;
  const out: QaCheck[] = [];
  const add = (id: string, level: QaCheck['level'], ok: boolean, msg: string) => out.push({ id, level, ok, msg });

  add('rtp', 'error', Math.abs(q.rtp - t) <= RTP_TOL,
    `RTP ${pct(q.rtp)} ± ${pp(q.rtpCi)} contra el objetivo ${pct(t)} (tolerancia ±${pp(RTP_TOL)})`);
  add('rtp-precision', 'error', q.rtpCi <= RTP_CI_MAX,
    `precisión de la medición ±${pp(q.rtpCi)} puntos (máximo ±${pp(RTP_CI_MAX)}; si no alcanza, más rondas)`);
  for (const b of q.buy) {
    add(`buy-${b.variant || 'simple'}`, 'error', Math.abs(b.rtp - t) <= BUY_TOL,
      `compra "${b.label}" a ${num(b.priceX, 1)}×: EV ${num(b.ev)}× ± ${num(b.evCi)} → RTP ${pct(b.rtp)} (tolerancia ±${pp(BUY_TOL)})`);
  }
  if (q.ante) {
    const d = q.ante.rtp - q.rtp;
    add('ante', 'error', d >= ANTE_MIN && d <= ANTE_MAX,
      `ante a ${num(q.ante.costX)}×: RTP ${pct(q.ante.rtp)} ± ${pp(q.ante.rtpCi)}, ${d >= 0 ? '+' : ''}${pp(d)} puntos contra el juego normal ` +
        `(admitido de ${pp(ANTE_MIN)} a +${pp(ANTE_MAX)})`);
  }
  if (q.maxWinX !== null) {
    add('tope', 'error', q.maxObservedX >= q.maxWinX * CAP_REACH,
      `tope ${q.maxWinX.toLocaleString('es-AR')}×: el mayor premio medido fue ${q.maxObservedX.toFixed(0)}× ` +
        `(tiene que llegar al ${CAP_REACH * 100} % del tope para no ser decorativo)`);
  }
  add('frecuencia', 'warn', q.hitFrequency >= 0.25 && q.hitFrequency <= 0.35,
    `frecuencia de premio ${pct(q.hitFrequency, 1)} (el mercado: 25 % a 35 %)`);
  add('bonus', 'warn', q.triggerOneIn >= 150 && q.triggerOneIn <= 400,
    `bonus 1 de cada ${q.triggerOneIn.toFixed(0)} rondas (el mercado: de 150 a 400)`);
  if (q.maxWinX !== null) {
    add('tope-mercado', 'warn', q.maxWinX >= 5000,
      `tope ${q.maxWinX.toLocaleString('es-AR')}× (el mercado: 5.000× a 25.000×)`);
  }
  return out;
}

/** Reemplaza (o agrega) el bloque automático de la ficha matemática. */
function writeSheet(id: string, q: QaSummary): void {
  const file = resolve(ROOT, `docs/${id}-math-sheet.md`);
  const ini = '<!-- qa:inicio -->';
  const fin = '<!-- qa:fin -->';
  const rows: string[] = q.original ? originalSheetRows(id, q, ini, fin) : [
    ini,
    `## QA automático — ${q.passed ? 'APROBADO' : 'NO APROBADO'}`,
    '',
    `Generado por \`npm run qa -- --game ${id}\` el ${q.date}. No editar a mano: se reescribe en cada corrida.`,
    `Huella de la matemática: \`${q.sourceHash}\`.`,
    '',
    '| | |',
    '|---|---|',
    `| RTP | **${pct(q.rtp)} ± ${pp(q.rtpCi)}** (${(q.rounds / 1e6).toLocaleString('es-AR')}M de rondas; objetivo ${pct(q.targetRtp)}) |`,
    `| Reparto | base ${pct(q.rtpBase)} · giros gratis ${pct(q.rtpFeature)} |`,
    `| Frecuencia de premio | ${pct(q.hitFrequency, 1)} |`,
    `| Bonus | 1 de cada ${q.triggerOneIn.toFixed(0)} rondas · ${q.freeSpinsPerTrigger.toFixed(2).replace('.', ',')} giros por disparo |`,
    `| Volatilidad | ${q.volatilityLabel} (índice ${q.volatilityIndex.toFixed(1).replace('.', ',')}; desvío ${q.stdDev.toFixed(2).replace('.', ',')}) |`,
    `| Tope | ${q.maxWinX !== null ? `${q.maxWinX.toLocaleString('es-AR')}×` : 'sin tope'} · mayor premio medido ${q.maxObservedX.toFixed(0)}× |`,
    ...q.buy.map((b) => `| Compra "${b.label}" | ${num(b.priceX, 1)}× · EV ${num(b.ev)}× ± ${num(b.evCi)} (${(b.buys / 1e6).toLocaleString('es-AR')}M) → RTP ${pct(b.rtp)} |`),
    ...(q.ante ? [`| Apuesta ante | ${num(q.ante.costX)}× · RTP ${pct(q.ante.rtp)} ± ${pp(q.ante.rtpCi)} · bonus 1 de cada ${q.ante.triggerOneIn.toFixed(0)} |`] : []),
    '',
    'Controles:',
    '',
    ...q.checks.map((c) => `- ${c.ok ? '✓' : c.level === 'error' ? '✗' : '⚠'} ${c.msg}`),
    fin,
  ];
  const block = rows.join('\n');
  let s = existsSync(file) ? readFileSync(file, 'utf8').replaceAll('\r\n', '\n') : `# ${id} — Math Sheet\n\n`;
  const a = s.indexOf(ini);
  const b = s.indexOf(fin);
  if (a !== -1 && b !== -1) {
    s = s.slice(0, a) + block + s.slice(b + fin.length);
  } else {
    const at = s.indexOf('\n## ');
    s = at === -1 ? `${s.trimEnd()}\n\n${block}\n` : `${s.slice(0, at + 1)}${block}\n\n${s.slice(at + 1)}`;
  }
  writeFileSync(file, s, 'utf8');
}

function writeQaFile(id: string, q: QaSummary): void {
  const file = resolve(GAMES_DIR, id, 'src/qa.ts');
  writeFileSync(file,
    `/**\n * Resultado del QA. Lo escribe \`npm run qa -- --game ${id}\`; no editar a mano.\n */\n\n` +
    `import type { QaSummary } from '@casino/math';\n\n` +
    `export const QA: QaSummary | null = ${JSON.stringify(q, null, 2)};\n`, 'utf8');
}

/* ── Los originales ─────────────────────────────────────────────────────
   Su RTP no se estima: se calcula exacto para cada configuración (todos los
   retiros típicos de Crash, cada combinación de minas y casillas, cada tabla
   de Plinko). El QA controla dos cosas: que la fórmula dé el objetivo en
   TODAS, y que el motor —jugado como lo juega el cliente, con su redondeo—
   pague lo que dice la fórmula. Lo segundo es lo que atrapa un error de
   programación: una fórmula linda con un motor que hace otra cosa. */
const ORIG_ROUNDS = Number(arg('orig-rounds', '4e6')) * SCALE;

function originalSheetRows(id: string, q: QaSummary, ini: string, fin: string): string[] {
  const cs = q.original ?? [];
  const lo = Math.min(...cs.map((c) => c.exact));
  const hi = Math.max(...cs.map((c) => c.exact));
  return [
    ini,
    `## QA automático — ${q.passed ? 'APROBADO' : 'NO APROBADO'}`,
    '',
    `Generado por \`npm run qa -- --game ${id}\` el ${q.date}. No editar a mano: se reescribe en cada corrida.`,
    `Huella de la matemática: \`${q.sourceHash}\`.`,
    '',
    '| | |',
    '|---|---|',
    `| RTP exacto | **${pct(lo, 3)} a ${pct(hi, 3)}** en las ${cs.length} configuraciones (objetivo ${pct(q.targetRtp)}) |`,
    `| Motor simulado | ${(q.rounds / 1e6).toLocaleString('es-AR')}M de jugadas en total |`,
    `| Volatilidad | ${q.volatilityLabel} (índice ${q.volatilityIndex.toFixed(1).replace('.', ',')}, en la configuración típica) |`,
    `| Tope | ${q.maxWinX !== null ? `${q.maxWinX.toLocaleString('es-AR')}×` : 'sin tope'} |`,
    '',
    '| Configuración | RTP exacto | Motor (simulado) |',
    '|---|---|---|',
    ...cs.filter((_, i) => cs.length <= 40 || i % Math.ceil(cs.length / 40) === 0)
      .map((c) => `| ${c.label} | ${pct(c.exact, 3)} | ${pct(c.sim, 2)} ± ${pp(c.simCi)} |`),
    ...(cs.length > 40 ? ['', `(${cs.length} configuraciones en total; la tabla muestra una de cada ${Math.ceil(cs.length / 40)}. Todas están en \`src/qa.ts\`.)`] : []),
    '',
    'Controles:',
    '',
    ...q.checks.map((c) => `- ${c.ok ? '✓' : c.level === 'error' ? '✗' : '⚠'} ${c.msg}`),
    fin,
  ];
}

/** La configuración "típica" de cada original: la que da la volatilidad y la frecuencia del pie. */
function typicalConfig(m: OriginalManifest, labels: string[]): number {
  const want = m.def.kind === 'crash' ? 'retiro en ×2' : m.def.kind === 'mines' ? '3 minas, 3 casillas' : '12 filas, riesgo medio';
  const i = labels.indexOf(want);
  return i === -1 ? 0 : i;
}

async function qaOriginal(m: OriginalManifest): Promise<boolean> {
  const t0 = Date.now();
  const id = m.id;
  console.log(`\n━━ QA de ${id} (original, ${m.def.kind}) ${QUICK ? '(rápido: no escribe nada) ' : ''}━━  ${CORES} núcleos`);
  const configs = originalConfigs(m.def);
  // Muchas configuraciones (Mines tiene cientos): el total se reparte entre todas.
  const each = Math.max(200_000, Math.round((ORIG_ROUNDS * 30) / configs.length));
  const jobs: QaJob[] = [];
  configs.forEach((_, k) => {
    const parts = Math.max(1, Math.ceil(each / 1_000_000));
    for (let p = 0; p < parts; p++) {
      jobs.push({ game: id, kind: 'orig', rounds: Math.ceil(each / parts), seed: (Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(p + 1, 0x85ebca6b)) >>> 0, config: k });
    }
  });
  const rs = await runJobs(jobs, `${configs.length} configuraciones`);

  const rows: NonNullable<QaSummary['original']> = configs.map((c, k) => {
    const a = aggregate(rs.filter((r) => r.job.config === k));
    return { label: c.label, exact: c.exact, sim: a.mean, simCi: a.ci, n: a.n };
  });
  const t = m.targetRtp;
  const worst = rows.reduce((w, r) => (Math.abs(r.exact - t) > Math.abs(w.exact - t) ? r : w), rows[0]!);
  /* El motor contra la fórmula. Con cientos de configuraciones (Mines tiene
     256) alguna va a caer lejos por azar: el margen es de 4,5 desvíos, que
     el azar pasa una vez cada 150.000 y un error de programación pasa siempre. */
  const zOf = (r: (typeof rows)[number]) => Math.abs(r.sim - r.exact) / Math.max(r.simCi / 1.96, 1e-9);
  const worstZ = rows.reduce((w, r) => (zOf(r) > zOf(w) ? r : w), rows[0]!);
  // El tope declarado (Crash y Mines lo tienen; en Plinko es el pago más alto de las tablas).
  const cap = 'maxMult' in m.def ? m.def.maxMult : Math.max(...configs.map((c) => c.maxX));
  const typ = typicalConfig(m, rows.map((r) => r.label));
  const typRs = rs.filter((r) => r.job.config === typ);
  const typAgg = aggregate(typRs);

  const cs: QaCheck[] = [
    { id: 'rtp', level: 'error', ok: Math.abs(worst.exact - t) <= RTP_TOL,
      msg: `RTP exacto en las ${rows.length} configuraciones: la más lejos del objetivo es "${worst.label}" con ${pct(worst.exact, 3)} (objetivo ${pct(t)}, tolerancia ±${pp(RTP_TOL)})` },
    { id: 'motor', level: 'error', ok: zOf(worstZ) <= 4.5,
      msg: `el motor paga lo que dice la fórmula: la mayor diferencia es "${worstZ.label}", ${pct(worstZ.sim)} simulado contra ${pct(worstZ.exact, 3)} exacto (${zOf(worstZ).toFixed(1)} desvíos; máximo 4,5)` },
    { id: 'tope', level: 'warn', ok: cap >= 1000,
      msg: `premio máximo ${cap.toLocaleString('es-AR')}× (los originales del mercado: de 1.000× para arriba)` },
  ];
  const total = rows.reduce((a, r) => a + r.n, 0);
  const q: QaSummary = {
    date: new Date().toISOString().slice(0, 10),
    sourceHash: sourceHash(id),
    rounds: total,
    targetRtp: t,
    rtp: rows.reduce((a, r) => Math.min(a, r.exact), Infinity),
    rtpCi: 0,
    rtpBase: rows[typ]!.exact,
    rtpFeature: 0,
    hitFrequency: sum(typRs, 'hits') / typAgg.n,
    triggerOneIn: 0,
    freeSpinsPerTrigger: 0,
    stdDev: typAgg.sd,
    volatilityIndex: 1.645 * typAgg.sd,
    volatilityLabel: classifyVolatility(1.645 * typAgg.sd),
    maxWinX: cap,
    maxObservedX: Math.max(...rs.map((r) => r.maxX)),
    buy: [],
    ante: null,
    checks: cs,
    passed: cs.every((c) => c.level !== 'error' || c.ok),
    original: rows,
  };

  console.log('');
  for (const c of cs) console.log(`  ${c.ok ? '✓' : c.level === 'error' ? '✗' : '⚠'} ${c.msg}`);
  console.log(`\n  ${q.passed ? 'APROBADO' : 'NO APROBADO'} · ${((Date.now() - t0) / 60000).toFixed(1)} min`);
  if (QUICK) {
    console.log('  (modo rápido: no se escribió qa.ts ni la ficha)');
  } else {
    writeQaFile(id, q);
    writeSheet(id, q);
    console.log(`  escrito packages/games/${id}/src/qa.ts y docs/${id}-math-sheet.md`);
  }
  return q.passed;
}

async function qaGame(id: string): Promise<boolean> {
  const loaded = await loadGame(id);
  if (loaded.kind === 'original') return qaOriginal(loaded);
  const m = loaded;
  const t0 = Date.now();
  console.log(`\n━━ QA de ${id} ${QUICK ? '(rápido: no escribe nada) ' : ''}━━  ${CORES} núcleos`);

  let base = aggregate(await runJobs(split(id, 'base', BASE_ROUNDS, 1000), 'juego normal'));
  /* Precisión adaptativa: un juego de cola pesada (Se Busca) necesita varias
     veces más rondas que uno parejo para el mismo intervalo. En vez de una
     cantidad fija para todos, se mide, se ve cuánto falta y se completa: el
     intervalo cae como 1/√n, así que n_necesario = n · (ic / ic_objetivo)². */
  let extra = 0;
  while (!QUICK && base.ci > RTP_CI_MAX * 0.95 && base.n < MAX_ROUNDS) {
    const want = Math.min(MAX_ROUNDS, Math.ceil(base.n * Math.pow(base.ci / (RTP_CI_MAX * 0.9), 2)));
    const more = want - base.n;
    console.log(`  precisión ±${pp(base.ci)}: faltan ~${(more / 1e6).toLocaleString('es-AR')}M de rondas`);
    extra++;
    base = aggregate([...base.r, ...await runJobs(split(id, 'base', more, 1000 + extra * 100_000), 'juego normal (más)')]);
  }
  const ante = m.game.anteStrips
    ? aggregate(await runJobs(split(id, 'ante', ANTE_ROUNDS, 5000), 'apuesta ante'))
    : null;
  const buys: QaSummary['buy'] = [];
  let maxObs = Math.max(base.maxX, ante?.maxX ?? 0);
  for (const [k, v] of variantsOf(m).entries()) {
    const b = aggregate(await runJobs(split(id, 'buy', BUYS, 9000 + k * 500, v.id), `compra ${v.label}`));
    maxObs = Math.max(maxObs, b.maxX);
    buys.push({ variant: v.id, label: v.label, priceX: v.priceX, ev: b.mean, evCi: b.ci, rtp: b.mean / v.priceX, buys: b.n });
  }

  const triggers = sum(base.r, 'triggers');
  const cap = (m.game as { maxWinX?: number }).maxWinX;
  const costX = m.game.anteCostX ?? 1;
  const partial: Omit<QaSummary, 'checks' | 'passed'> = {
    date: new Date().toISOString().slice(0, 10),
    sourceHash: sourceHash(id),
    rounds: base.n,
    targetRtp: m.targetRtp,
    rtp: base.mean,
    rtpCi: base.ci,
    rtpBase: sum(base.r, 'sumBaseX') / base.n,
    rtpFeature: sum(base.r, 'sumFeatX') / base.n,
    hitFrequency: sum(base.r, 'hits') / base.n,
    triggerOneIn: triggers ? base.n / triggers : Infinity,
    freeSpinsPerTrigger: triggers ? sum(base.r, 'freeSpins') / triggers : 0,
    stdDev: base.sd,
    volatilityIndex: 1.645 * base.sd,
    volatilityLabel: classifyVolatility(1.645 * base.sd),
    maxWinX: cap !== undefined && Number.isFinite(cap) ? cap : null,
    maxObservedX: maxObs,
    buy: buys,
    ante: ante ? {
      costX, rtp: ante.mean / costX, rtpCi: ante.ci / costX,
      triggerOneIn: ante.n / Math.max(1, sum(ante.r, 'triggers')), rounds: ante.n,
    } : null,
  };
  const cs = checks(m, partial);
  const q: QaSummary = { ...partial, checks: cs, passed: cs.every((c) => c.level !== 'error' || c.ok) };

  console.log('');
  for (const c of cs) console.log(`  ${c.ok ? '✓' : c.level === 'error' ? '✗' : '⚠'} ${c.msg}`);
  console.log(`\n  ${q.passed ? 'APROBADO' : 'NO APROBADO'} · ${((Date.now() - t0) / 60000).toFixed(1)} min`);

  if (QUICK) {
    console.log('  (modo rápido: no se escribió qa.ts ni la ficha)');
  } else {
    writeQaFile(id, q);
    writeSheet(id, q);
    console.log(`  escrito packages/games/${id}/src/qa.ts y docs/${id}-math-sheet.md`);
  }
  return q.passed;
}

const ids = has('all') ? gameIds() : [arg('game', '')];
if (!ids[0]) {
  console.log(`Uso: npm run qa -- --game <id> [--quick]   ·   juegos: ${gameIds().join(', ')}`);
  process.exit(1);
}
let ok = true;
for (const id of ids) ok = (await qaGame(id)) && ok;
process.exit(ok ? 0 : 1);
