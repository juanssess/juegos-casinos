/**
 * Ambiente que se mueve sobre las escenas pintadas: polvo, arena, nieve, motas.
 *
 * Igual que el agua de Las Cataratas (waterfalls.ts): partículas generadas
 * acá, en coordenadas de la PINTURA, sobre una capa que copia la escala y la
 * posición del fondo. Cada juego trae su receta de emisores; en la función
 * todo se intensifica (más viento, más polvo), que es lo que hace que el
 * bonus se SIENTA distinto aunque el tablero sea el mismo.
 *
 * Es presentación pura: no sabe nada de la jugada.
 */

import { Container, Sprite, Texture, type Application } from 'pixi.js';

import { reducedMotion } from '../render/motion.ts';

type Pt = readonly [number, number];

/**
 * Un emisor. Las posiciones y velocidades están en píxeles de la pintura
 * (1536 × 1536) y por segundo; `rate` es partículas por segundo.
 */
interface Emitter {
  kind: 'puff' | 'grain';
  /** De dónde nacen: un punto, o una línea (se reparte a lo largo). */
  from: readonly Pt[];
  /** Dispersión alrededor del punto de nacimiento. */
  spread: number;
  rate: number;
  life: [number, number];
  vel: Pt;
  /** Variación de la velocidad, en ±. */
  jitter: Pt;
  size: [number, number];
  /** Cuánto crece el tamaño a lo largo de la vida (1 = no crece). */
  grow: number;
  color: number;
  alpha: number;
  /** Multiplicador de `rate` y velocidad durante la función. */
  bonus: number;
}

