/**
 * Los rodillos.
 *
 * Todo lo de acá es TEATRO. El resultado ya vino resuelto del servidor antes
 * de que el primer rodillo se moviera; esta clase solo elige cómo revelarlo.
 * Vale la pena tenerlo presente porque explica el truco central:
 *
 * ANTICIPACIÓN. Si los rodillos ya frenados traen 2 scatters, el siguiente
 * gira mucho más lento y bastante más tiempo. El jugador siente que el juego
 * duda. No cambia ni una probabilidad — es el mismo resultado revelado con
 * otro ritmo — y es probablemente el detalle que más separa a un slot que
 * engancha de uno que aburre.
 *
 * Modelo de movimiento: cada rodillo tiene una cinta virtual `visual` y una
 * posición fraccional `pos`. Los sprites se reciclan por módulo, así que se
 * dibujan siempre `rows + 2` sprites por rodillo (dos de colchón, arriba y
 * abajo) sin importar cuánto haya girado.
 */

import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { SYM, type SymbolId } from '@casino/math';
import { PALETTE, TIMING } from './theme.ts';
import type { SymbolTextures } from './symbols.ts';

/** Largo de la cinta virtual de cada rodillo. */
const TAPE = 32;

/** Símbolos que se muestran mientras gira (sin scatter: no queremos falsas alarmas). */
const FILLER: SymbolId[] = [SYM.H1, SYM.H2, SYM.H3, SYM.H4, SYM.L1, SYM.L2, SYM.L3, SYM.L4, SYM.L5, SYM.WILD];

type ReelPhase = 'idle' | 'spinning' | 'stopping';

interface Reel {
  index: number;
  container: Container;
  sprites: Sprite[];
  tape: SymbolId[];
  pos: number;
  speed: number;
  phase: ReelPhase;
  /** Momento (ms desde el inicio del giro) en que debe empezar a frenar. */
  stopAt: number;
  /** En expectativa: gira lento y más tiempo. */
  anticipating: boolean;
  /** Ya se avisó al orquestador que este rodillo entró en expectativa. */
  antNotified: boolean;
  glow: Graphics;
  /** Interpolación de la frenada. */
  from: number;
  to: number;
  t: number;
  duration: number;
}

export interface SpinEvents {
  onReelStop?: (reel: number, anticipated: boolean) => void;
  /** Se dispara UNA vez cuando un rodillo entra en modo expectativa. */
  onAnticipation?: (reel: number) => void;
}

export interface ReelSetOptions {
  reels: number;
  rows: number;
  cellSize: number;
  gap: number;
  textures: SymbolTextures;
  scattersToTrigger: number;
}

export class ReelSet {
  readonly view = new Container();
  /**
   * Modo turbo: giros más cortos y rápidos. Es un ajuste de TIEMPOS, no de
   * probabilidades — el resultado ya está decidido igual.
   */
  turbo = false;
  #o: ReelSetOptions;
  #reels: Reel[] = [];
  #elapsed = 0;
  #running = false;
  #resolve: (() => void) | null = null;
  #events: SpinEvents | null = null;
  /** Frenada de emergencia pedida por el jugador (slam stop). */
  #slam = false;
  /** Factor de tiempos del giro actual (turbo = 0.45). */
  #f = 1;
  /** Velocidad crucero del giro actual. */
  #cruise = TIMING.spinSpeed;

  constructor(opts: ReelSetOptions) {
    this.#o = opts;
    const { reels, rows, cellSize, gap } = opts;

    for (let r = 0; r < reels; r++) {
      const container = new Container();
      container.x = r * (cellSize + gap);

      // Máscara: sin esto se ven los símbolos de colchón fuera de la ventana.
      const mask = new Graphics().rect(0, 0, cellSize, rows * cellSize).fill(0xffffff);
      container.addChild(mask);
      container.mask = mask;

      const bg = new Graphics()
        .rect(0, 0, cellSize, rows * cellSize)
        .fill(r % 2 === 0 ? PALETTE.reelBg : PALETTE.reelBgAlt);
      container.addChild(bg);

      const glow = new Graphics()
        .rect(0, 0, cellSize, rows * cellSize)
        .fill({ color: PALETTE.scatter, alpha: 1 });
      glow.alpha = 0;
      container.addChild(glow);

      const tape: SymbolId[] = Array.from(
        { length: TAPE },
        () => FILLER[Math.floor(Math.random() * FILLER.length)]!,
      );

      const sprites: Sprite[] = [];
      for (let j = 0; j < rows + 2; j++) {
        const s = new Sprite(opts.textures.get(SYM.L5)!);
        s.anchor.set(0.5);
        s.width = cellSize;
        s.height = cellSize;
        s.x = cellSize / 2;
        container.addChild(s);
        sprites.push(s);
      }

      this.#reels.push({
        index: r, container, sprites, tape,
        pos: Math.random() * TAPE, speed: 0, phase: 'idle',
        stopAt: 0, anticipating: false, antNotified: false, glow,
        from: 0, to: 0, t: 0, duration: 0,
      });

