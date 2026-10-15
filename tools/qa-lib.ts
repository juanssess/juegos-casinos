/**
 * Lo que comparten `qa.ts` (mide) y `qa-check.ts` (frena la publicación).
 *
 * La pieza central es la HUELLA de la matemática de un juego: un hash de los
 * archivos que deciden cuánto paga. El QA la guarda junto con los números
 * medidos; si después alguien toca una tira, un precio o el motor, la huella
 * ya no coincide y el juego no se publica hasta volver a medirlo.
 *
 * Entran a la huella todos los archivos de `packages/math/src` (el motor es
 * de todos) y los del juego salvo los que no cambian un pago: el tema, el
 * manifest, la dirección de arte y el propio qa.ts.
 */

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SYMBOL_NAMES, type ArtFile, type GameManifest } from '@casino/math';
import { GAMES_DIR, ROOT } from './games.ts';

const NO_MATH = new Set(['theme.ts', 'manifest.ts', 'qa.ts', 'art.ts']);

function tsFiles(dir: string, skip: Set<string> = new Set()): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith('.ts') && !skip.has(d.name))
    .map((d) => resolve(dir, d.name))
    .sort();
}

export function mathFiles(id: string): string[] {
  return [
    ...tsFiles(resolve(ROOT, 'packages/math/src'), new Set(['manifest.ts'])),
    ...tsFiles(resolve(GAMES_DIR, id, 'src'), NO_MATH),
  ];
}

/** Huella de la matemática. Normaliza los finales de línea: git en Windows los cambia. */
export function sourceHash(id: string): string {
  const h = createHash('sha256');
  for (const file of mathFiles(id)) {
    h.update(file.slice(ROOT.length).replaceAll('\\', '/'));
    h.update('\0');
    h.update(readFileSync(file, 'utf8').replaceAll('\r\n', '\n'));
    h.update('\0');
  }
  return h.digest('hex').slice(0, 16);
}

/** Por qué un juego no se puede publicar, o `null` si se puede. */
export function publishBlocker(m: GameManifest): string | null {
  const art = artProblems(m);
  if (art.length) return 'arte: ' + art.join('; ');
  if (!m.qa) return 'nunca pasó por el QA (npm run qa -- --game ' + m.id + ')';
  if (!m.qa.passed) {
    const fallas = m.qa.checks.filter((c) => c.level === 'error' && !c.ok).map((c) => c.msg);
    return 'el QA no aprobó: ' + fallas.join('; ');
  }
  const now = sourceHash(m.id);
  if (now !== m.qa.sourceHash) {
    return `la matemática cambió después del QA del ${m.qa.date} (huella ${m.qa.sourceHash} → ${now})`;
  }
  return null;
}

/** Los símbolos que el juego pone de verdad en alguna tira. */
function symbolsInPlay(m: GameManifest): Set<number> {
  const used = new Set<number>();
  const g = m.game as { baseStrips: readonly (readonly number[])[]; freeStrips: readonly (readonly number[])[]; anteStrips?: readonly (readonly number[])[] };
  for (const strips of [g.baseStrips, g.freeStrips, g.anteStrips ?? []]) for (const s of strips) for (const sym of s) used.add(sym);
  return used;
}

/**
 * Qué le falta al arte pintado de un juego para publicarse. Todo lo visual
 * del casino es ilustración pintada: un juego con el dibujo procedural, o
 * con el arte prestado de su molde, se juega en desarrollo pero no sale.
 */
export function artProblems(m: GameManifest): string[] {
  const dir = resolve(GAMES_DIR, m.id, 'art');
  const jsonFile = resolve(dir, 'art.json');
  if (!existsSync(jsonFile)) return ['no tiene arte pintado (npm run art -- prompts --game ' + m.id + ')'];
  const art = JSON.parse(readFileSync(jsonFile, 'utf8')) as ArtFile;
  const out: string[] = [];
  if (art.provisional) out.push(`el arte es provisorio (${art.source}): falta el propio`);
  if (!existsSync(resolve(dir, art.symbols.file))) out.push(`falta ${art.symbols.file}`);
  if (!existsSync(resolve(dir, art.scene))) out.push(`falta ${art.scene}`);
  const painted = new Set<number>(art.symbols.order);
  const sinArte = [...symbolsInPlay(m)].filter((s) => !painted.has(s)).map((s) => SYMBOL_NAMES[s]);
  if (sinArte.length) out.push(`símbolos en juego sin arte: ${sinArte.join(', ')}`);
  return out;
}
