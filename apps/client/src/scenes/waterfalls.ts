/**
 * Agua que se mueve sobre la escena pintada de Las Cataratas.
 *
 * La escena es una pintura quieta; esto le pone encima, recortado a la forma
 * de cada salto, agua que cae: dos capas de vetas que bajan a distinta
 * velocidad (la de atrás más lenta), bruma que respira al pie de cada salto
 * y un brillo que corre sobre el río. Todo se genera acá en un canvas, así
 * que no hay arte extra que pedir, y todo usa coordenadas de la PINTURA:
 * el contenedor copia la escala y la posición del sprite de fondo, y el agua
 * queda pegada a la cascada pintada en cualquier tamaño de pantalla.
 *
 * Es presentación pura: no sabe nada de la jugada.
 */

import { Container, Sprite, Texture, TilingSprite, type Application } from 'pixi.js';

import { reducedMotion } from '../render/motion.ts';

type Pt = readonly [number, number];

interface Fall {
  /** La forma del salto, en píxeles de la pintura (1536 × 1536). */
  shape: readonly Pt[];
  /** Velocidad de caída, en píxeles de la pintura por segundo. */
  speed: number;
  /** Dónde nace la bruma al pie, y de qué tamaño. */
  mist: { x: number; y: number; r: number };
}

/** Las escenas con agua animada, por juego. Las coordenadas salen de mirar la pintura. */
const SCENES: Record<string, { size: number; falls: Fall[]; river: readonly Pt[] }> = {
  cataratas: {
    size: 1536,
    falls: [
      {
        // El salto grande de la izquierda: el labio baja de izquierda a derecha.
        shape: [[38, 592], [165, 586], [305, 640], [452, 702], [520, 880], [546, 1010], [505, 1195], [300, 1255], [60, 1248], [24, 1050]],
        speed: 260,
        mist: { x: 300, y: 1215, r: 300 },
      },
      {
        // El de la derecha, angosto y alto.
        shape: [[1338, 545], [1398, 538], [1440, 625], [1462, 800], [1456, 1050], [1440, 1198], [1300, 1222], [1228, 1180], [1226, 905], [1262, 705]],
        speed: 300,
        mist: { x: 1330, y: 1195, r: 190 },
      },
    ],
    river: [[110, 1262], [700, 1240], [1090, 1250], [1460, 1325], [1536, 1400], [1536, 1536], [0, 1536], [0, 1330]],
  },
};