      this.view.addChild(container);
      this.#layout(this.#reels[r]!);
    }
  }

  /** Sprite de una celda visible, para poder resaltarla al ganar. */
  cellSprite(reel: number, row: number): Sprite {
    return this.#reels[reel]!.sprites[row + 1]!;
  }

  /** Pinta la ventana sin animación (arranque y recuperación de ronda). */
  setGrid(grid: readonly number[]): void {
    const { rows } = this.#o;
    for (const reel of this.#reels) {
      reel.pos = Math.floor(reel.pos);
      for (let row = 0; row < rows; row++) {
        const idx = (Math.floor(reel.pos) + row + 1) % TAPE;
        reel.tape[idx] = grid[reel.index * rows + row] as SymbolId;
      }
      this.#layout(reel);
    }
  }

  /**
   * Gira y frena mostrando `grid`. Resuelve cuando frenó el último rodillo.
   * Los `events` avisan al orquestador cuándo frena cada rodillo y cuándo
   * arranca la expectativa (sonido, banners).
   */
  spinTo(grid: readonly number[], events?: SpinEvents): Promise<void> {
    const { reels, rows, scattersToTrigger } = this.#o;
    this.#elapsed = 0;
    this.#running = true;
    this.#events = events ?? null;
    this.#slam = false;
    this.#f = this.turbo ? 0.45 : 1;
    this.#cruise = TIMING.spinSpeed * (this.turbo ? 1.3 : 1);

    // Cuántos scatters hay en los rodillos anteriores a cada uno.
    const scattersBefore: number[] = [];
    let acc = 0;
    for (let r = 0; r < reels; r++) {
      scattersBefore.push(acc);
      for (let row = 0; row < rows; row++) {
        if (grid[r * rows + row] === SYM.SCATTER) acc++;
      }
    }

    let extra = 0;
    for (let r = 0; r < reels; r++) {
      const reel = this.#reels[r]!;

      // Expectativa: este rodillo puede completar el disparo, y los que faltan
      // después alcanzan para llegar. Ahí es cuando el juego "duda".
      const remaining = reels - r;
      reel.anticipating =
        r >= scattersToTrigger - 1 &&
        scattersBefore[r]! >= scattersToTrigger - 1 &&
        scattersBefore[r]! + remaining >= scattersToTrigger;

      reel.phase = 'spinning';
      reel.antNotified = false;
      reel.speed = this.#cruise;
      reel.stopAt = (TIMING.firstReelStop + r * TIMING.reelStagger) * this.#f + extra;
      if (reel.anticipating) extra += TIMING.anticipationExtra * this.#f;

      // Escribimos el resultado en la cinta, adelante de donde está el rodillo,
      // para que caiga naturalmente cuando frene.
      const target = Math.floor(reel.pos) + 12 + r * 3;
      for (let row = 0; row < rows; row++) {
        reel.tape[(target + row + 1) % TAPE] = grid[r * rows + row] as SymbolId;
      }
      reel.to = target;
    }

    return new Promise<void>((resolve) => {
      this.#resolve = resolve;
    });
  }

  /**
   * Slam stop: frena TODO ya mismo.
   *
   * Es la diferencia entre un juego que responde y uno que te tiene de
   * rehén. Apretar el botón mientras gira salta directo al resultado — que,
   * recordemos, ya estaba decidido antes de que se moviera nada. También
   * cancela la expectativa: el jugador que apura no quiere teatro.
   */
  stopNow(): void {
    if (!this.#running) return;
    this.#slam = true;
    for (const reel of this.#reels) {
      if (reel.phase === 'spinning') {
        reel.stopAt = this.#elapsed;
        reel.anticipating = false;
        reel.glow.alpha = 0;
      } else if (reel.phase === 'stopping') {
        reel.duration = Math.min(reel.duration, reel.t + 80);
      }
    }
  }

  get running(): boolean {
    return this.#running;
  }

  update(dtMs: number): void {
    if (!this.#running) return;
    this.#elapsed += dtMs;
    const cell = this.#o.cellSize;
    let allIdle = true;

    for (const reel of this.#reels) {
      if (reel.phase === 'spinning') {
        allIdle = false;
        // Al entrar en expectativa el rodillo frena a un tercio de velocidad.
        const wantSlow =
          reel.anticipating &&
          this.#elapsed > reel.stopAt - TIMING.anticipationExtra * this.#f;
        if (wantSlow && !reel.antNotified) {
          reel.antNotified = true;
          this.#events?.onAnticipation?.(reel.index);
        }
        const targetSpeed = wantSlow ? TIMING.anticipationSpeed : this.#cruise;
        reel.speed += (targetSpeed - reel.speed) * Math.min(1, dtMs / 120);
        reel.glow.alpha = wantSlow
          ? 0.10 + Math.sin(this.#elapsed / 90) * 0.06
          : Math.max(0, reel.glow.alpha - dtMs / 400);

        reel.pos += (reel.speed * dtMs) / 1000 / cell;

        if (this.#elapsed >= reel.stopAt) {
          // Elegimos la parada más cercana que todavía esté por delante.
          let to = reel.to;
          while (to < reel.pos + 1) to += TAPE;
          reel.from = reel.pos;
          reel.to = to;
          reel.t = 0;
          reel.duration = this.#slam
            ? 80 + (to - reel.pos) * 8
            : (210 + (to - reel.pos) * 26) * Math.max(this.#f, 0.7);
          reel.phase = 'stopping';
        }
      } else if (reel.phase === 'stopping') {
        allIdle = false;
        reel.t += dtMs;
        const k = Math.min(1, reel.t / reel.duration);
        // Ease-out con rebote corto: el rodillo se pasa un poco y vuelve.
        const eased =
          k < 1
            ? 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.055 * (1 - k)
            : 1;
        reel.pos = reel.from + (reel.to - reel.from) * eased;

        if (k >= 1) {
          reel.pos = reel.to % TAPE;
          reel.phase = 'idle';
          reel.glow.alpha = 0;
          this.#events?.onReelStop?.(reel.index, reel.anticipating);
        }
      }
      this.#layout(reel);
    }

    if (allIdle && this.#running) {
      this.#running = false;
      const done = this.#resolve;
      this.#resolve = null;
      done?.();
    }
  }

  /** Coloca los sprites según `pos` y les asigna el símbolo de la cinta. */
  #layout(reel: Reel): void {
    const { rows, cellSize, textures } = this.#o;
    const base = Math.floor(reel.pos);
    const frac = reel.pos - base;

    // Motion blur fingido: mientras el rodillo va rápido, los símbolos se
    // estiran verticalmente y bajan un poco de opacidad. El ojo lo lee como
    // desenfoque de movimiento; es lo que hace que el giro se vea "de slot"
    // en vez de "de PowerPoint". Solo corre durante el giro, así que no pelea
    // con el resaltado de premios (que dimea y agranda estos mismos sprites).
    const spinning = reel.phase === 'spinning';
    const stretch = spinning ? 1 + Math.min(0.32, reel.speed / 13000) : 1;
    const alpha = spinning ? 0.88 : 1;

    for (let j = 0; j < rows + 2; j++) {
      const s = reel.sprites[j]!;
      const sym = reel.tape[(((base + j) % TAPE) + TAPE) % TAPE]!;
      const tex = textures.get(sym);
      if (tex && s.texture !== tex) s.texture = tex as Texture;
      s.y = (j - 1 - frac) * cellSize + cellSize / 2;
      s.height = cellSize * stretch;
      s.alpha = alpha;
    }
  }
}
