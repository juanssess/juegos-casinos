/**
 * Recorte y armado de atlas: lo que convierte una hoja generada en el arte
 * que carga el juego.
 *
 * La receta salió de hacer El Kiosco a mano (ver el README de
 * `Casino (PRUEBA)/assets/illustrated`):
 *
 *  - Se piden los objetos FLOTANDO sobre blanco liso, sin piso ni sombras.
 *    Con sombra de contacto el recorte deja manchones de color.
 *  - El fondo CRECE desde los bordes de cada celda por gradiente suave: una
 *    sombra es un degradé y entra; el borde de un objeto es un salto y lo
 *    frena. Después se absorbe el gris claro que quedó pegado al fondo.
 *  - La máscara se contrae 1 px y se suaviza: saca el filo blanco que deja
 *    el fondo en el antialias del objeto.
 *  - Lo que es del color del fondo y es objeto (el palito blanco de un
 *    chupetín) se protege con un polígono, a mano: ninguna regla lo adivina.
 */

import sharp from 'sharp';

export interface RgbImage {
  data: Buffer;
  width: number;
  height: number;
}

export interface Sprite {
  /** RGBA, recortado al contenido. */
  data: Buffer;
  width: number;
  height: number;
}

export async function readRgb(file: string): Promise<RgbImage> {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/**
 * Las líneas de la grilla, si la hoja las trae dibujadas (Gamma suele
 * dibujarlas aunque se le pida que no). Si no hay, se divide parejo.
 */
export function gridLines(img: RgbImage, cols: number, rows: number): { xs: number[]; ys: number[] } {
  const { data, width: w, height: h } = img;
  const dark = (x: number, y: number): boolean => {
    const i = (y * w + x) * 3;
    return data[i]! + data[i + 1]! + data[i + 2]! < 270;
  };
  const find = (n: number, len: number, span: number, isDark: (a: number, b: number) => boolean): number[] => {
    const out = [0];
    for (let k = 1; k < n; k++) {
      const guess = Math.round((k * len) / n);
      let best = guess;
      let bestScore = -1;
      for (let a = guess - Math.round(len * 0.03); a <= guess + Math.round(len * 0.03); a++) {
        if (a <= 0 || a >= len) continue;
        let score = 0;
        for (let b = 0; b < span; b += 4) if (isDark(a, b)) score++;
        if (score > bestScore) { bestScore = score; best = a; }
      }
      // Una línea de verdad cruza al menos el 60 % de la hoja; si no, parejo.
      out.push(bestScore > (span / 4) * 0.6 ? best : guess);
    }
    out.push(len);
    return out;
  };
  return {
    xs: find(cols, w, h, (x, y) => dark(x, y)),
    ys: find(rows, h, w, (y, x) => dark(x, y)),
  };
}

const lum = (r: number, g: number, b: number): number => (r * 299 + g * 587 + b * 114) / 1000;

/** ¿El punto (x, y) cae dentro del polígono? (par/impar) */
function inPolygon(x: number, y: number, poly: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Saca el fondo blanco de una región de la hoja y devuelve el objeto con
 * transparencia, recortado a su contenido.
 */
export function cutCell(
  img: RgbImage,
  x0: number, y0: number, x1: number, y1: number,
  protect: readonly (readonly [number, number])[] = [],
): Sprite | null {
  const inset = 8; // las líneas de la grilla quedan afuera
  x0 += inset; y0 += inset; x1 -= inset; y1 -= inset;
  const w = x1 - x0;
  const h = y1 - y0;
  const src = img.data;
  const W = img.width;
  const px = (x: number, y: number): [number, number, number] => {
    const i = ((y0 + y) * W + (x0 + x)) * 3;
    return [src[i]!, src[i + 1]!, src[i + 2]!];
  };
  const guard = new Uint8Array(w * h);
  if (protect.length) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (inPolygon(x + inset, y + inset, protect)) guard[y * w + x] = 1;
    }
  }

  // 1. El fondo crece desde los bordes por gradiente suave.
  const bg = new Uint8Array(w * h);
  const qx = new Int32Array(w * h * 4 + 8);
  const qy = new Int32Array(w * h * 4 + 8);
  const qp = new Int32Array(w * h * 4 + 8); // índice del vecino que lo propuso (-1 = semilla)
  let head = 0, tail = 0;
  const push = (x: number, y: number, from: number) => { qx[tail] = x; qy[tail] = y; qp[tail] = from; tail++; };
  for (let x = 0; x < w; x++) { push(x, 0, -1); push(x, h - 1, -1); }
  for (let y = 0; y < h; y++) { push(0, y, -1); push(w - 1, y, -1); }
  while (head < tail) {
    const x = qx[head]!, y = qy[head]!, from = qp[head]!;
    head++;
    const i = y * w + x;
    if (bg[i] || guard[i]) continue;
    const [r, g, b] = px(x, y);
    if (from < 0) {
      if (Math.min(r, g, b) < 200) continue;
    } else {
      const [pr, pg, pb] = px(from % w, Math.floor(from / w));
      const sat = Math.max(r, g, b) - Math.min(r, g, b);
      if (sat >= 70 || lum(r, g, b) <= 95) continue;
      if (Math.max(Math.abs(r - pr), Math.abs(g - pg), Math.abs(b - pb)) > 7) continue;
    }
    bg[i] = 1;
    if (tail + 4 >= qx.length) continue;
    if (x > 0) push(x - 1, y, i);
    if (x < w - 1) push(x + 1, y, i);
    if (y > 0) push(x, y - 1, i);
    if (y < h - 1) push(x, y + 1, i);
  }

  // 2. El gris claro pegado al fondo también es fondo (sombra apenas teñida).
  for (let round = 0; round < 6; round++) {
    const grow: number[] = [];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (bg[i] || guard[i]) continue;
      if (!(bg[i - 1] || bg[i + 1] || bg[i - w] || bg[i + w])) continue;
      const [r, g, b] = px(x, y);
      if (lum(r, g, b) > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 45) grow.push(i);
    }
    if (!grow.length) break;
    for (const i of grow) bg[i] = 1;
  }

  // 3. Máscara del objeto, contraída 1 px y suavizada.
  const eroded = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let keep = 1;
    for (let dy = -1; dy <= 1 && keep; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (bg[(y + dy) * w + x + dx]) { keep = 0; break; }
    }
    eroded[y * w + x] = keep;
  }
  const alpha = new Uint8Array(w * h);
  const k = [0.25, 0.5, 0.25];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    let a = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += eroded[(y + dy) * w + x + dx]! * k[dy + 1]! * k[dx + 1]!;
    alpha[y * w + x] = Math.round(a * 255);
  }

  // 4. Recorte al contenido.
  let l = w, t = h, r = -1, btm = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (alpha[y * w + x]! > 24) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > btm) btm = y; }
  }
  if (r < l) return null;
  const sw = r - l + 1;
  const sh = btm - t + 1;
  const out = Buffer.alloc(sw * sh * 4);
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const [cr, cg, cb] = px(l + x, t + y);
    const o = (y * sw + x) * 4;
    out[o] = cr; out[o + 1] = cg; out[o + 2] = cb; out[o + 3] = alpha[(t + y) * w + l + x]!;
  }
  return { data: out, width: sw, height: sh };
}