const RECIPES: Record<string, { size: number; emitters: Emitter[] }> = {
  dunas: {
    size: 1536,
    emitters: [
      // La estela de la moto pintada en la cresta: polvo que sale hacia la derecha.
      { kind: 'puff', from: [[1250, 380]], spread: 14, rate: 11, life: [1.8, 2.8], vel: [80, -16], jitter: [25, 10],
        size: [44, 76], grow: 3.2, color: 0xe8a06a, alpha: 0.55, bonus: 1.8 },
      // Arena que el viento arranca de la cresta de la duna de la derecha.
      { kind: 'grain', from: [[1290, 400], [1330, 640], [1300, 900], [1250, 1180], [1210, 1500]], spread: 22, rate: 70,
        life: [0.9, 1.8], vel: [190, -40], jitter: [60, 30], size: [2, 4.5], grow: 1, color: 0xf0b07a, alpha: 0.7, bonus: 2.2 },
      // Y de la cresta de la izquierda.
      { kind: 'grain', from: [[60, 230], [180, 205], [260, 215]], spread: 18, rate: 25,
        life: [0.9, 1.6], vel: [170, -30], jitter: [50, 25], size: [2, 4], grow: 1, color: 0xf2b886, alpha: 0.6, bonus: 2.2 },
      // Velos de arena muy suaves que cruzan la escena a ras del suelo.
      { kind: 'puff', from: [[-200, 1100], [-200, 1400]], spread: 160, rate: 0.9, life: [9, 13], vel: [190, -6], jitter: [40, 6],
        size: [360, 520], grow: 1.5, color: 0xd98a5a, alpha: 0.13, bonus: 1.7 },
    ],
  },
  asado: {
    size: 1536,
    emitters: [
      // Chispas que saltan de la parrilla de la izquierda y suben con el calor.
      { kind: 'puff', from: [[120, 1000], [420, 980]], spread: 60, rate: 12, life: [1.6, 3], vel: [30, -170], jitter: [40, 50],
        size: [5, 9], grow: 0.4, color: 0xffa040, alpha: 0.85, bonus: 1.8 },
      // El humo del asado, que sube y se abre hacia la derecha.
      { kind: 'puff', from: [[200, 900], [380, 880]], spread: 70, rate: 2.2, life: [6, 9], vel: [45, -70], jitter: [20, 20],
        size: [140, 220], grow: 2.6, color: 0xc8b8a8, alpha: 0.16, bonus: 1.6 },
    ],
  },
  hinchada: {
    size: 1536,
    emitters: [
      // Papelitos que caen sobre la tribuna.
      { kind: 'grain', from: [[-60, -40], [1600, -40]], spread: 30, rate: 26, life: [7, 11], vel: [20, 55], jitter: [30, 20],
        size: [4, 8], grow: 1, color: 0xf2f6ff, alpha: 0.7, bonus: 2.4 },
      // Humo rojo de bengala que sube por los costados.
      { kind: 'puff', from: [[80, 1300], [1456, 1300]], spread: 90, rate: 1.6, life: [7, 10], vel: [0, -90], jitter: [30, 20],
        size: [200, 300], grow: 2.2, color: 0xff5a4a, alpha: 0.13, bonus: 2 },
    ],
  },
  glaciar: {
    size: 1536,
    emitters: [
      // Nieve fina que cae sobre el glaciar y el lago.
      { kind: 'grain', from: [[-100, -30], [1636, -30]], spread: 20, rate: 34, life: [9, 15], vel: [18, 40], jitter: [22, 14],
        size: [3, 7], grow: 1, color: 0xf2fbff, alpha: 0.75, bonus: 2.2 },
      // Bruma fría que corre sobre el agua, entre los témpanos.
      { kind: 'puff', from: [[-220, 1150], [-220, 1420]], spread: 140, rate: 0.7, life: [11, 15], vel: [150, -3], jitter: [30, 4],
        size: [380, 560], grow: 1.4, color: 0xd6eeff, alpha: 0.12, bonus: 1.6 },
    ],
  },
  milonga: {
    size: 1536,
    emitters: [
      // Motas de polvo que brillan en la luz de las arañas y suben despacio.
      { kind: 'puff', from: [[100, 1500], [1436, 1500]], spread: 60, rate: 6, life: [8, 12], vel: [6, -95], jitter: [14, 25],
        size: [7, 13], grow: 1, color: 0xffd9a0, alpha: 0.55, bonus: 1.8 },
      // El humo tibio del salón, en velos que cruzan a media altura.
      { kind: 'puff', from: [[-220, 700], [-220, 1000]], spread: 160, rate: 0.6, life: [12, 16], vel: [110, -6], jitter: [25, 5],
        size: [420, 600], grow: 1.3, color: 0xffc89a, alpha: 0.09, bonus: 1.5 },
    ],
  },
  granpremio: {
    size: 1536,
    emitters: [
      // La nube de polvo pintada sobre la ruta: sigue levantándose y abriéndose.
      { kind: 'puff', from: [[470, 300], [560, 280], [650, 300]], spread: 50, rate: 5, life: [3, 4.5], vel: [-26, -20], jitter: [18, 10],
        size: [90, 140], grow: 2.4, color: 0xe9c79a, alpha: 0.3, bonus: 1.8 },
      // Polvo bajo que cruza la ruta.
      { kind: 'puff', from: [[1700, 1250], [1700, 1450]], spread: 120, rate: 0.8, life: [10, 14], vel: [-180, -4], jitter: [40, 6],
        size: [380, 540], grow: 1.4, color: 0xc9a27a, alpha: 0.12, bonus: 1.7 },
      // Motas doradas que flotan en el aire caliente.
      { kind: 'grain', from: [[0, 1550], [1536, 1550]], spread: 30, rate: 9, life: [5, 9], vel: [-12, -70], jitter: [20, 25],
        size: [3, 6], grow: 1, color: 0xffd9a0, alpha: 0.55, bonus: 1.6 },
    ],
  },
};

/** Un manchón de polvo de bordes muy suaves. */
function puffTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,0.9)');
  r.addColorStop(0.5, 'rgba(255,255,255,0.35)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return Texture.from(c);
}

/** Un grano: un punto con un poco de halo. */
function grainTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d')!;
  const r = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 16, 16);
  return Texture.from(c);
}

interface Particle {
  s: Sprite;
  e: Emitter;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  spin: number;
}

export interface AmbientScene {
  layout(): void;
  setFree(free: boolean): void;
}

