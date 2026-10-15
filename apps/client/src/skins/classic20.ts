/**
 * Arte de cliente de classic20: la fábrica de símbolos y la escenografía.
 *
 * Es lo único del juego que es código de Pixi. Todo lo demás (matemática,
 * tema, textos) está en el manifest del paquete del juego.
 */

import type { Graphics } from 'pixi.js';
import type { ClientSkin } from '../games.ts';
import { createSymbolTextures as textures } from '../render/symbols.ts';
import { vGradient } from './gradient.ts';

/** Fondo de Maverick: desierto azteca con pirámides en el horizonte. */
function aztecBackdrop(bg: Graphics, w: number, h: number): void {
  vGradient(bg, w, h, [
    [0, 0x2e1d0e],
    [0.45, 0x1a1108],
    [1, 0x0b0906],
  ]);
  const rings = 4;
  for (let i = rings; i > 0; i--) {
    bg.ellipse(w / 2, h * 0.46, (w * 0.42 * i) / rings, (h * 0.44 * i) / rings)
      .fill({ color: 0x3a2410, alpha: 0.14 });
  }
  const py = h * 0.98;
  for (const [cx, pw, ph] of [
    [w * 0.12, w * 0.3, h * 0.2],
    [w * 0.5, w * 0.42, h * 0.28],
    [w * 0.88, w * 0.32, h * 0.22],
  ] as const) {
    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const k = 1 - t / tiers;
      bg.rect(cx - (pw * k) / 2, py - ph * ((t + 1) / tiers), pw * k, ph / tiers + 1)
        .fill({ color: 0x140d07, alpha: 0.85 });
    }
  }
  for (let i = 0; i < 14; i++) {
    const rx = ((i * 97) % 100) / 100;
    const ry = ((i * 53) % 100) / 100;
    bg.circle(rx * w, h * 0.15 + ry * h * 0.55, 1.5 + (i % 3))
      .fill({ color: 0xffd35c, alpha: 0.05 + (i % 4) * 0.02 });
  }
}

export const SKIN_ART: ClientSkin = { textures, backdrop: aztecBackdrop };
