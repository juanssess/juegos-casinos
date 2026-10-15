/**
 * El arte PINTADO de cada juego, cargado por el cliente.
 *
 * Vive en `packages/games/<id>/art/` (lo arma `npm run art -- cut`) y Vite lo
 * empaqueta con el build: el atlas de símbolos, la escena y `art.json`, que
 * dice qué símbolo hay en cada celda.
 *
 * Antes este arte existía solo en el casino y entraba al juego reemplazando
 * los archivos de símbolos al compilar; jugando suelto se veía el dibujo
 * procedural. Ahora el juego es el mismo en los dos lados, y el dibujo
 * procedural queda como respaldo: lo que el atlas no trae (un símbolo que el
 * juego no usa) sigue saliendo de ahí.
 */

import { Assets, Texture, type Application } from 'pixi.js';
import type { ArtFile } from '@casino/math';

import type { SymbolTextures } from './symbols.ts';

export interface PaintedArt {
  file: ArtFile;
  symbolsUrl: string;
  sceneUrl: string;
}

const FILES = import.meta.glob<ArtFile>('../../../../packages/games/*/art/art.json', { eager: true, import: 'default' });
const URLS = import.meta.glob<string>('../../../../packages/games/*/art/*.{png,jpg}', { eager: true, query: '?url', import: 'default' });

/** El arte pintado de un juego, o `null` si todavía no tiene. */
export function paintedArtFor(id: string): PaintedArt | null {
  const base = `../../../../packages/games/${id}/art/`;
  const file = FILES[`${base}art.json`];
  if (!file) return null;
  const symbolsUrl = URLS[base + file.symbols.file];
  const sceneUrl = URLS[base + file.scene];
  if (!symbolsUrl || !sceneUrl) return null;
  return { file, symbolsUrl, sceneUrl };
}

/** Lado de la textura de cada símbolo, y cuánto ocupa el dibujo adentro. */
const SIZE = 256;
const FILL = 224;

/**
 * Corta el atlas en una textura por símbolo. Cada celda se recorta a su
 * contenido (el margen transparente varía de dibujo a dibujo) y se centra en
 * un cuadrado fijo: así todos los símbolos ocupan lo mismo en la grilla.
 */
export async function paintedTextures(
  _app: Application,
  art: PaintedArt,
  fallback: SymbolTextures,
): Promise<SymbolTextures> {
  const atlas = await Assets.load<Texture>(art.symbolsUrl);
  const { cols, cell, order } = art.file.symbols;
  const sheet = document.createElement('canvas');
  sheet.width = atlas.width;
  sheet.height = atlas.height;
  const ctx = sheet.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(atlas.source.resource as CanvasImageSource, 0, 0);

  const out: SymbolTextures = new Map(fallback);
  order.forEach((sym, i) => {
    const x = (i % cols) * cell;
    const y = Math.floor(i / cols) * cell;
    const px = ctx.getImageData(x, y, cell, cell).data;
    let l = cell, t = cell, r = -1, b = -1;
    for (let yy = 0; yy < cell; yy++) for (let xx = 0; xx < cell; xx++) {
      if (px[(yy * cell + xx) * 4 + 3]! > 80) {
        if (xx < l) l = xx;
        if (xx > r) r = xx;
        if (yy < t) t = yy;
        if (yy > b) b = yy;
      }
    }
    if (r < l) return; // celda vacía: queda el dibujo procedural
    const sw = r - l + 1;
    const sh = b - t + 1;
    const s = FILL / Math.max(sw, sh);
    const c = document.createElement('canvas');
    c.width = SIZE;
    c.height = SIZE;
    c.getContext('2d')!.drawImage(sheet, x + l, y + t, sw, sh, (SIZE - sw * s) / 2, (SIZE - sh * s) / 2, sw * s, sh * s);
    out.set(sym, Texture.from(c));
  });
  return out;
}