/** Vetas de agua que se repiten hacia abajo sin costura. */
function streakTexture(seed: number, density: number): Texture {
  const W = 256;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.filter = 'blur(1.4px)';
  for (let i = 0; i < density; i++) {
    const x = rnd() * W;
    const w = 1 + rnd() * 3.5;
    const len = 60 + rnd() * 260;
    const y = rnd() * H;
    const a = 0.12 + rnd() * 0.45;
    // Cada veta se dibuja dos veces, desplazada un alto entero: así la textura
    // se repite hacia abajo sin que se vea dónde empieza.
    for (const dy of [0, -H]) {
      const grad = g.createLinearGradient(0, y + dy, 0, y + dy + len);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.3, `rgba(240,250,255,${a})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(x, y + dy, w, len);
    }
  }
  return Texture.from(c);
}

/** Una máscara de bordes suaves con la forma dada (para que el agua no tenga recorte duro). */
function softMask(shape: readonly Pt[], size: number, feather: number): Texture {
  const c = document.createElement('canvas');
  // La máscara va a media resolución: es un degradé, no necesita más.
  const k = 0.5;
  c.width = size * k;
  c.height = size * k;
  const g = c.getContext('2d')!;
  g.filter = `blur(${feather * k}px)`;
  g.fillStyle = '#fff';
  g.beginPath();
  shape.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k)));
  g.closePath();
  g.fill();
  return Texture.from(c);
}

/** Bruma: un manchón blanco de bordes muy suaves. */
function mistTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  r.addColorStop(0, 'rgba(255,255,255,0.55)');
  r.addColorStop(0.45, 'rgba(240,248,255,0.22)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 256, 256);
  return Texture.from(c);
}

/** Bounding box de una forma. */
function boxOf(shape: readonly Pt[]): { x: number; y: number; w: number; h: number } {
  const xs = shape.map((p) => p[0]);
  const ys = shape.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export interface WaterScene {
  layout(): void;
  setFree(free: boolean): void;
}

/**
 * Monta el agua animada arriba de la escena `background`, si el juego tiene.
 * Devuelve `null` para los juegos sin agua.
 */
export function mountWaterfalls(app: Application, id: string, background: Sprite): WaterScene | null {
  const def = SCENES[id];
  if (!def) return null;

  const layer = new Container();
  layer.eventMode = 'none';
  layer.label = `water-${id}`;
  // Justo arriba de la pintura: debajo del tablero y de todo lo demás.
  app.stage.addChildAt(layer, app.stage.getChildIndex(background) + 1);

  const flows: { tile: TilingSprite; speed: number }[] = [];
  const mists: { s: Sprite; base: number; phase: number; scale: number }[] = [];
  const mistTex = mistTexture();

  def.falls.forEach((f, i) => {
    const b = boxOf(f.shape);
    const mask = new Sprite(softMask(f.shape, def.size, 18));
    mask.scale.set(1 / 0.5);
    const group = new Container();
    // Dos capas: la de atrás más tenue y lenta, la de adelante más rápida.
    for (const [layerIdx, density, alpha, mul] of [[0, 70, 0.45, 0.62], [1, 110, 0.7, 1]] as const) {
      const tile = new TilingSprite({ texture: streakTexture(97 + i * 31 + layerIdx * 7, density), width: b.w + 40, height: b.h + 40 });
      tile.position.set(b.x - 20, b.y - 20);
      tile.alpha = alpha;
      tile.blendMode = 'add';
      // La de atrás un poco más ancha: las vetas no coinciden y el agua tiene cuerpo.
      tile.tileScale.set(layerIdx === 0 ? 1.6 : 1.1, 1);
      group.addChild(tile);
      flows.push({ tile, speed: f.speed * mul });
    }
    group.addChild(mask);
    group.mask = mask;
    layer.addChild(group);

    // Bruma al pie del salto: tres manchones que respiran desfasados.
    for (let k = 0; k < 3; k++) {
      const s = new Sprite(mistTex);
      s.anchor.set(0.5);
      s.width = s.height = f.mist.r * (1.1 + k * 0.35);
      s.position.set(f.mist.x + (k - 1) * f.mist.r * 0.35, f.mist.y - k * f.mist.r * 0.12);
      s.blendMode = 'screen';
      layer.addChild(s);
      mists.push({ s, base: 0.45 - k * 0.08, phase: k * 2.1 + i, scale: s.scale.x });
    }
  });

  // El río: un brillo que corre hacia adelante.
  const rb = boxOf(def.river);
  const riverMask = new Sprite(softMask(def.river, def.size, 30));
  riverMask.scale.set(2);
  const river = new TilingSprite({ texture: streakTexture(7, 50), width: rb.w, height: rb.h });
  river.position.set(rb.x, rb.y);
  river.alpha = 0.22;
  river.blendMode = 'add';
  // Vetas acostadas y estiradas: en el río el agua corre, no cae.
  river.tileScale.set(0.6, 0.35);
  const riverGroup = new Container();
  riverGroup.addChild(river, riverMask);
  riverGroup.mask = riverMask;
  layer.addChild(riverGroup);

  let t = 0;
  let free = false;
  app.ticker.add((tk) => {
    // Con "menos movimiento" el agua cae igual, pero mucho más despacio.
    const k = reducedMotion() ? 0.15 : 1;
    const dt = (tk.deltaMS / 1000) * k * (free ? 1.35 : 1);
    t += dt;
    for (const f of flows) f.tile.tilePosition.y += f.speed * dt;
    river.tilePosition.y += 55 * dt;
    river.tilePosition.x += 18 * dt;
    for (const m of mists) {
      m.s.alpha = m.base * (0.75 + 0.25 * Math.sin(t * 0.7 + m.phase));
      m.s.scale.set(m.scale * (1 + 0.06 * Math.sin(t * 0.5 + m.phase)));
    }
  });

  return {
    layout() {
      // La capa copia la transformación de la pintura: el agua queda sobre la cascada.
      const s = background.scale.x * (background.texture.width / def.size);
      layer.scale.set(s);
      layer.position.copyFrom(background.position);
      layer.alpha = background.alpha;
    },
    setFree(v) {
      free = v;
      layer.alpha = background.alpha;
    },
  };
}
