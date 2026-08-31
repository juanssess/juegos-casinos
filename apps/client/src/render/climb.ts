/**
 * La Escalinata — la escena del bonus.
 *
 * Igual que todo lo demás: el resultado YA está decidido (viene en el
 * ClimbDto del servidor); esto es la puesta en escena. La gramática del
 * suspenso es fija: tambor → pausa → resultado. La pausa es el bonus.
 *
 * Es un overlay que tapa el tablero: pirámide de N niveles con su paquete
 * ("8 GIROS ×4" … "20 GIROS ×10"), un sol que sube escalón por escalón, y
 * al final el paquete ganado en grande.
 */

import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE } from './theme.ts';
import type { ClimbDto } from '@casino/protocol';

interface TierInfo {
  spins: number;
  multiplier: number;
}

const STEP_H = 52;

function label(text: string, size: number, color: number, weight: '400' | '700' = '700'): Text {
  const t = new Text({
    text,
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: size,
      fontWeight: weight,
      fill: color,
      letterSpacing: 1,
      stroke: { color: 0x120b06, width: 4, join: 'round' },
    },
  });
  t.anchor.set(0.5);
  return t;
}

export class ClimbScene {
  readonly view = new Container();
  #w: number;
  #h: number;
  #steps: Graphics[] = [];
  #stepLabels: Text[] = [];
  #sun = new Graphics();
  #title: Text;
  #shakeT = 0;
  #sunY = 0;
  #sunTargetY = 0;
  #pulseT = 0;

  constructor(w: number, h: number) {
    this.#w = w;
    this.#h = h;
    this.view.visible = false;
    this.#title = label('LA ESCALINATA', 30, PALETTE.win);
  }

  /** Construye la pirámide para estos paquetes (se rehace por si cambian). */
  #build(tiers: readonly TierInfo[]): void {
    this.view.removeChildren();
    this.#steps = [];
    this.#stepLabels = [];

    const overlay = new Graphics()
      .rect(-30, -30, this.#w + 60, this.#h + 60)
      .fill({ color: 0x050302, alpha: 0.88 });
    this.view.addChild(overlay);

    this.#title.position.set(this.#w / 2, 26);
    this.view.addChild(this.#title);

    const n = tiers.length;
    const baseW = this.#w * 0.72;
    const bottom = this.#h - 18;

    for (let i = 0; i < n; i++) {
      const t = tiers[i]!;
      const wStep = baseW * (1 - (i * 0.16));
      const y = bottom - (i + 1) * STEP_H;
      const g = new Graphics()
        .roundRect(this.#w / 2 - wStep / 2, y, wStep, STEP_H - 6, 8)
        .fill({ color: 0x1c150d, alpha: 0.95 })
        .stroke({ width: 2, color: PALETTE.frame, alpha: 0.9 });
      this.view.addChild(g);
      this.#steps.push(g);

      const isTop = i === n - 1;
      const txt = label(
        `${t.spins} GIROS ×${t.multiplier}`,
        isTop ? 19 : 17,
        isTop ? PALETTE.scatter : PALETTE.textDim,
      );
      txt.position.set(this.#w / 2, y + (STEP_H - 6) / 2);
      this.view.addChild(txt);
      this.#stepLabels.push(txt);
    }

    // El sol que escala: arranca al pie del primer escalón.
    this.#drawSun();
    this.view.addChild(this.#sun);
  }

  #drawSun(): void {
    const g = this.#sun;
    g.clear();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.poly([
        Math.cos(a) * 20, Math.sin(a) * 20,
        Math.cos(a - 0.22) * 11, Math.sin(a - 0.22) * 11,
        Math.cos(a + 0.22) * 11, Math.sin(a + 0.22) * 11,
      ]).fill(0xff7a1a);
    }
    g.circle(0, 0, 12).fill(PALETTE.win);
    g.circle(0, 0, 12).stroke({ width: 2, color: 0xff7a1a });
  }

  #stepY(tier: number): number {
    // Centro vertical del escalón `tier` (1-based).
    return this.#h - 18 - tier * STEP_H + (STEP_H - 6) / 2;
  }

  #highlight(tierIdx: number, color: number): void {
    const g = this.#steps[tierIdx];
    const t = this.#stepLabels[tierIdx];
    if (!g || !t) return;
    g.tint = 0xffffff;
    t.style.fill = color;
  }

  /**
   * Reproduce la escalada. `wait` es la espera interrumpible del orquestador
   * (así el jugador puede saltarse el suspenso), `sfx` son los hooks de sonido.
   */
  async play(
    climb: ClimbDto,
    tiers: readonly TierInfo[],
    wait: (ms: number) => Promise<void>,
    sfx: {
      drum: () => void;
      up: (tier: number) => void;
      stop: () => void;
      top: () => void;
    },
  ): Promise<void> {
    this.#build(tiers);
    this.view.visible = true;

    // Posición inicial: parado en el nivel 1 (garantizado).
    this.#sunY = this.#stepY(1);
    this.#sunTargetY = this.#sunY;
    this.#sun.position.set(this.#w / 2 - this.#tierLabelOffset(0), this.#sunY);
    this.#highlight(0, PALETTE.text);

    await wait(700);

    let tier = 1;
    for (const up of climb.ascents) {
      sfx.drum();
      this.#title.text = '¿SUBE?';
      await wait(750);

      if (up) {
        tier++;
        sfx.up(tier);
        this.#sunTargetY = this.#stepY(tier);
        this.#sun.x = this.#w / 2 - this.#tierLabelOffset(tier - 1);
        this.#highlight(tier - 1, PALETTE.text);
        await wait(450);
      } else {
        sfx.stop();
        this.#shakeT = 300;
        await wait(600);
        break;
      }
    }

    const atTop = tier === tiers.length;
    if (atTop) sfx.top();

    // Revelación del paquete.
    this.#title.text = atTop ? '¡LA CÁMARA DEL SOL!' : 'TU PREMIO';
    this.#title.style.fill = atTop ? PALETTE.scatter : PALETTE.win;
    this.#highlight(tier - 1, atTop ? PALETTE.scatter : PALETTE.win);
    const lbl = this.#stepLabels[tier - 1];
    if (lbl) lbl.scale.set(1.35);
    await wait(atTop ? 1400 : 1000);

    this.view.visible = false;
    this.#title.style.fill = PALETTE.win;
    this.#title.text = 'LA ESCALINATA';
  }

  /** El sol se para a la izquierda del texto del escalón, no encima. */
  #tierLabelOffset(tierIdx: number): number {
    const lbl = this.#stepLabels[tierIdx];
    return (lbl ? lbl.width / 2 : 60) + 34;
  }

  update(dtMs: number): void {
    if (!this.view.visible) return;
    this.#pulseT += dtMs;

    // El sol sube suave hacia su objetivo y late apenas.
    this.#sunY += (this.#sunTargetY - this.#sunY) * Math.min(1, dtMs / 130);
    this.#sun.y = this.#sunY;
    const s = 1 + 0.06 * Math.sin(this.#pulseT / 160);
    this.#sun.scale.set(s);
    this.#sun.rotation += dtMs / 4000;

    // Sacudida corta cuando se planta.
    if (this.#shakeT > 0) {
      this.#shakeT -= dtMs;
      this.view.x = (Math.random() - 0.5) * 6;
    } else {
      this.view.x = 0;
    }
  }
}
