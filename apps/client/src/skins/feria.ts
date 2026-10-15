/**
 * Arte de cliente de feria: respaldo procedural.
 *
 * El juego se ve con su arte pintado (`packages/games/feria/art/`); esto es lo
 * que queda si el atlas no carga. Usa el dibujo de los símbolos de Maverick y
 * una escenografía sepia simple: suficiente para jugar y medir, nunca para
 * publicar (el portero exige el arte pintado).
 */

import type { Graphics } from 'pixi.js';
import type { ClientSkin } from '../games.ts';
import { createSymbolTextures as textures } from '../render/symbols.ts';
import { vGradient } from './gradient.ts';

/** Fondo de La Feria: atardecer sepia sobre la plaza. */
function feriaBackdrop(bg: Graphics, w: number, h: number): void {
  vGradient(bg, w, h, [
    [0, 0x4a3420],
    [0.5, 0x2a1d12],
    [1, 0x120c08],
  ]);
  // Faroles: la única luz de la plaza al caer la tarde.
  for (const x of [0.08, 0.92]) {
    for (let i = 5; i > 0; i--) bg.circle(w * x, h * 0.3, (h * 0.12 * i) / 5).fill({ color: 0xffc46b, alpha: 0.04 });
    bg.circle(w * x, h * 0.3, 6).fill({ color: 0xfff0c4, alpha: 0.8 });
  }
  // Adoquines insinuados abajo.
  for (let y = h * 0.86; y < h; y += 14) bg.rect(0, y, w, 1).fill({ color: 0x000000, alpha: 0.25 });
}

export const SKIN_ART: ClientSkin = { textures, backdrop: feriaBackdrop };
