/**
 * El arte pintado de un juego, de punta a punta.
 *
 *   npm run art -- prompts --game feria
 *       Los dos pedidos para el generador de imágenes (hoja de símbolos y
 *       escena), armados con la dirección de arte del juego (`src/art.ts`) y
 *       la receta de la casa. Las imágenes las genera Claude con el conector
 *       de Gamma, o cualquiera a mano.
 *
 *   npm run art -- cut --game feria --sheet hoja.jpg --scene escena.jpg
 *                      [--protect "9:242,312 263,312 127,514 105,514"] [--grid 4x4]
 *       Guarda las fuentes en `art/source/`, recorta la hoja (3×4, en el
 *       orden de `src/art.ts`), arma `art/symbols.png`, `art/scene.jpg` y
 *       `art/art.json`, y deja una vista de control para mirar los bordes.
 *       `--protect celda:polígono` marca lo que es objeto aunque tenga el
 *       color del fondo (el palito de un chupetín).
 *
 *   npm run art -- recut --game feria [--protect ...]
 *       Repite el recorte desde `art/source/` con los parámetros guardados.
 *
 *   npm run art -- shared --sheet monedas.jpg
 *       El arte que comparten todos los juegos (hoja 2×2: moneda de frente,
 *       moneda de canto, destello —no se usa—, grupo de destellos). Va al cliente, en
 *       `apps/client/src/render/shared/`.
 *
 *   npm run art -- check [--game feria]
 *       Controla que el arte esté completo. El portero de publicación hace
 *       el mismo control: sin arte pintado propio, el juego no va al casino.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, resolve } from 'node:path';
import sharp from 'sharp';

import { SYMBOL_NAMES, type ArtFile, type GameManifest, type SymbolId } from '@casino/math';
import { GAMES_DIR, ROOT, gameIds, loadGame } from './games.ts';
import { cutSheet, packAtlas, preview } from './art-lib.ts';
import { artProblems } from './qa-lib.ts';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const cmd = process.argv[2];

/* ── La receta de la casa ─────────────────────────────────────────────────
   Salió de El Kiosco (octubre 2026): la primera hoja vino con piso y sombras
   de contacto y el recorte dejaba manchones; la primera escena salió con
   contornos de historieta y letras. En El Carnaval, "centro oscuro" se leyó
   como un rectángulo vacío pintado en el medio, y coló una bailarina. Estas
   frases son las que lo arreglaron. */
const SHEET_COLS = 3;
const SHEET_ROWS = 4;

function symbolsPrompt(m: GameManifest): string {
  const entries = Object.entries(m.art.symbols) as [string, string][];
  if (entries.length > SHEET_COLS * SHEET_ROWS) throw new Error(`Más de ${SHEET_COLS * SHEET_ROWS} símbolos: no entran en una hoja.`);
  const list = entries.map(([, what], i) => `(${i + 1}) ${what}`).join('; ');
  const empty = entries.length < SHEET_COLS * SHEET_ROWS
    ? ` Leave the remaining ${SHEET_COLS * SHEET_ROWS - entries.length} cell(s) completely empty white.` : '';
  return [
    `Production sprite sheet for a premium casino slot videogame, a perfectly regular grid of ${SHEET_COLS} columns by ${SHEET_ROWS} rows,`,
    `${SHEET_COLS * SHEET_ROWS} equal cells, each object isolated and centered in its own cell, occupying at most 60 percent of the cell, with wide empty margins between objects.`,
    'Every object FLOATS in empty space: plain flat pure white background everywhere, absolutely no floor, no ground plane, no contact shadow,',
    'no drop shadow, no reflection, no colored light spill on the background. No grid lines, no text, no labels, no logos.',
    '',
    'Art direction: high-end hand-painted photorealistic 3D objects, rich physical material texture, warm cinematic key light from the upper left,',
    'crisp specular highlights, a subtle darker rim on the lower edge of each object so its silhouette stays crisp against white.',
    'The quality of premium modern slot game symbols. Not emoji, not vector clipart, not flat cartoon, not rounded mobile icons.',
    'All objects share the same lighting, scale and rendering style. Avoid pure white parts on the objects.',
    '',
    `Objects in reading order (left to right, top to bottom): ${list}.${empty}`,
  ].join('\n');
}

