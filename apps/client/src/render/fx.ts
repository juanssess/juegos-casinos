/**
 * Efectos de celebración: lluvia de monedas, sacudida de pantalla y carteles
 * de premio grande.
 *
 * Esto es la mitad de la diferencia entre "una demo" y "un juego". La regla
 * de la industria: el TAMAÑO de la celebración tiene que ser proporcional al
 * premio. Un 2x no merece nada; un 40x merece que tiemble la pantalla. Si
 * todo se celebra igual, nada se celebra.
 *
 * Las monedas son un solo Graphics redibujado por frame (barato: son elipses)
 * y el "giro" de cada moneda se finge variando el radio horizontal con un
 * coseno — el truco más viejo del mundo y sigue funcionando.
 */

import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE } from './theme.ts';

interface Coin {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  spin: number;
  life: number;
}

const COIN_LIFE = 1600;
const GRAVITY = 1600 / 1000; // px/s² expresado por ms

export class Fx {
  readonly view = new Container();
  #g = new Graphics();
  #coins: Coin[] = [];
  #w: number;
  #h: number;

  #plaque: Text;
  #plaqueSub: Text;
  #plaqueT = -1;
  #plaqueHold = 0;

  #shakeAmp = 0;
  /** Desplazamiento de sacudida; el orquestador lo aplica al tablero. */
  offsetX = 0;
  offsetY = 0;

  constructor(w: number, h: number) {
    this.#w = w;
    this.#h = h;
    this.view.addChild(this.#g);

    this.#plaque = new Text({
      text: '',
      style: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 54,
        fontWeight: '700',
        fill: PALETTE.win,
        letterSpacing: 3,
        stroke: { color: 0x2a1503, width: 6, join: 'round' },
        dropShadow: { color: 0x000000, blur: 8, distance: 4, angle: Math.PI / 3, alpha: 0.6 },
      },
    });
    this.#plaque.anchor.set(0.5);
    this.#plaque.position.set(w / 2, h / 2 - 22);
    this.#plaque.alpha = 0;

    this.#plaqueSub = new Text({
      text: '',
      style: {
        fontFamily: 'Georgia, serif',
        fontSize: 22,
        fontWeight: '700',
        fill: PALETTE.text,
        stroke: { color: 0x2a1503, width: 4, join: 'round' },
      },
    });
    this.#plaqueSub.anchor.set(0.5);
    this.#plaqueSub.position.set(w / 2, h / 2 + 26);
    this.#plaqueSub.alpha = 0;

    this.view.addChild(this.#plaque, this.#plaqueSub);
  }

  /** Fuente de monedas desde el centro del tablero. */
  burst(n: number): void {
    for (let i = 0; i < n && this.#coins.length < 160; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 350 + Math.random() * 550;
      this.#coins.push({
        x: this.#w / 2 + (Math.random() - 0.5) * 120,
        y: this.#h * 0.42,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: 5 + Math.random() * 5,
        phase: Math.random() * Math.PI * 2,
        spin: 6 + Math.random() * 10,
        life: COIN_LIFE,
      });
    }
  }

  /** Sacudida de pantalla; decae sola. */
  shake(amp: number): void {
    this.#shakeAmp = Math.max(this.#shakeAmp, amp);
  }

  /** Cartel central con entrada elástica, sostén y salida. */
  announce(main: string, sub: string, holdMs: number): void {
    this.#plaque.text = main;
    this.#plaqueSub.text = sub;
    this.#plaqueT = 0;
    this.#plaqueHold = holdMs;
  }

  update(dtMs: number): void {
    // ── Monedas ──
    if (this.#coins.length > 0) {
      this.#g.clear();
      const next: Coin[] = [];
      for (const c of this.#coins) {
        c.life -= dtMs;
        if (c.life <= 0 || c.y > this.#h + 60) continue;
        c.vy += GRAVITY * dtMs;
        c.x += (c.vx * dtMs) / 1000;
        c.y += (c.vy * dtMs) / 1000;
        c.phase += (c.spin * dtMs) / 1000;

        const alpha = Math.min(1, c.life / 400);
        const rx = Math.max(1.2, Math.abs(Math.cos(c.phase)) * c.r);
        this.#g.ellipse(c.x, c.y, rx, c.r).fill({ color: PALETTE.win, alpha });
        this.#g.ellipse(c.x, c.y, rx * 0.55, c.r * 0.55).fill({ color: 0xfff0c0, alpha: alpha * 0.8 });
        next.push(c);
      }
      this.#coins = next;
      if (next.length === 0) this.#g.clear();
    }

    // ── Cartel ──
    if (this.#plaqueT >= 0) {
      this.#plaqueT += dtMs;
      const IN = 280;
      const OUT = 320;
      const t = this.#plaqueT;
      let alpha = 1;
      let scale = 1;
      if (t < IN) {
        // ease-out-back: entra pasándose un poco, como un sello.
        const k = t / IN;
        const c1 = 1.70158;
        scale = 1 + (c1 + 1) * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
        alpha = Math.min(1, k * 2);
      } else if (t > IN + this.#plaqueHold) {
        const k = Math.min(1, (t - IN - this.#plaqueHold) / OUT);
        alpha = 1 - k;
        scale = 1 + k * 0.08;
        if (k >= 1) this.#plaqueT = -1;
      }
      this.#plaque.alpha = alpha;
      this.#plaque.scale.set(Math.max(0.01, scale));
      this.#plaqueSub.alpha = alpha;
      this.#plaqueSub.scale.set(Math.max(0.01, scale));
    }

    // ── Sacudida ──
    if (this.#shakeAmp > 0.3) {
      this.offsetX = (Math.random() - 0.5) * 2 * this.#shakeAmp;
      this.offsetY = (Math.random() - 0.5) * 2 * this.#shakeAmp;
      this.#shakeAmp *= Math.exp(-dtMs / 140);
    } else {
      this.#shakeAmp = 0;
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }
}
