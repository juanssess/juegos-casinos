/**
 * Arranca un juego nuevo a partir de una mecánica que ya anda.
 *
 *   npm run new-game -- --id malbec --mechanic racimos --title "Malbec"
 *   npm run new-game -- --id feria --from kiosco --title "La Feria"
 *
 * Mecánicas (cada una es un juego de la casa que sirve de molde):
 *
 *   lineas          5×3, 20 líneas y La Escalinata        → classic20 (Maverick)
 *   pegajosos       5×5, 15 líneas y wilds que se quedan  → sebusca
 *   racimos         6×5, racimos con cascadas y escalera   → vendimia
 *   cualquier-lado  6×5, 8 iguales en cualquier lado y bombas → kiosco
 *   hold-win        5×3, monedas que se quedan y re-giros      → feria
 *
 * Por qué COPIAR un juego entero y no partir de una plantilla vacía: el molde
 * es un juego que ya pasó el QA. El juego nuevo arranca jugable, con la
 * matemática del molde, y desde ahí se cambia lo que se quiera cambiar —el
 * tema, las tiras, la tabla— volviendo a medir. Partir de cero es partir de
 * un juego que no anda.
 *
 * Lo que genera:
 *   packages/games/<id>/              el paquete, con id, título y QA en cero
 *   apps/client/src/skins/<id>.ts     el arte del molde, provisorio
 *   packages/math/test/<id>.test.ts   las pruebas de consistencia del motor
 *   docs/<id>-math-sheet.md           la ficha, con los títulos a completar
 *
 * No toca nada más: el juego aparece solo en `sim`, `tune`, `qa` y en el
 * cliente (`?game=<id>`), porque todos descubren los manifests.
 */

import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { GAMES_DIR, ROOT, gameIds, loadGame } from './games.ts';

