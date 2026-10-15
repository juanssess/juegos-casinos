/**
 * Registro de juegos para las herramientas de línea de comandos.
 *
 * Ya no es una lista: recorre `packages/games/` y carga el `manifest.ts` de
 * cada carpeta. Un juego nuevo aparece en `sim`, `tune`, `buyprice` y `qa`
 * en cuanto existe su manifest — que es exactamente lo que genera
 * `npm run new-game`.
 *
 * La forma de cada entrada (unión discriminada por `kind`) está en
 * `@casino/math` → manifest.ts.
 */

import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { GameManifest } from '@casino/math';

export type { GameManifest as GameEntry } from '@casino/math';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const GAMES_DIR = resolve(ROOT, 'packages/games');

/** Los ids de los juegos que tienen manifest, en orden alfabético. */
export function gameIds(): string[] {
  return readdirSync(GAMES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(GAMES_DIR, d.name, 'src/manifest.ts')))
    .map((d) => d.name)
    .sort();
}

export async function loadGame(id: string): Promise<GameManifest> {
  const file = resolve(GAMES_DIR, id, 'src/manifest.ts');
  if (!existsSync(file)) {
    throw new Error(`Juego desconocido: ${id}. Disponibles: ${gameIds().join(', ')}`);
  }
  const mod = (await import(pathToFileURL(file).href)) as { MANIFEST?: GameManifest };
  if (!mod.MANIFEST) throw new Error(`${id}/src/manifest.ts no exporta MANIFEST`);
  if (mod.MANIFEST.id !== id) {
    throw new Error(`El manifest de la carpeta ${id} dice llamarse "${mod.MANIFEST.id}"`);
  }
  return mod.MANIFEST;
}

export async function loadGames(): Promise<Record<string, GameManifest>> {
  const out: Record<string, GameManifest> = {};
  for (const id of gameIds()) out[id] = await loadGame(id);
  return out;
}

/** `--game <id>` de la línea de comandos; classic20 si no se pasa. */
export async function pickGame(argv: readonly string[]): Promise<GameManifest> {
  const i = argv.indexOf('--game');
  const id = i === -1 ? 'classic20' : (argv[i + 1] ?? 'classic20');
  return loadGame(id);
}
