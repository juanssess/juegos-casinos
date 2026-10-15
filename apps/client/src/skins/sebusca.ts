/**
 * Arte de cliente de sebusca: la fábrica de símbolos y la escenografía.
 *
 * Es lo único del juego que es código de Pixi. Todo lo demás (matemática,
 * tema, textos) está en el manifest del paquete del juego.
 */

import type { Graphics } from 'pixi.js';
import type { ClientSkin } from '../games.ts';
import { createSebuscaTextures as textures } from '../render/symbols-sebusca.ts';
import { vGradient } from './gradient.ts';

/** Fondo de Se Busca: atardecer del desierto, mesetas y cactus. */
function westernBackdrop(bg: Graphics, w: number, h: number): void {
  // Cielo de atardecer: naranja quemado arriba, tierra oscura abajo.
  vGradient(bg, w, h, [
    [0, 0x8a4a1c],
    [0.3, 0x5e2f16],
    [0.6, 0x2a170c],
    [1, 0x120c08],
  ]);

  // Sol bajo, cerca del horizonte de las mesetas.
  const sunY = h * 0.3;
  for (let i = 6; i > 0; i--) {
    bg.circle(w * 0.5, sunY, (h * 0.26 * i) / 6)
      .fill({ color: 0xffb347, alpha: 0.05 });
  }
  bg.circle(w * 0.5, sunY, h * 0.055).fill({ color: 0xffd98a, alpha: 0.5 });
  bg.circle(w * 0.5, sunY, h * 0.04).fill({ color: 0xfff0c4, alpha: 0.65 });

  // Mesetas: la silueta del oeste. Planas arriba, a diferencia de las
  // pirámides escalonadas de Maverick.
  const gy = h * 0.99;
  for (const [cx, mw, mh, alpha] of [
    [w * 0.16, w * 0.34, h * 0.19, 0.55],
    [w * 0.82, w * 0.4, h * 0.24, 0.6],
    [w * 0.48, w * 0.26, h * 0.13, 0.45],
  ] as const) {
    bg.poly([
      cx - mw / 2, gy,
      cx - mw / 2 + mw * 0.1, gy - mh,
      cx + mw / 2 - mw * 0.12, gy - mh,
      cx + mw / 2, gy,
    ]).fill({ color: 0x1a0f08, alpha });
  }

  // Cactus saguaro a los costados: el detalle que dice "western" al instante.
  for (const [cx, s] of [[w * 0.07, 1], [w * 0.93, 0.85]] as const) {
    const ch = h * 0.16 * s;
    const cw = 11 * s;
    bg.roundRect(cx - cw / 2, gy - ch, cw, ch, cw / 2).fill({ color: 0x120a05, alpha: 0.8 });
    // Brazos.
    bg.roundRect(cx - cw * 2.2, gy - ch * 0.72, cw * 0.8, ch * 0.34, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx - cw * 2.2, gy - ch * 0.72, cw * 1.9, cw * 0.8, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx + cw * 1.4, gy - ch * 0.58, cw * 0.8, ch * 0.26, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx - cw * 0.4, gy - ch * 0.58, cw * 2.2, cw * 0.8, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
  }

  // Polvo en suspensión.
  for (let i = 0; i < 18; i++) {
    const rx = ((i * 61) % 100) / 100;
    const ry = ((i * 37) % 100) / 100;
    bg.circle(rx * w, h * 0.25 + ry * h * 0.5, 1 + (i % 3))
      .fill({ color: 0xe8d3a0, alpha: 0.04 + (i % 3) * 0.015 });
  }
}

export const SKIN_ART: ClientSkin = { textures, backdrop: westernBackdrop };
