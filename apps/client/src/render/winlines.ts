/**
 * Presentación de los premios.
 *
 * Regla de oro: **nunca mostrar todas las líneas juntas**. Con 20 líneas y
 * cuatro premios simultáneos, mostrarlos a la vez es una ensalada donde el
 * jugador no entiende qué ganó. Se muestran de a una, en ciclo, con las celdas
 * involucradas resaltadas y el resto atenuado.
 */

import { Container, Graphics, Sprite } from 'pixi.js';
import { PALETTE } from './theme.ts';
import type { LineWinDto } from '@casino/protocol';
import type { ReelSet } from './reels.ts';

export interface WinPresenterOptions {
  reels: number;
  rows: number;
  cellSize: number;
  gap: number;
  paylines: readonly (readonly number[])[];
}

export class WinPresenter {
  readonly view = new Container();
  #g = new Graphics();
  #o: WinPresenterOptions;
  #reelSet: ReelSet;
  #wins: LineWinDto[] = [];
  #current = -1;
  #t = 0;
  #pulseT = 0;
  #litCells = new Set<number>();
  #cycleMs: number;
  #active = false;

  constructor(reelSet: ReelSet, opts: WinPresenterOptions, cycleMs: number) {
    this.#reelSet = reelSet;
    this.#o = opts;
    this.#cycleMs = cycleMs;
    this.view.addChild(this.#g);
  }

  /** Muestra todas las celdas premiadas a la vez, brevemente, y después cicla. */
  show(wins: LineWinDto[]): void {
    this.#wins = wins;
    this.#current = -1;
    this.#t = 0;
    this.#active = wins.length > 0;
    if (!this.#active) this.clear();
    else this.#highlightAll();
  }

  clear(): void {
    this.#active = false;
    this.#wins = [];
    this.#litCells.clear();
    this.#g.clear();
    this.#eachCell((s) => {
      s.alpha = 1;
      s.scale.set(this.#o.cellSize / s.texture.width);
    });
    this.#resetSizes();
  }

  #resetSizes(): void {
    const { cellSize } = this.#o;
    this.#eachCell((s) => {
      s.width = cellSize;
      s.height = cellSize;
      s.alpha = 1;
    });
  }

  #eachCell(fn: (s: Sprite, reel: number, row: number) => void): void {
    for (let r = 0; r < this.#o.reels; r++) {
      for (let row = 0; row < this.#o.rows; row++) {
        fn(this.#reelSet.cellSprite(r, row), r, row);
      }
    }
  }

  /** Golpe inicial: todo lo premiado se enciende junto por un instante. */
  #highlightAll(): void {
    const all = new Set<number>();
    for (const w of this.#wins) for (const c of w.cells) all.add(c);
    this.#applyHighlight(all, false);
  }

  #applyHighlight(cells: Set<number>, drawLine: boolean, win?: LineWinDto): void {
    const { rows, cellSize, gap, paylines } = this.#o;
    this.#resetSizes();
    this.#g.clear();
    this.#litCells = cells;

    this.#eachCell((s, r, row) => {
      const idx = r * rows + row;
      if (cells.has(idx)) {
        s.width = cellSize * 1.08;
        s.height = cellSize * 1.08;
        s.alpha = 1;
      } else {
        s.alpha = 0.3;
      }
    });

    // Marco por celda + línea apenas insinuada.
    //
    // Al principio la línea era gruesa y opaca, y cruzaba justo por el medio
    // de los símbolos: al jaguar le tapaba los ojos. El recuadro dice lo mismo
    // ("estas celdas ganaron") sin pisar el dibujo, y la línea queda solo para
    // que se entienda POR DÓNDE pasó el premio.
    for (const idx of cells) {
      const r = Math.floor(idx / rows);
      const row = idx % rows;
      const x = r * (cellSize + gap);
      const y = row * cellSize;
      this.#g
        .roundRect(x + 3, y + 3, cellSize - 6, cellSize - 6, 10)
        .stroke({ width: 3, color: PALETTE.win, alpha: 0.9 });
      this.#g
        .roundRect(x + 6, y + 6, cellSize - 12, cellSize - 12, 8)
        .stroke({ width: 6, color: PALETTE.win, alpha: 0.14 });
    }

    if (drawLine && win) {
      const line = paylines[win.line]!;
      const pts: number[] = [];
      for (let r = 0; r < win.count && r < line.length; r++) {
        pts.push(r * (cellSize + gap) + cellSize / 2, line[r]! * cellSize + cellSize / 2);
      }
      if (pts.length >= 4) {
        this.#g.moveTo(pts[0]!, pts[1]!);
        for (let i = 2; i < pts.length; i += 2) this.#g.lineTo(pts[i]!, pts[i + 1]!);
        this.#g.stroke({ width: 2, color: PALETTE.win, alpha: 0.3, cap: 'round', join: 'round' });
      }
    }
  }

  update(dtMs: number): void {
    if (!this.#active || this.#wins.length === 0) return;
    this.#t += dtMs;
    this.#pulseT += dtMs;

    // Pulso de los símbolos ganadores: laten en vez de quedarse estáticos.
    // Un símbolo quieto con un marco alrededor es un premio muerto; el latido
    // es lo que hace que el ojo vaya solo a lo que ganó.
    const { rows, cellSize } = this.#o;
    const k = 1.08 + 0.05 * Math.sin(this.#pulseT / 105);
    for (const idx of this.#litCells) {
      const s = this.#reelSet.cellSprite(Math.floor(idx / rows), idx % rows);
      s.width = cellSize * k;
      s.height = cellSize * k;
    }

    // El primer tramo es el golpe con todo encendido; después, una por una.
    const first = this.#current < 0;
    if (first && this.#t < this.#cycleMs * 0.8) return;

    if (this.#t >= (first ? this.#cycleMs * 0.8 : this.#cycleMs)) {
      this.#t = 0;
      this.#current = (this.#current + 1) % this.#wins.length;
      const w = this.#wins[this.#current]!;
      this.#applyHighlight(new Set(w.cells), true, w);
    }
  }
}
