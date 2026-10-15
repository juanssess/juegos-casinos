/**
 * Arte de cliente de kiosco: la fábrica de símbolos y la escenografía.
 *
 * Es lo único del juego que es código de Pixi. Todo lo demás (matemática,
 * tema, textos) está en el manifest del paquete del juego.
 */

import type { Graphics } from 'pixi.js';
import type { ClientSkin } from '../games.ts';
import { createKioscoTextures as textures } from '../render/symbols-kiosco.ts';
import { vGradient } from './gradient.ts';

/**
 * Fondo de El Kiosco: la vidriera de un kiosco de barrio de noche.
 *
 * Los otros tres son paisajes —pirámides, mesetas, cordillera— y los tres
 * son cálidos. Este es una FACHADA y es frío: azul petróleo de vereda a las
 * once de la noche, con la única luz cálida saliendo de la vidriera. El
 * tablero se apoya justo donde estaría el vidrio, así que el juego entero
 * se lee como "lo que hay adentro del kiosco".
 *
 * El toldo a rayas arriba y la guirnalda de lamparitas son lo que dice
 * kiosco sin escribir una letra.
 */
function kioscoBackdrop(bg: Graphics, w: number, h: number): void {
  vGradient(bg, w, h, [
    [0, 0x0a1a26],
    [0.45, 0x0f2433],
    [0.8, 0x0a1822],
    [1, 0x050b10],
  ]);

  // La pared: azulejos chicos, apenas marcados. Textura sin ruido.
  const tile = Math.max(26, w / 48);
  for (let y = h * 0.16; y < h * 0.86; y += tile) {
    bg.rect(0, y, w, 1).fill({ color: 0x6fb0c8, alpha: 0.05 });
  }
  for (let x = 0; x < w; x += tile) {
    bg.rect(x, h * 0.16, 1, h * 0.7).fill({ color: 0x6fb0c8, alpha: 0.035 });
  }

  // La vidriera: el resplandor cálido detrás del tablero.
  for (let i = 7; i > 0; i--) {
    bg.ellipse(w / 2, h * 0.47, (w * 0.44 * i) / 7, (h * 0.42 * i) / 7)
      .fill({ color: 0xffb066, alpha: 0.03 });
  }

  // Estantes a los costados, con frascos de golosinas como siluetas de color.
  const colores = [0xff5fa2, 0xffd35c, 0x2fb6e8, 0x67b82c, 0xf07f12, 0xb02a8c];
  for (const lado of [-1, 1] as const) {
    const x0 = lado < 0 ? w * 0.02 : w * 0.82;
    const ancho = w * 0.16;
    for (let k = 0; k < 4; k++) {
      const y = h * (0.3 + k * 0.15);
      bg.rect(x0, y, ancho, 4).fill({ color: 0x3a2a1c, alpha: 0.85 });
      bg.rect(x0, y + 4, ancho, 2).fill({ color: 0x000000, alpha: 0.4 });
      // Frascos: vidrio apenas visible y el color de las golosinas adentro.
      const n = 4;
      for (let j = 0; j < n; j++) {
        const fw = ancho / n - 6;
        const fx = x0 + j * (ancho / n) + 3;
        const fh = h * 0.08;
        bg.roundRect(fx, y - fh, fw, fh, 4).fill({ color: 0xbfe4f0, alpha: 0.07 });
        bg.roundRect(fx + 2, y - fh * 0.55, fw - 4, fh * 0.55 - 1, 3)
          .fill({ color: colores[(j + k * 2 + (lado > 0 ? 3 : 0)) % colores.length]!, alpha: 0.32 });
        bg.rect(fx + 2, y - fh - 4, fw - 4, 5).fill({ color: 0x8a6a3a, alpha: 0.6 });
      }
    }
  }

  // El toldo a rayas, arriba de todo, con su borde festoneado.
  const ty = h * 0.13;
  const franja = Math.max(34, w / 22);
  for (let x = 0, k = 0; x < w; x += franja, k++) {
    bg.rect(x, 0, franja, ty).fill({ color: k % 2 ? 0xf2e6d6 : 0xc8283c, alpha: 0.9 });
    bg.circle(x + franja / 2, ty, franja / 2).fill({ color: k % 2 ? 0xf2e6d6 : 0xc8283c, alpha: 0.9 });
  }
  bg.rect(0, 0, w, ty).fill({ color: 0x000000, alpha: 0.35 });

  // Guirnalda de lamparitas colgando bajo el toldo.
  const luces = 22;
  for (let i = 0; i <= luces; i++) {
    const x = (i / luces) * w;
    const y = ty + franja * 0.7 + Math.sin((i / luces) * Math.PI * 3) * 10;
    bg.circle(x, y, 9).fill({ color: 0xffd98a, alpha: 0.12 });
    bg.circle(x, y, 3.2).fill({ color: 0xfff0c4, alpha: 0.85 });
  }

  // El neón rosa: un trazo de cartel sobre la vidriera, sin letras.
  for (const [a, wd] of [[0.08, 14], [0.18, 7], [0.85, 2.4]] as const) {
    bg.roundRect(w * 0.3, h * 0.07, w * 0.4, h * 0.05, h * 0.025)
      .stroke({ width: wd, color: 0xff5fa2, alpha: a });
  }

  // Vereda: baldosas en perspectiva abajo.
  const vy = h * 0.88;
  bg.rect(0, vy, w, h - vy).fill({ color: 0x1a242c, alpha: 0.9 });
  for (let i = -10; i <= 10; i++) {
    bg.moveTo(w / 2 + i * w * 0.02, vy).lineTo(w / 2 + i * w * 0.12, h)
      .stroke({ width: 1, color: 0x000000, alpha: 0.35 });
  }
  bg.rect(0, vy, w, 3).fill({ color: 0xffb066, alpha: 0.18 });
}

export const SKIN_ART: ClientSkin = { textures, backdrop: kioscoBackdrop };
