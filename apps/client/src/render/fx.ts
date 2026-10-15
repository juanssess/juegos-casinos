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

import { Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import coinUrl from './shared/coin.png?url';
import coinEdgeUrl from './shared/coin-edge.png?url';
import sparklesUrl from './shared/sparkles.png?url';
import { PALETTE } from './theme.ts';
import { reducedMotion } from './motion.ts';

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
const SPARKLE_LIFE = 750;

/**
 * El arte compartido de las celebraciones: la moneda de la casa (de frente y
 * de canto) y los destellos. Pintados, como todo lo que ve el jugador; si no
 * cargan, las monedas se dibujan como antes.
 */
let ART: { coin: Texture; edge: Texture; sparkles: Texture } | null = null;

interface Sparkle {
  s: Sprite;
  life: number;
  size: number;
}
const GRAVITY = 1600 / 1000; // px/s² expresado por ms

export class Fx {
  readonly view = new Container();
  #g = new Graphics();
  #coins: Coin[] = [];
  /** Una moneda pintada por moneda viva; se reciclan. */
  #coinLayer = new Container();
  #coinSprites: Sprite[] = [];
  #sparkles: Sparkle[] = [];
  #w: number;
  #h: number;

  /** El cartel oscuro detrás del anuncio: sin él, el texto se pierde sobre los símbolos. */
  #halo = new Graphics();
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
    this.view.addChild(this.#coinLayer);
    this.#halo.roundRect(12, h / 2 - 90, w - 24, 150, 16).fill({ color: 0x080a10, alpha: 0.94 })
      .stroke({ color: PALETTE.win, alpha: 0.85, width: 2 });
    this.#halo.roundRect(19, h / 2 - 83, w - 38, 136, 12).stroke({ color: PALETTE.win, alpha: 0.22, width: 1 });
    this.#halo.alpha = 0;
    this.view.addChild(this.#halo);

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

  /** Carga el arte compartido. Se llama una vez, antes de la primera celebración. */
  static async preload(): Promise<void> {
    try {
      const [coin, edge, sparkles] = await Promise.all([
        Assets.load<Texture>(coinUrl), Assets.load<Texture>(coinEdgeUrl), Assets.load<Texture>(sparklesUrl),
      ]);
      ART = { coin, edge, sparkles };
    } catch {
      ART = null; // sin arte, las monedas se dibujan
    }
  }

  /** Fuente de monedas desde el centro del tablero. */
  burst(n: number): void {
    if (reducedMotion()) return;
    // Destellos donde arranca la fuente: uno cada diez monedas, con techo.
    if (ART) {
      for (let i = 0; i < Math.min(8, Math.ceil(n / 10)); i++) {
        const s = new Sprite(ART.sparkles);
        s.anchor.set(0.5);
        s.position.set(this.#w / 2 + (Math.random() - 0.5) * this.#w * 0.7, this.#h * (0.2 + Math.random() * 0.45));
        s.rotation = Math.random() * Math.PI;
        this.#coinLayer.addChild(s);
        this.#sparkles.push({ s, life: SPARKLE_LIFE + Math.random() * 300, size: 26 + Math.random() * 30 });
      }
    }
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
    if (reducedMotion()) return;
    this.#shakeAmp = Math.max(this.#shakeAmp, amp);
  }

  /** Cartel central con entrada elástica, sostén y salida. */
  announce(main: string, sub: string, holdMs: number): void {
    // El texto se achica para entrar en el cartel: "¡PREMIO GIGANTE!" no cabe al tamaño de "×9".
    this.#plaque.style.fontSize = Math.min(54, (this.#w - 46) / (main.length * 0.68));
    this.#plaque.text = main;
    this.#plaqueSub.text = sub;
    this.#plaqueT = 0;
    this.#plaqueHold = holdMs;
  }

  /** Monedas dibujadas: el respaldo si el arte no cargó. */
  #drawCoins(): void {
    for (const c of this.#coins) {
      const alpha = Math.min(1, c.life / 400);
      const rx = Math.max(1.2, Math.abs(Math.cos(c.phase)) * c.r);
      this.#g.ellipse(c.x, c.y, rx, c.r).fill({ color: PALETTE.win, alpha });
      this.#g.ellipse(c.x, c.y, rx * 0.55, c.r * 0.55).fill({ color: 0xfff0c0, alpha: alpha * 0.8 });
    }
    if (this.#coins.length === 0) this.#g.clear();
  }

  /**
   * Monedas pintadas que giran sobre su eje: de frente se ve la cara con el
   * tigre, y cuando el giro las pone casi de perfil se cambia a la moneda de
   * canto. Sin ese cambio, una moneda plana aplastada a lo ancho parece una
   * línea; con él, tiene espesor.
   */
  #drawPaintedCoins(): void {
    const art = ART!;
    while (this.#coinSprites.length < this.#coins.length) {
      const s = new Sprite(art.coin);
      s.anchor.set(0.5);
      this.#coinLayer.addChildAt(s, 0);
      this.#coinSprites.push(s);
    }
    this.#coinSprites.forEach((s, i) => {
      const c = this.#coins[i];
      s.visible = c !== undefined;
      if (!c) return;
      // Más grandes que las dibujadas: a este tamaño se lee el tigre de la cara.
      const size = c.r * 3.6;
      const face = Math.cos(c.phase);
      const edgeOn = Math.abs(face) < 0.32;
      s.texture = edgeOn ? art.edge : art.coin;
      s.height = size;
      s.width = edgeOn ? size * 0.62 : size * Math.abs(face);
      s.position.set(c.x, c.y);
      s.rotation = c.vx * 0.0006;
      s.alpha = Math.min(1, c.life / 400);
    });
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
        next.push(c);
      }
      this.#coins = next;
      if (ART) this.#drawPaintedCoins();
      else this.#drawCoins();
    }

    // ── Destellos ──
    if (this.#sparkles.length > 0) {
      this.#sparkles = this.#sparkles.filter((p) => {
        p.life -= dtMs;
        if (p.life <= 0) {
          p.s.destroy();
          return false;
        }
        // Nace, brilla y se apaga: una campana de tamaño y opacidad.
        const k = 1 - p.life / SPARKLE_LIFE;
        const bell = Math.sin(Math.min(1, Math.max(0, k)) * Math.PI);
        p.s.width = p.s.height = p.size * (0.4 + bell * 0.8);
        p.s.alpha = bell;
        p.s.rotation += dtMs * 0.0015;
        return true;
      });
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
      this.#halo.alpha = alpha;
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
