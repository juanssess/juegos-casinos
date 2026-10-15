/**
 * Arte de cliente de vendimia: la fábrica de símbolos y la escenografía.
 *
 * Es lo único del juego que es código de Pixi. Todo lo demás (matemática,
 * tema, textos) está en el manifest del paquete del juego.
 */

import type { Graphics } from 'pixi.js';
import type { ClientSkin } from '../games.ts';
import { createVendimiaTextures as textures } from '../render/symbols-vendimia.ts';
import { vGradient } from './gradient.ts';

/**
 * Fondo de La Vendimia: Mendoza al atardecer, con los Andes al fondo y las
 * hileras de la finca yéndose en perspectiva.
 *
 * Los otros dos fondos son de tierra —pirámides y mesetas, los dos marrones
 * contra un cielo cálido—. Este es el primero con violeta y con NIEVE, y esa
 * diferencia de temperatura es lo que hace que al entrar se note enseguida
 * que es otro juego y no otro skin del mismo.
 */
function mendozaBackdrop(bg: Graphics, w: number, h: number): void {
  // Cielo de atardecer cuyano: naranja bajo, violeta arriba.
  vGradient(bg, w, h, [
    [0, 0x3d1743],
    [0.26, 0x6e2542],
    [0.44, 0xc0602f],
    [0.53, 0x53261f],
    [1, 0x120711],
  ]);

  const hz = h * 0.53;

  // El sol justo tocando la cordillera.
  for (let i = 8; i > 0; i--) {
    bg.circle(w * 0.36, hz - h * 0.03, (h * 0.34 * i) / 8).fill({ color: 0xffb066, alpha: 0.035 });
  }
  bg.circle(w * 0.36, hz - h * 0.03, h * 0.055).fill({ color: 0xffd9a0, alpha: 0.6 });

  /* LOS ANDES, en DOS capas de profundidad.
     La primera version era una sola silueta de picos bajos y a pantalla
     completa se leia como una linea quebrada, no como una cordillera. Lo
     que da la sensacion de montaña es que haya una cadena lejana, clara y
     borrosa, y otra cercana, oscura y con la nieve marcada: la profundidad
     no la hace el dibujo de cada pico sino la diferencia entre las dos. */
  const cadena = (
    base: number, alto: number, semilla: number, color: number, alpha: number, nieve: number,
  ): void => {
    const N = 22;
    const pts: [number, number][] = [];
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * w;
      const k =
        0.42 +
        0.34 * Math.abs(Math.sin(i * 1.31 + semilla)) +
        0.24 * Math.abs(Math.cos(i * 0.57 + semilla * 2));
      pts.push([x, base - alto * k]);
    }
    const poly: number[] = [0, h];
    for (const [x, y] of pts) poly.push(x, y);
    poly.push(w, h);
    bg.poly(poly).fill({ color, alpha });

    if (nieve <= 0) return;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i]!;
      if (y > pts[i - 1]![1] || y > pts[i + 1]![1]) continue; // no es cumbre
      const anchoPico = (w / N) * 0.9;
      bg.poly([
        x - anchoPico * 0.5, y + alto * 0.22,
        x - anchoPico * 0.16, y + alto * 0.1,
        x, y,
        x + anchoPico * 0.2, y + alto * 0.12,
        x + anchoPico * 0.5, y + alto * 0.22,
      ]).fill({ color: 0xf0e6f6, alpha: nieve });
    }
  };

  cadena(hz + h * 0.02, h * 0.2, 0.7, 0x5b3a5e, 0.55, 0.22);
  cadena(hz + h * 0.06, h * 0.26, 2.4, 0x2a1733, 0.95, 0.4);

  /* LAS HILERAS DE LA FINCA.
     Van en perspectiva hacia un punto de fuga sobre el horizonte. Es lo que
     dice "vinedo" sin dibujar una sola uva, y es tambien lo que hace que la
     mitad de abajo de la pantalla no sea un rectangulo de color plano. */
  const fugaX = w * 0.5;
  for (let i = -12; i <= 12; i++) {
    const x0 = fugaX + i * (w * 0.1);
    bg.poly([x0, h + 4, x0 + w * 0.042, h + 4, fugaX + i * 5, hz + 6])
      .fill({ color: 0x14210f, alpha: 0.5 });
  }
  // Travesanios de los parrales: se juntan al alejarse.
  for (let k = 1; k <= 9; k++) {
    const t = k / 10;
    const y = hz + (h - hz) * (t * t);
    bg.rect(0, y, w, 1.4 + t * 1.6).fill({ color: 0x0a1207, alpha: 0.34 });
  }

  // Polvo dorado en suspension sobre la finca.
  for (let i = 0; i < 18; i++) {
    const rx = ((i * 71) % 100) / 100;
    const ry = ((i * 43) % 100) / 100;
    bg.circle(rx * w, hz * 0.35 + ry * h * 0.5, 1 + (i % 3))
      .fill({ color: 0xffd9a0, alpha: 0.05 + (i % 3) * 0.015 });
  }
}

export const SKIN_ART: ClientSkin = { textures, backdrop: mendozaBackdrop };