const MECHANICS: Record<string, string> = {
  lineas: 'classic20',
  pegajosos: 'sebusca',
  racimos: 'vendimia',
  'cualquier-lado': 'kiosco',
  'hold-win': 'feria',
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function die(msg: string): never {
  console.error(`\n${msg}\n`);
  console.error('Uso: npm run new-game -- --id <id> (--mechanic <mecánica> | --from <juego>) [--title "Nombre"]');
  console.error(`Mecánicas: ${Object.entries(MECHANICS).map(([k, v]) => `${k} (${v})`).join(', ')}`);
  process.exit(1);
}

const id = arg('id') ?? die('Falta --id.');
if (!/^[a-z][a-z0-9]{2,23}$/.test(id)) die(`"${id}" no sirve como id: minúsculas y números, de 3 a 24, empezando con letra.`);
if (existsSync(resolve(GAMES_DIR, id))) die(`Ya existe packages/games/${id}.`);

const mech = arg('mechanic');
const from = arg('from') ?? (mech ? (MECHANICS[mech] ?? die(`No conozco la mecánica "${mech}".`)) : die('Falta --mechanic o --from.'));
if (!gameIds().includes(from)) die(`No existe el juego molde "${from}". Hay: ${gameIds().join(', ')}`);
const title = arg('title') ?? id.charAt(0).toUpperCase() + id.slice(1);

const molde = await loadGame(from);
const dst = resolve(GAMES_DIR, id);

/** Reemplazo que tiene que pasar exactamente una vez: si el molde cambió, mejor fallar que adivinar. */
function once(file: string, a: string | RegExp, b: string): void {
  const s = readFileSync(file, 'utf8');
  const hits = typeof a === 'string' ? s.split(a).length - 1 : (s.match(new RegExp(a, 'g')) ?? []).length;
  if (hits !== 1) die(`No encontré exactamente una vez ${String(a)} en ${file} (hay ${hits}).`);
  writeFileSync(file, s.replace(a, b), 'utf8');
}

// 1. El paquete.
// Sin node_modules y sin las fuentes del arte del molde: esas son suyas.
cpSync(resolve(GAMES_DIR, from), dst, {
  recursive: true,
  filter: (p) => !p.includes('node_modules') && !p.replaceAll('\\', '/').includes('/art/source'),
});
const pkgFile = resolve(dst, 'package.json');
const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as { name: string };
pkg.name = `@casino/game-${id}`;
writeFileSync(pkgFile, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

once(resolve(dst, 'src/index.ts'), `id: '${from}',`, `id: '${id}',`);
once(resolve(dst, 'src/manifest.ts'), `id: '${from}',`, `id: '${id}',`);
once(resolve(dst, 'src/theme.ts'), /export const TITLE = '[^']*';/, `export const TITLE = '${title.replaceAll("'", "\\'")}';`);
writeFileSync(resolve(dst, 'src/qa.ts'),
  `/**\n * Resultado del QA. Lo escribe \`npm run qa -- --game ${id}\`; no editar a mano.\n */\n\n` +
  `import type { QaSummary } from '@casino/math';\n\nexport const QA: QaSummary | null = null;\n`, 'utf8');
// Un aviso arriba del index: que se sepa de dónde salió hasta que se rehaga.
once(resolve(dst, 'src/index.ts'), /^\/\*\*/, `/**\n * NACIDO DE ${from.toUpperCase()} (npm run new-game). La matemática es la del molde\n * hasta que se cambien las tiras o la tabla y se vuelva a medir con el QA.\n *`);

// El arte pintado del molde viaja marcado como PROVISORIO: el juego se ve
// bien desde el primer minuto, pero el portero no lo publica así.
const artJson = resolve(dst, 'art/art.json');
if (existsSync(artJson)) {
  const art = JSON.parse(readFileSync(artJson, 'utf8')) as Record<string, unknown>;
  art.source = `molde:${from}`;
  art.provisional = true;
  delete art.cut;
  writeFileSync(artJson, JSON.stringify(art, null, 2) + '\n', 'utf8');
}

// 2. El arte de cliente: el del molde, hasta que haya atlas pintado propio.
const skinFile = resolve(ROOT, `apps/client/src/skins/${id}.ts`);
writeFileSync(skinFile,
  `/**\n * Arte de cliente de ${id}.\n *\n * PROVISORIO: usa los símbolos y el fondo de ${from}. El arte final es un atlas\n` +
  ` * pintado (ver Casino (PRUEBA)/assets/illustrated/README.md); mientras tanto\n` +
  ` * el juego se puede jugar y medir con el dibujo del molde.\n */\n\n` +
  `export { SKIN_ART } from './${from}.ts';\n`, 'utf8');

// 3. Las pruebas: las de consistencia, que valen para cualquier juego.
const testFile = resolve(ROOT, `packages/math/test/${id}.test.ts`);
writeFileSync(testFile, `/**
 * ${title} — pruebas de consistencia del motor (generadas por new-game).
 *
 * Valen para cualquier juego: la ruta con detalle (\`play\`) y la rápida
 * (\`playFast\`) tienen que dar exactamente lo mismo con la misma semilla, y la
 * compra del bonus tiene que disparar siempre. Las reglas propias del juego
 * se agregan abajo cuando la mecánica cambie respecto del molde (${from}).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Sfc32Rng, type FastRound } from '../src/index.ts';
import { MANIFEST } from '../../games/${id}/src/manifest.ts';

const bet = MANIFEST.game.paylines.length || MANIFEST.game.betDivisor || 20;

test('play y playFast dan el mismo total con la misma semilla', () => {
  const eng = MANIFEST.engine();
  const a = new Sfc32Rng(${Math.floor(1000 + id.length * 97)});
  const b = new Sfc32Rng(${Math.floor(1000 + id.length * 97)});
  const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  for (let i = 0; i < 3000; i++) {
    const lento = eng.play(a, bet);
    eng.playFast(b, bet, out);
    assert.equal(lento.totalWin, out.totalWin, \`ronda \${i}: la ruta con detalle y la rápida se separaron\`);
  }
});

test('la compra del bonus siempre dispara', () => {
  const eng = MANIFEST.engine();
  const rng = new Sfc32Rng(7);
  for (let i = 0; i < 200; i++) assert.ok(eng.playBonus(rng, bet).triggered, \`compra \${i} sin feature\`);
});
`, 'utf8');

// 4. La ficha.
const sheet = resolve(ROOT, `docs/${id}-math-sheet.md`);
writeFileSync(sheet, `# ${id} (${title}) — Math Sheet

Nacido de **${from}** con \`npm run new-game\`. Hasta que se rehaga la matemática,
los números son los del molde.

<!-- qa:inicio -->
## QA automático — PENDIENTE

Todavía no pasó por \`npm run qa -- --game ${id}\`.
<!-- qa:fin -->

## Concepto

Qué es el juego en una frase, y qué lo distingue de ${from}.

## Decisiones de diseño (medidas)

Cada decisión con el número que la justifica.

## Reproducir

\`\`\`
npm run tune -- --game ${id} --rounds 1e8
npm run qa -- --game ${id}
\`\`\`
`, 'utf8');

const files = readdirSync(resolve(dst, 'src')).length;
console.log(`
${title} (${id}) creado a partir de ${from} (${molde.theme.TITLE}).

  packages/games/${id}/            ${files} archivos, QA en cero
  apps/client/src/skins/${id}.ts   arte provisorio de ${from}
  packages/math/test/${id}.test.ts
  docs/${id}-math-sheet.md

Ya se puede jugar:   npm run dev   →   http://localhost:5173/?game=${id}

Lo que sigue:
  1. El tema: packages/games/${id}/src/theme.ts (nombres, paleta, tiempos).
  2. La matemática: tiras y objetivos en index.ts / tuning.ts, y
     npm run tune -- --game ${id} --rounds 1e8
  3. El arte pintado: escribir src/art.ts (qué es cada símbolo y la escena),
     npm run art -- prompts --game ${id}   →  generar  →  npm run art -- cut ...
     Mientras tanto usa el arte del molde, marcado como provisorio.
  4. npm run qa -- --game ${id}   — sin QA aprobado no entra al casino.
`);
