/**
 * Exporta el arte de los juegos para el lobby del casino.
 *
 *   node tools/art-export.ts <carpeta-destino>
 *
 * El juego carga su arte solo; el LOBBY (portadas, banners, pantallas del
 * bonus) también lo necesita, y antes había que copiarlo y cablearlo a mano
 * juego por juego. Esto copia `symbols.png` y `scene.jpg` de cada juego con
 * arte propio y escribe `index.js`, un script que deja en
 * `window.MCProviderArt` lo que el lobby necesita de cada uno: título,
 * archivos, la grilla del atlas y qué celda usar de emblema (la moneda, el
 * chupetín: el SCATTER, que es el símbolo que identifica la función).
 *
 * Lo corre la compilación del casino (tools/build-illustrated-provider.mjs).
 */

import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { SYM, type ArtFile } from '@casino/math';
import { GAMES_DIR, gameIds, loadGame } from './games.ts';
import { publishBlocker } from './qa-lib.ts';

const out = resolve(process.argv[2] ?? die('Falta la carpeta destino.'));
mkdirSync(out, { recursive: true });

const only = process.argv.slice(3).find((a) => a.startsWith('--only='))?.slice(7).split(',');
const index: Record<string, unknown> = {};
for (const id of gameIds()) {
  if (only && !only.includes(id)) continue;
  const dir = resolve(GAMES_DIR, id, 'art');
  const jsonFile = resolve(dir, 'art.json');
  if (!existsSync(jsonFile)) continue;
  const art = JSON.parse(readFileSync(jsonFile, 'utf8')) as ArtFile;
  if (art.provisional) continue; // el arte prestado no va al lobby
  const m = await loadGame(id);
  copyFileSync(resolve(dir, art.symbols.file), resolve(out, `${id}-symbols.png`));
  copyFileSync(resolve(dir, art.scene), resolve(out, `${id}-scene.jpg`));
  const cover = art.symbols.order.indexOf(SYM.SCATTER);
  /* El trío del banner del lobby: al frente el símbolo más caro, a los costados
     el scatter y el wild. En un original, la pieza de portada y otras dos. */
  const at = (sym: number) => art.symbols.order.indexOf(sym);
  const hero = (m.kind === 'original'
    ? [at(1), ...art.symbols.order.map((_, i) => i).filter((i) => i !== at(1)).reverse()]
    : [at(SYM.H1), cover, at(SYM.WILD)]
  ).filter((i) => i >= 0).slice(0, 3);
  index[id] = {
    title: m.theme.TITLE,
    verified: publishBlocker(m) === null,
    rtpValue: m.qa?.passed ? m.qa.rtp : null,
    volatility: m.qa?.passed ? m.qa.volatilityLabel : null,
    symbols: `${id}-symbols.png`,
    scene: `${id}-scene.jpg`,
    cols: art.symbols.cols,
    rows: art.symbols.rows,
    cover: cover >= 0 ? cover : 0,
    detail: m.client.featureDetail ?? '',
    tint: m.client.featureTint ?? null,
    hero,
    // Colores del juego para el banner: el acento (scatter) y el dorado del mueble.
    accent: m.theme.PALETTE.scatter,
    gold: m.theme.PALETTE.frameLight,
  };
}

writeFileSync(resolve(out, 'index.js'),
  '/* Generado por Juegos Casinos/tools/art-export.ts al compilar el proveedor. No editar. */\n' +
  `window.MCProviderArt = ${JSON.stringify(index, null, 2)};\n`, 'utf8');
console.log(`Arte del proveedor para el lobby: ${Object.keys(index).join(', ')}`);

function die(msg: string): never {
  console.error(msg);
  process.exit(1);
}