/** Una hoja de `cols × rows` en sprites, en orden de lectura. */
export async function cutSheet(
  file: string,
  cols: number,
  rows: number,
  protect: Record<number, readonly (readonly [number, number])[]> = {},
): Promise<(Sprite | null)[]> {
  const img = await readRgb(file);
  const { xs, ys } = gridLines(img, cols, rows);
  const out: (Sprite | null)[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    out.push(cutCell(img, xs[c]!, ys[r]!, xs[c + 1]!, ys[r + 1]!, protect[r * cols + c] ?? []));
  }
  return out;
}

/**
 * Arma el atlas del juego: grilla regular de celdas cuadradas, cada sprite
 * centrado y escalado a `fit` de la celda. El cliente lo corta por celda.
 */
export async function packAtlas(sprites: (Sprite | null)[], cols: number, cell: number, fit = 0.86): Promise<Buffer> {
  const rows = Math.ceil(sprites.length / cols);
  const layers: sharp.OverlayOptions[] = [];
  for (let i = 0; i < sprites.length; i++) {
    const s = sprites[i];
    if (!s) continue;
    const scale = (cell * fit) / Math.max(s.width, s.height);
    const rw = Math.max(1, Math.round(s.width * scale));
    const rh = Math.max(1, Math.round(s.height * scale));
    const input = await sharp(s.data, { raw: { width: s.width, height: s.height, channels: 4 } })
      .resize(rw, rh, { kernel: 'lanczos3' }).png().toBuffer();
    layers.push({ input, left: (i % cols) * cell + Math.floor((cell - rw) / 2), top: Math.floor(i / cols) * cell + Math.floor((cell - rh) / 2) });
  }
  return sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers).png({ compressionLevel: 9 }).toBuffer();
}

/** Vista de control: el atlas sobre un color de fondo, para mirar los bordes. */
export async function preview(atlas: Buffer, color: { r: number; g: number; b: number }): Promise<Buffer> {
  const meta = await sharp(atlas).metadata();
  return sharp({ create: { width: meta.width!, height: meta.height!, channels: 3, background: color } })
    .composite([{ input: atlas }]).jpeg({ quality: 85 }).toBuffer();
}
