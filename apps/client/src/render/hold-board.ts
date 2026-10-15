/**
 * El tablero del HOLD & WIN.
 *
 * Una capa con la misma geometría de celdas que los rodillos, encima de
 * ellos. Tiene dos modos:
 *
 *  - JUEGO BASE: los rodillos giran como siempre; cuando frenan, cada moneda
 *    recibe su valor encima. El jugador tiene que poder contar de un vistazo
 *    cuántas hay y cuánto valen, porque seis arrancan la función.
 *
 *  - FUNCIÓN: la capa tapa los rodillos con quince celdas propias. Las
 *    monedas fijas brillan; las vacías GIRAN cada una por su cuenta, que es
 *    lo que distingue a un Hold & Win de un giro gratis: no gira el rodillo,
 *    gira cada hueco. Al final, el cobro recorre moneda por moneda.
 *
 * Nada acá decide nada: dibuja lo que trae cada paso de la ronda.
 */

import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import type { Jackpots } from '@casino/math';

import { PALETTE } from './theme.ts';
import { reducedMotion } from './motion.ts';

export interface HoldBoardOptions {
  reels: number;
  rows: number;
  cellSize: number;
  gap: number;
  coin: Texture;
  jackpots: Jackpots;
  valueColor: (v: number) => number;
}

interface Cell {
  view: Container;
  panel: Graphics;
  glow: Graphics;
  coin: Sprite;
  ghost: Sprite;
  label: Text;
  /** Valor de la moneda en veces la apuesta; 0 = vacía. */
  value: number;
  /** Animación de llegada: ms restantes. */
  pop: number;
  /** Giro de la celda vacía: ms restantes (0 = quieta). */
  spin: number;
  /** Destello del cobro: ms restantes. */
  flash: number;
}

const POP = 420;
const FLASH = 520;

export class HoldBoard {
  readonly view = new Container();
  #o: HoldBoardOptions;
  #cells: Cell[] = [];
  #feature = false;
  #t = 0;
  /** Re-giros que quedan, para el contador. Lo actualiza quien reproduce la función. */
  left = 0;

  constructor(opts: HoldBoardOptions) {
    this.#o = opts;
    const { reels, rows, cellSize, gap, coin } = opts;
    for (let i = 0; i < reels * rows; i++) {
      const view = new Container();
      view.position.set(Math.floor(i / rows) * (cellSize + gap) + cellSize / 2, (i % rows) * cellSize + cellSize / 2);
      const panel = new Graphics();
      const glow = new Graphics();
      const ghost = new Sprite(coin);
      ghost.anchor.set(0.5);
      ghost.width = ghost.height = cellSize * 0.62;
      ghost.alpha = 0;
      const sprite = new Sprite(coin);
      sprite.anchor.set(0.5);
      sprite.width = sprite.height = cellSize * 0.9;
      const label = new Text({
        text: '',
        style: {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: Math.round(cellSize * 0.2),
          fontWeight: '700',
          fill: 0xfff1c9,
          stroke: { color: 0x1a0f05, width: 5 },
          letterSpacing: 0.5,
        },
      });
      label.anchor.set(0.5);
      label.y = cellSize * 0.04;
      view.addChild(panel, glow, ghost, sprite, label);
      this.view.addChild(view);
      this.#cells.push({ view, panel, glow, coin: sprite, ghost, label, value: 0, pop: 0, spin: 0, flash: 0 });
    }
    this.clear();
  }

  /** Cómo se lee una moneda: los jackpots por su nombre, el resto en créditos. */
  labelOf(value: number, bet: number): string {
    const j = this.#o.jackpots;
    if (value >= j.grand) return 'GRAND';
    if (value === j.major) return 'MAJOR';
    if (value === j.minor) return 'MINOR';
    if (value === j.mini) return 'MINI';
    return (value * bet).toLocaleString('es-AR');
  }

  /** Sin nada: ni valores ni tablero. Los rodillos quedan a la vista. */
  clear(): void {
    this.#feature = false;
    for (const c of this.#cells) {
      c.value = 0;
      c.pop = c.spin = c.flash = 0;
      c.panel.clear();
      c.glow.clear();
      c.coin.visible = false;
      c.ghost.alpha = 0;
      c.label.text = '';
      c.view.scale.set(1);
    }
  }

