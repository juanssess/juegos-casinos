/**
 * Multiplicadores pegajosos.
 *
 * Es LA capa visual de Se Busca. Un wild que cae en los giros gratis se
 * queda clavado con su multiplicador hasta el final, y el tablero se va
 * llenando de ×2, ×10, ×25 que se multiplican entre sí. Ver ese tablero
 * poblarse es el juego.
 *
 * Tres cosas que hacen que se lea bien:
 *  - El color del badge sube con el multiplicador (crema → rojo). El jugador
 *    aprende la escala sin leer los números.
 *  - Un wild NUEVO entra con un golpe: escala grande y encoge. Los que ya
 *    estaban no se mueven, así se distingue lo nuevo de lo viejo.
 *  - El total de la pantalla se muestra arriba: es el número que importa
 *    cuando hay cuatro pegajosos.
 */

import { Container, Graphics, Text } from 'pixi.js';
import { multColor } from '@casino/game-sebusca/theme';
import { PALETTE } from './theme.ts';

interface Badge {
  view: Container;
  face: Graphics;
  label: Text;
  mult: number;
  /** Animación de entrada: ms restantes, o 0 si ya está asentado. */
  pop: number;
}

export interface MultLayerOptions {
  reels: number;
  rows: number;
  cellSize: number;
  gap: number;
}

export class MultLayer {
  readonly view = new Container();
  #o: MultLayerOptions;
  #badges = new Map<number, Badge>();

  constructor(opts: MultLayerOptions) {
    this.#o = opts;
  }

  /** Saca todos los badges (fin de la feature). */
  clear(): void {
    for (const b of this.#badges.values()) b.view.destroy({ children: true });
    this.#badges.clear();
    this.view.removeChildren();
  }

  /**
   * Sincroniza los badges con el mapa de multiplicadores del giro.
   * Devuelve los índices de celda que son NUEVOS, para que el orquestador
   * les ponga sonido y sacudida.
   */
  sync(mults: readonly number[] | undefined): number[] {
    if (!mults) return [];
    const fresh: number[] = [];
    for (let i = 0; i < mults.length; i++) {
      const m = mults[i]!;
      if (m <= 1) continue;
      if (this.#badges.has(i)) continue;
      this.#add(i, m);
      fresh.push(i);
    }
    return fresh;
  }

  /** Suma de multiplicadores en pantalla (informativo, no es el pago). */
  get count(): number {
    return this.#badges.size;
  }

  #add(cell: number, mult: number): void {
    const { rows, cellSize, gap } = this.#o;
    const r = Math.floor(cell / rows);
    const row = cell % rows;
    const color = multColor(mult);

    const view = new Container();
    view.x = r * (cellSize + gap) + cellSize / 2;
    view.y = row * cellSize + cellSize / 2;

    // Halo del color del multiplicador sobre toda la celda: el tablero
    // "se prende" a medida que caen pegajosos.
    const halo = new Graphics()
      .roundRect(-cellSize / 2 + 3, -cellSize / 2 + 3, cellSize - 6, cellSize - 6, 9)
      .stroke({ width: 3, color, alpha: 0.95 });
    halo.roundRect(-cellSize / 2 + 3, -cellSize / 2 + 3, cellSize - 6, cellSize - 6, 9)
      .fill({ color, alpha: 0.12 });

    // Chapa del número, abajo a la derecha de la celda.
    const face = new Graphics();
    const bw = mult >= 10 ? 40 : 32;
    const bh = 22;
    const bx = cellSize / 2 - bw - 5;
    const by = cellSize / 2 - bh - 5;
    face
      .roundRect(bx, by, bw, bh, 7)
      .fill({ color: 0x120b06, alpha: 0.92 })
      .roundRect(bx, by, bw, bh, 7)
      .stroke({ width: 2, color });

    const label = new Text({
      text: `×${mult}`,
      style: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: mult >= 10 ? 15 : 16,
        fontWeight: '700',
        fill: color,
      },
    });
    label.anchor.set(0.5);
    label.position.set(bx + bw / 2, by + bh / 2);

    view.addChild(halo, face, label);
    this.view.addChild(view);
    this.#badges.set(cell, { view, face, label, mult, pop: 380 });
  }

  update(dtMs: number): void {
    for (const b of this.#badges.values()) {
      if (b.pop > 0) {
        b.pop = Math.max(0, b.pop - dtMs);
        // Entra grande y se asienta: ease-out sobre el tiempo restante.
        const k = 1 - b.pop / 380;
        const s = 1 + 1.1 * Math.pow(1 - k, 2.2);
        b.view.scale.set(s);
        b.view.alpha = Math.min(1, k * 3);
      } else {
        // Latido tenue, más marcado cuanto más alto el multiplicador.
        const amp = b.mult >= 10 ? 0.035 : 0.018;
        b.view.scale.set(1 + amp * Math.sin(performance.now() / 240 + b.mult));
      }
    }
  }
}

/** Cartel del total de multiplicadores activos, para el encabezado. */
export function createMultTotal(): Text {
  const t = new Text({
    text: '',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fontWeight: '700',
      fill: PALETTE.mult ?? PALETTE.win,
      letterSpacing: 1,
    },
  });
  t.anchor.set(1, 1);
  t.visible = false;
  return t;
}
