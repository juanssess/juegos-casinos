/**
 * Construcción de tiras de rodillo (reel strips).
 *
 * Un slot NO sortea un símbolo por celda. Sortea una POSICIÓN DE PARADA en
 * una tira fija y muestra `rows` símbolos consecutivos. La composición de la
 * tira es lo que controla frecuencia, y el ORDEN es lo que controla la
 * sensación de juego (los "casi gané", los scatters que caen de a dos).
 *
 * Por eso los scatters y wilds se colocan espaciados a propósito: si los
 * dejás caer al azar, se apelotonan y el juego se siente roto aunque el RTP
 * dé bien.
 */

import type { ReelStrips, SymbolId } from './types.ts';
import { SYM } from './types.ts';
import type { Rng } from './rng.ts';

/** Cuántas veces aparece cada símbolo en una tira. */
export type SymbolCounts = Partial<Record<SymbolId, number>>;

/** Símbolos que se distribuyen con espaciado forzado. */
const SPACED: readonly SymbolId[] = [SYM.SCATTER, SYM.WILD];

/** Máximo de símbolos idénticos consecutivos permitidos en una tira. */
const MAX_RUN = 3;

function shuffle<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
}

/**
 * Arma una tira a partir de un conteo de símbolos.
 * El largo total es la suma de los conteos.
 */
export function buildStrip(counts: SymbolCounts, rng: Rng): SymbolId[] {
  const length = Object.values(counts).reduce<number>((a, b) => a + (b ?? 0), 0);
  if (length === 0) throw new Error('La tira no puede estar vacía');

  const strip: SymbolId[] = new Array(length).fill(-1);

  // 1) Símbolos espaciados: se reparten en segmentos iguales con jitter,
  //    de modo que nunca queden pegados.
  for (const sym of SPACED) {
    const n = counts[sym] ?? 0;
    if (n === 0) continue;
    const segment = length / n;
    for (let i = 0; i < n; i++) {
      const jitter = Math.max(1, Math.floor(segment * 0.6));
      let p = Math.floor(i * segment) + rng.nextInt(jitter);
      // Si la posición está tomada, avanzamos hasta la primera libre.
      let guard = 0;
      while (strip[p % length] !== -1 && guard++ < length) p++;
      strip[p % length] = sym;
    }
  }

  // 2) El resto se mezcla y rellena los huecos.
  const rest: SymbolId[] = [];
  for (const [key, n] of Object.entries(counts)) {
    const sym = Number(key);
    if (SPACED.includes(sym)) continue;
    for (let i = 0; i < (n ?? 0); i++) rest.push(sym);
  }
  shuffle(rest, rng);

  let k = 0;
  for (let i = 0; i < length; i++) {
    if (strip[i] === -1) strip[i] = rest[k++]!;
  }

  // 3) Reparación: rompemos corridas largas de un mismo símbolo, que se ven
  //    feas al girar. Es cosmético, no cambia la composición (solo el orden),
  //    así que el RTP no se mueve.
  breakLongRuns(strip, rng);

  return strip;
}

/** Rompe corridas de más de MAX_RUN símbolos iguales intercambiando posiciones. */
function breakLongRuns(strip: SymbolId[], rng: Rng): void {
  const n = strip.length;
  for (let attempt = 0; attempt < 200; attempt++) {
    let fixed = true;
    for (let i = 0; i < n; i++) {
      let run = 1;
      while (run <= MAX_RUN && strip[(i + run) % n] === strip[i]) run++;
      if (run <= MAX_RUN) continue;

      // Buscamos una posición donde el swap no cree otra corrida.
      const bad = (i + MAX_RUN) % n;
      for (let t = 0; t < 40; t++) {
        const j = rng.nextInt(n);
        if (strip[j] === strip[bad]) continue;
        if (SPACED.includes(strip[j]!) || SPACED.includes(strip[bad]!)) continue;
        const a = strip[bad]!;
        strip[bad] = strip[j]!;
        strip[j] = a;
        fixed = false;
        break;
      }
    }
    if (fixed) return;
  }
}

/** Arma las 5 tiras de un juego a partir de una lista de conteos por rodillo. */
export function buildStrips(perReel: readonly SymbolCounts[], rng: Rng): ReelStrips {
  return perReel.map((counts) => buildStrip(counts, rng));
}

/** Reporte de composición, para revisar una tira de un vistazo. */
export function describeStrips(strips: ReelStrips, names: readonly string[]): string {
  const lines: string[] = [];
  for (let r = 0; r < strips.length; r++) {
    const strip = strips[r]!;
    const tally = new Map<number, number>();
    for (const s of strip) tally.set(s, (tally.get(s) ?? 0) + 1);
    const parts = [...tally.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([s, c]) => `${names[s]}:${c}`);
    lines.push(`  rodillo ${r + 1} (largo ${strip.length}) → ${parts.join(' ')}`);
  }
  return lines.join('\n');
}
