/** Ayudas de dibujo compartidas por las escenografías procedurales. */

import type { Graphics } from 'pixi.js';

/**
 * Degradé vertical suave.
 *
 * Antes esto eran tres rectángulos con alpha, y en pantalla se veían como
 * franjas duras: el ojo detecta un salto de luminancia mucho antes de lo que
 * uno cree. Con bandas finas de un píxel el degradé es continuo y sigue
 * siendo procedural.
 */
export function vGradient(
  bg: Graphics,
  w: number,
  h: number,
  stops: readonly (readonly [number, number])[],
): void {
  const BANDS = 96;
  for (let i = 0; i < BANDS; i++) {
    const t = i / (BANDS - 1);
    // Buscamos el tramo del degradé donde cae `t`.
    let a = stops[0]!;
    let b = stops[stops.length - 1]!;
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s]![0] && t <= stops[s + 1]![0]) {
        a = stops[s]!;
        b = stops[s + 1]!;
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const k = (t - a[0]) / span;
    const ca = a[1];
    const cb = b[1];
    const r = Math.round(((ca >> 16) & 255) * (1 - k) + ((cb >> 16) & 255) * k);
    const g = Math.round(((ca >> 8) & 255) * (1 - k) + ((cb >> 8) & 255) * k);
    const bl = Math.round((ca & 255) * (1 - k) + (cb & 255) * k);
    bg.rect(0, (h * i) / BANDS - 1, w, h / BANDS + 2)
      .fill((r << 16) | (g << 8) | bl);
  }
}