function scenePrompt(m: GameManifest): string {
  return [
    'Square casino slot game backdrop, premium digital matte painting with cinematic painterly realism: soft brushwork,',
    'no outlines, no ink lines, no comic or cartoon style, no cel shading.',
    `Scene: ${m.art.scene}.`,
    'One seamless continuous scene. Detail pushed to the edges and corners; toward the CENTER the scene simply gets',
    'calmer, darker and softer (night sky, haze, bokeh) so a game reel board can sit on top. Do NOT draw an empty',
    'rectangle, panel, frame, window or placeholder in the center: the darkness is atmosphere, not a shape.',
    'High production value, rich textures, restrained warm and cool contrast. Absolutely no text, no letters, no words,',
    'no signs with writing, no logos, no people, no human figures, no dancers, no slot UI, no watermark, no emoji.',
  ].join('\n');
}

function parseProtect(spec: string | undefined): Record<number, [number, number][]> {
  const out: Record<number, [number, number][]> = {};
  if (!spec) return out;
  for (const part of spec.split(';')) {
    const [cell, pts] = part.split(':');
    if (!cell || !pts) continue;
    out[Number(cell)] = pts.trim().split(/\s+/).map((p) => p.split(',').map(Number) as [number, number]);
  }
  return out;
}

/**
 * La grilla de la hoja. Se pide 3×4, pero el generador a veces entrega otra
 * (4×4, por ejemplo): `--grid 4x4` la recorta como vino, sin regenerar.
 */
function gridArg(prev?: { cols: number; rows: number }): { cols: number; rows: number } {
  const g = arg('grid');
  if (g) {
    const [cols, rows] = g.split('x').map(Number);
    if (cols && rows) return { cols, rows };
  }
  return prev ?? { cols: SHEET_COLS, rows: SHEET_ROWS };
}

async function cut(
  m: GameManifest, sheet: string, scene: string,
  protect: Record<number, [number, number][]>,
  // Qué símbolo hay en cada celda de la hoja. Por defecto, el orden de los
  // pedidos (por número de símbolo); una hoja vieja puede traer otro.
  cells: SymbolId[] = Object.keys(m.art.symbols).map(Number) as SymbolId[],
  grid: { cols: number; rows: number } = gridArg(),
): Promise<void> {
  const dir = resolve(GAMES_DIR, m.id, 'art');
  const sprites = (await cutSheet(sheet, grid.cols, grid.rows, protect)).slice(0, cells.length);
  const missing = cells.filter((_, i) => !sprites[i]);
  if (missing.length) throw new Error(`Celdas vacías en la hoja: ${missing.map((s) => SYMBOL_NAMES[s]).join(', ')}`);

  const COLS = 6;
  const CELL = 320;
  const atlas = await packAtlas(sprites, COLS, CELL);
  writeFileSync(resolve(dir, 'symbols.png'), atlas);
  // La escena se recorta al cuadrado y se lleva a 1536: el centro manda.
  await sharp(scene).resize(1536, 1536, { fit: 'cover' }).jpeg({ quality: 86 }).toFile(resolve(dir, 'scene.jpg'));

  const file: ArtFile = {
    symbols: { file: 'symbols.png', cols: COLS, rows: Math.ceil(cells.length / COLS), cell: CELL, order: cells },
    scene: 'scene.jpg',
    source: 'gamma',
    provisional: false,
    date: new Date().toISOString().slice(0, 10),
    cut: { cols: grid.cols, rows: grid.rows, cells, protect },
  };
  writeFileSync(resolve(dir, 'art.json'), JSON.stringify(file, null, 2) + '\n');

  const bg = m.theme.PALETTE.bgBottom;
  const look = resolve(tmpdir(), `arte-${m.id}.jpg`);
  writeFileSync(look, await preview(atlas, { r: (bg >> 16) & 255, g: (bg >> 8) & 255, b: bg & 255 }));
  console.log(`Arte de ${m.id}: ${cells.length} símbolos y la escena.\nVista de control (mirar los bordes): ${look}`);
}

const id = arg('game');