/** Monta el ambiente animado arriba de `background`, o `null` si el juego no tiene. */
export function mountAmbient(app: Application, id: string, background: Sprite): AmbientScene | null {
  const recipe = RECIPES[id];
  if (!recipe) return null;

  const layer = new Container();
  layer.eventMode = 'none';
  layer.label = `ambient-${id}`;
  app.stage.addChildAt(layer, app.stage.getChildIndex(background) + 1);

  const tex = { puff: puffTexture(), grain: grainTexture() };
  const pool: Sprite[] = [];
  const live: Particle[] = [];
  const debt = recipe.emitters.map(() => Math.random());
  let free = false;
  let boost = 0;

  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  /** Un punto al azar sobre la línea de nacimiento del emisor. */
  function birthPoint(e: Emitter): Pt {
    if (e.from.length === 1) return e.from[0]!;
    const seg = Math.floor(Math.random() * (e.from.length - 1));
    const a = e.from[seg]!;
    const b = e.from[seg + 1]!;
    const k = Math.random();
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }

  function spawn(e: Emitter, warm = 0): void {
    const s = pool.pop() ?? new Sprite();
    s.texture = tex[e.kind];
    s.anchor.set(0.5);
    s.tint = e.color;
    s.blendMode = e.kind === 'grain' ? 'add' : 'normal';
    layer.addChild(s);
    const [bx, by] = birthPoint(e);
    const speed = 1 + boost * (e.bonus - 1) * 0.6;
    const p: Particle = {
      s, e,
      x: bx + rnd(-e.spread, e.spread),
      y: by + rnd(-e.spread, e.spread),
      vx: (e.vel[0] + rnd(-e.jitter[0], e.jitter[0])) * speed,
      vy: (e.vel[1] + rnd(-e.jitter[1], e.jitter[1])) * speed,
      age: 0,
      life: rnd(e.life[0], e.life[1]),
      size: rnd(e.size[0], e.size[1]),
      spin: rnd(-0.3, 0.3),
    };
    // Al arrancar, la escena ya tiene el ambiente a mitad de camino: no aparece todo de golpe.
    if (warm) {
      p.age = p.life * warm;
      p.x += p.vx * p.age;
      p.y += p.vy * p.age;
    }
    live.push(p);
  }

  // Precalentado: que la primera imagen ya tenga polvo en el aire.
  recipe.emitters.forEach((e) => {
    const n = Math.round(e.rate * (e.life[0] + e.life[1]) * 0.5);
    for (let i = 0; i < n; i++) spawn(e, Math.random());
  });

  app.ticker.add((tk) => {
    const calm = reducedMotion();
    const dt = Math.min(tk.deltaMS, 80) / 1000;
    // La función entra y sale suave, no de golpe.
    boost += ((free ? 1 : 0) - boost) * (1 - Math.exp(-dt * 1.5));

    recipe.emitters.forEach((e, i) => {
      const rate = e.rate * (1 + boost * (e.bonus - 1)) * (calm ? 0.25 : 1);
      debt[i]! += rate * dt;
      while (debt[i]! >= 1) {
        debt[i]! -= 1;
        spawn(e);
      }
    });

    const slow = calm ? 0.3 : 1;
    for (let i = live.length - 1; i >= 0; i--) {
      const p = live[i]!;
      p.age += dt;
      if (p.age >= p.life) {
        live.splice(i, 1);
        layer.removeChild(p.s);
        pool.push(p.s);
        continue;
      }
      const k = p.age / p.life;
      // El viento racheado: la velocidad respira un poco, como el aire de verdad.
      const gust = 1 + 0.25 * Math.sin(p.age * 2.3 + p.size);
      p.x += p.vx * dt * gust * slow;
      p.y += p.vy * dt * slow;
      // Los granos caen de a poco; el polvo sube y se desacelera.
      if (p.e.kind === 'grain') p.vy += 60 * dt;
      else {
        p.vx *= 1 - 0.15 * dt;
        p.vy *= 1 - 0.15 * dt;
      }
      const size = p.size * (1 + (p.e.grow - 1) * k);
      p.s.width = p.e.kind === 'grain' ? size * 1.8 : size;
      p.s.height = size;
      p.s.rotation = p.e.kind === 'grain' ? Math.atan2(p.vy, p.vx) : p.s.rotation + p.spin * dt;
      // Entra y sale con suavidad: nace transparente, se apaga al final.
      const fade = Math.min(1, k / 0.15) * Math.min(1, (1 - k) / 0.35);
      p.s.alpha = p.e.alpha * fade;
      p.s.position.set(p.x, p.y);
    }
  });

  return {
    layout() {
      const s = background.scale.x * (background.texture.width / recipe.size);
      layer.scale.set(s);
      layer.position.copyFrom(background.position);
    },
    setFree(v) {
      free = v;
    },
  };
}