  /**
   * Juego base: el valor encima de cada moneda que quedó a la vista. La
   * moneda la dibuja el rodillo; acá solo va el número.
   */
  showBaseValues(values: readonly number[], bet: number): void {
    this.clear();
    values.forEach((v, i) => {
      if (v <= 0) return;
      const c = this.#cells[i]!;
      c.label.text = this.labelOf(v, bet);
      c.label.style.fill = this.#o.valueColor(v);
      c.pop = POP * 0.7;
    });
  }

  /** Empieza la función: las monedas del giro que disparó quedan fijas. */
  begin(values: readonly number[], bet: number): void {
    this.clear();
    this.#feature = true;
    values.forEach((v, i) => this.#paint(i, v, bet, false));
  }

  /** Las celdas vacías empiezan a girar, escalonadas. */
  spinEmpty(ms: number): void {
    if (!this.#feature) return;
    let k = 0;
    for (const c of this.#cells) if (c.value <= 0) c.spin = ms + (k++ % 5) * 60;
  }

  /** Caen monedas nuevas: frenan sus celdas con la moneda puesta. */
  land(cells: readonly number[], values: readonly number[], bet: number): void {
    for (const i of cells) this.#paint(i, values[i] ?? 0, bet, true);
    for (const c of this.#cells) c.spin = 0;
  }

  /** El destello del cobro sobre una moneda. Devuelve su valor. */
  flash(cell: number): number {
    const c = this.#cells[cell]!;
    c.flash = FLASH;
    return c.value;
  }

  /** Las celdas con moneda, en el orden en que se cobran (columna por columna). */
  get coins(): number[] {
    return this.#cells.flatMap((c, i) => (c.value > 0 ? [i] : []));
  }

  get full(): boolean {
    return this.#cells.every((c) => c.value > 0);
  }

  #paint(i: number, value: number, bet: number, animate: boolean): void {
    const c = this.#cells[i]!;
    const s = this.#o.cellSize;
    c.value = value;
    c.panel.clear()
      .roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4, 12)
      .fill({ color: value > 0 ? 0x2a1b0c : 0x120c07, alpha: 1 })
      .roundRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4, 12)
      .stroke({ width: 1.5, color: value > 0 ? PALETTE.scatter : PALETTE.frame, alpha: value > 0 ? 0.9 : 0.5 });
    c.glow.clear();
    if (value > 0) {
      const color = this.#o.valueColor(value);
      c.glow.roundRect(-s / 2 + 5, -s / 2 + 5, s - 10, s - 10, 10).fill({ color, alpha: 0.1 });
      c.coin.visible = true;
      c.label.text = this.labelOf(value, bet);
      c.label.style.fill = color;
      c.pop = animate ? POP : 0;
    } else {
      c.coin.visible = false;
      c.label.text = '';
    }
  }

  update(dtMs: number): void {
    this.#t += dtMs;
    const still = reducedMotion();
    for (const c of this.#cells) {
      // Llegada: entra grande y se asienta.
      if (c.pop > 0) {
        c.pop = Math.max(0, c.pop - dtMs);
        const k = 1 - c.pop / POP;
        c.view.scale.set(still ? 1 : 1 + 0.45 * Math.pow(1 - k, 2));
      }
      // Celda vacía girando: una moneda fantasma que pasa de arriba a abajo.
      if (c.spin > 0) {
        c.spin = Math.max(0, c.spin - dtMs);
        const phase = (this.#t / 90) % 1;
        c.ghost.alpha = still ? 0.12 : 0.18 + 0.12 * Math.sin(this.#t / 60);
        c.ghost.y = still ? 0 : (phase - 0.5) * this.#o.cellSize * 0.9;
      } else if (c.ghost.alpha > 0) {
        c.ghost.alpha = 0;
        c.ghost.y = 0;
      }
      // Cobro: la moneda se enciende y late una vez.
      if (c.flash > 0) {
        c.flash = Math.max(0, c.flash - dtMs);
        const k = 1 - c.flash / FLASH;
        c.view.scale.set(still ? 1 : 1 + 0.18 * Math.sin(k * Math.PI));
        c.glow.alpha = 1 + 2.5 * Math.sin(k * Math.PI);
      } else if (this.#feature && c.value > 0 && c.pop === 0) {
        // Latido tenue de las monedas fijas: el tablero está vivo.
        c.view.scale.set(still ? 1 : 1 + 0.015 * Math.sin(this.#t / 260 + c.view.x));
        c.glow.alpha = 1;
      }
    }
  }
}