if (cmd === 'prompts') {
  const m = await loadGame(id ?? die('Falta --game.'));
  console.log(`━━ Hoja de símbolos de ${m.theme.TITLE} (formato vertical 4:5) ━━\n\n${symbolsPrompt(m)}\n`);
  console.log(`━━ Escena de ${m.theme.TITLE} (cuadrada) ━━\n\n${scenePrompt(m)}\n`);
} else if (cmd === 'cut') {
  const m = await loadGame(id ?? die('Falta --game.'));
  const sheet = arg('sheet') ?? die('Falta --sheet (la hoja de símbolos generada).');
  const scene = arg('scene') ?? die('Falta --scene (la escena generada).');
  const src = resolve(GAMES_DIR, m.id, 'art/source');
  mkdirSync(src, { recursive: true });
  const sheetCopy = resolve(src, `symbols-sheet${extname(sheet)}`);
  const sceneCopy = resolve(src, `scene${extname(scene)}`);
  if (resolve(sheet) !== sheetCopy) copyFileSync(sheet, sheetCopy);
  if (resolve(scene) !== sceneCopy) copyFileSync(scene, sceneCopy);
  await cut(m, sheetCopy, sceneCopy, parseProtect(arg('protect')));
} else if (cmd === 'recut') {
  const m = await loadGame(id ?? die('Falta --game.'));
  const dir = resolve(GAMES_DIR, m.id, 'art');
  const prev = JSON.parse(readFileSync(resolve(dir, 'art.json'), 'utf8')) as ArtFile;
  const find = (base: string) => ['.jpg', '.png', '.jpeg', '.webp'].map((e) => resolve(dir, 'source', base + e)).find(existsSync);
  const sheet = find('symbols-sheet') ?? die(`${m.id} no tiene art/source/symbols-sheet.*`);
  const scene = find('scene') ?? die(`${m.id} no tiene art/source/scene.*`);
  await cut(m, sheet, scene, arg('protect') ? parseProtect(arg('protect')) : (prev.cut?.protect ?? {}), prev.cut?.cells,
    gridArg(prev.cut ? { cols: prev.cut.cols, rows: prev.cut.rows } : undefined));
} else if (cmd === 'shared') {
  const sheet = arg('sheet') ?? die('Falta --sheet (la hoja 2×2 del arte compartido).');
  const dir = resolve(ROOT, 'apps/client/src/render/shared');
  mkdirSync(resolve(dir, 'source'), { recursive: true });
  const copy = resolve(dir, 'source', `shared-sheet${extname(sheet)}`);
  if (resolve(sheet) !== copy) copyFileSync(sheet, copy);
  /* La celda 3 (un destello solo con resplandor) no se usa: el resplandor es
     un degradé sobre blanco y el recorte lo deja como un disco duro. El grupo
     de destellos de la celda 4 no tiene resplandor y recorta limpio. */
  const names: [number, string][] = [[0, 'coin'], [1, 'coin-edge'], [3, 'sparkles']];
  const sprites = await cutSheet(copy, 2, 2);
  for (const [i, name] of names) {
    const s = sprites[i] ?? die(`La celda ${i + 1} (${name}) está vacía.`);
    // 160 px de lado mayor: una moneda en pantalla nunca pasa de 40.
    await sharp(s.data, { raw: { width: s.width, height: s.height, channels: 4 } })
      .resize(160, 160, { fit: 'inside', kernel: 'lanczos3' }).png().toFile(resolve(dir, `${name}.png`));
  }
  console.log(`Arte compartido: ${names.map(([, n]) => n).join(', ')} en apps/client/src/render/shared/`);
} else if (cmd === 'check') {
  let bad = 0;
  for (const g of id ? [id] : gameIds()) {
    const problems = artProblems(await loadGame(g));
    if (problems.length) { bad++; console.log(`  ✗ ${g}: ${problems.join('; ')}`); } else console.log(`  ✓ ${g}`);
  }
  process.exit(bad ? 1 : 0);
} else {
  die('Comandos: prompts, cut, recut, shared, check.');
}

function die(msg: string): never {
  console.error(`\n${msg}\n\nUso: ver el comentario de tools/art.ts, o docs/fabrica.md.\n`);
  process.exit(1);
}
