/**
 * EL MUEBLE: el marco de metal alrededor del tablero.
 *
 * Antes esto eran cuatro rectangulos redondeados con trazos de colores
 * planos. De lejos se leia como un recuadro dibujado encima del fondo, no
 * como un mueble con los rodillos adentro.
 *
 * Lo que hace que un marco parezca metal es lo mismo que en los simbolos:
 * un degradado con la banda clara ESTRECHA —el reflejo del horizonte— y
 * oscuro arriba y abajo. Y lo que hace que los rodillos parezcan HUNDIDOS
 * es el labio oscuro por dentro del bisel: sin esa sombra, la grilla flota
 * a la misma altura que el marco y el mueble no existe.
 *
 * En la feature vira al color del scatter, que es la senial mas clara de que
 * cambio el estado.
 */

import type { Graphics } from 'pixi.js';

import { PALETTE } from '../render/theme.ts';
import { metal } from '../render/material.ts';

/** Oscurece un color, para el aro exterior del marco. */
export function darken(c: number, k = 0.45): number {
  const r = Math.round(((c >> 16) & 255) * k);
  const g = Math.round(((c >> 8) & 255) * k);
  const b = Math.round((c & 255) * k);
  return (r << 16) | (g << 8) | b;
}

export function drawFrame(frame: Graphics, boardW: number, boardH: number, free: boolean): void {
  const glow = free ? PALETTE.scatter : PALETTE.frameLight;
  const oscuro = free ? darken(PALETTE.scatter) : PALETTE.frame;
  const claro = free ? PALETTE.scatter : PALETTE.frameLight;

  frame.clear();

  // Sombra proyectada: apoya el mueble sobre el fondo.
  frame
    .roundRect(-26, -22, boardW + 52, boardH + 54, 24)
    .fill({ color: 0x000000, alpha: 0.45 });

  // El bisel, con metal de verdad.
  frame
    .roundRect(-20, -20, boardW + 40, boardH + 40, 18)
    .fill(metal(darken(oscuro), oscuro, claro));

  // Filo exterior oscuro: separa el mueble del fondo.
  frame
    .roundRect(-20, -20, boardW + 40, boardH + 40, 18)
    .stroke({ width: 2, color: 0x0d0904, alpha: 0.9 });

  // Hilo claro sobre el canto superior: la luz pega arriba.
  frame
    .moveTo(-4, -18.5)
    .lineTo(boardW + 4, -18.5)
    .stroke({ width: 2, color: 0xffffff, alpha: 0.22 });

  // El labio interno: la sombra que hunde los rodillos.
  frame
    .roundRect(-9, -9, boardW + 18, boardH + 18, 11)
    .stroke({ width: 7, color: 0x000000, alpha: 0.55 });

  // Y el filo brillante que remata el hueco.
  frame
    .roundRect(-6, -6, boardW + 12, boardH + 12, 9)
    .stroke({ width: 1.6, color: glow, alpha: 0.75 });

  // Remaches en las esquinas, con volumen.
  for (const [cx, cy] of [
    [-13, -13], [boardW + 13, -13], [-13, boardH + 13], [boardW + 13, boardH + 13],
  ] as const) {
    frame.circle(cx, cy, 6.5).fill({ color: 0x000000, alpha: 0.5 });
    frame.circle(cx, cy, 5.4).fill(metal(darken(oscuro), claro, 0xffffff));
    frame.circle(cx - 1.3, cy - 1.3, 1.5).fill({ color: 0xffffff, alpha: 0.55 });
  }
}
