/**
 * El tablero de racimos.
 *
 * Es el reemplazo de `ReelSet` para La Vendimia, y tiene la MISMA superficie
 * pública (`spinTo`, `stopNow`, `setGrid`, `cellSprite`, `update`, `running`,
 * `turbo`) más un método propio: `tumbleTo`. Esa coincidencia no es
 * casualidad ni comodidad — es lo que permite que `main.ts` arme la escena,
 * conecte el HUD, el sonido, el autoplay y la recuperación de ronda sin
 * saber cuál de los dos tableros le tocó. La rama en el orquestador queda
 * reducida a dos lugares: qué tablero construir y cómo reproducir un paso.
 *
 * ---------------------------------------------------------------------
 * ACÁ NO HAY RODILLOS
 * ---------------------------------------------------------------------
 * En un slot de líneas los símbolos van montados en una cinta que gira y
 * frena; el "resultado" es dónde para la cinta. Acá los símbolos CAEN, uno
 * por celda, y se quedan quietos. No hay cinta, no hay giro, no hay
 * desenfoque de movimiento. Los treinta sprites son fijos y lo único que se
 * anima es su posición vertical.
 *
 * Eso simplifica el modelo y complica otra cosa: hay que saber, celda por
 * celda, DE DÓNDE viene y ADÓNDE va. Una cascada no es un giro nuevo — es
 * una reorganización de lo que ya estaba, con relleno arriba.
 *
 * ---------------------------------------------------------------------
 * LA CAÍDA ES ESCALONADA POR COLUMNA Y POR FILA
 * ---------------------------------------------------------------------
 * Si las treinta celdas caen juntas, la grilla aparece de golpe y se siente
 * un corte de cámara en vez de una caída. Cada columna arranca un poco
 * después que la anterior (eso es lo que hereda del escalonado de rodillos y
 * es lo que hace posible la EXPECTATIVA), y dentro de la columna la fila de
 * abajo llega primero, porque es la que menos tiene que recorrer.
 */

import { Container, Graphics, Sprite, type Texture } from 'pixi.js';
import { SYM, type SymbolId } from '@casino/math';
import { PALETTE, TIMING } from './theme.ts';
import type { SymbolTextures } from './symbols.ts';

/** Los mismos eventos que emite ReelSet, para que el orquestador no cambie. */
export interface SpinEvents {
  onReelStop?: (reel: number, anticipated: boolean) => void;
  onAnticipation?: (reel: number) => void;
}

export interface ClusterBoardOptions {
  reels: number;
  rows: number;
  cellSize: number;
  gap: number;
  textures: SymbolTextures;
  scattersToTrigger: number;
}

type AnimKind = 'fall' | 'pop';

interface Anim {
  s: Sprite;
  fromY: number;
  toY: number;
  t: number;
  delay: number;
  dur: number;
  kind: AnimKind;
}

export class ClusterBoard {
  readonly view = new Container();
  turbo = false;

  #o: ClusterBoardOptions;
  /** `#cells[columna][fila]`. Se REORDENA en cada cascada. */
  #cells: Sprite[][] = [];
  /**
   * El JUEGO ANTERIOR de sprites, uno por celda.
   *
   * Existe por un error que se ve enseguida y no se deduce leyendo el
   * codigo: si la caida usa los mismos sprites que ya estaban en pantalla,
   * hay que mandarlos arriba para que caigan, y en ese instante la columna
   * queda VACIA. Con seis columnas escalonadas, la ultima se queda en blanco
   * casi un segundo, y el tablero parece que se rompio.
   *
   * Con dos juegos, lo viejo se cae para abajo y se va mientras lo nuevo
   * entra por arriba. Los dos juegos se intercambian de rol en cada caida,
   * asi que no se crea ni un sprite de mas.
   */
  #ghosts: Sprite[][] = [];
  #cols: Container[] = [];
  #glow: Graphics[] = [];
  #anims: Anim[] = [];
  #running = false;
  #resolve: (() => void) | null = null;
  #slam = false;
  /** Columnas que ya avisaron que frenaron, para no repetir el evento. */
  #stopped: boolean[] = [];
  #events: SpinEvents | null = null;
  #antNotified = false;
  #elapsed = 0;
  /** Tiempo en el que cada columna termina de caer, para el aviso de frenada. */
  #colDone: number[] = [];
  #anticipating: boolean[] = [];

  constructor(opts: ClusterBoardOptions) {
    this.#o = opts;
    const { reels, rows, cellSize, gap, textures } = opts;

    for (let r = 0; r < reels; r++) {
      const col = new Container();
      col.x = r * (cellSize + gap);

      // Máscara: durante la caída los símbolos vienen de arriba de la
      // ventana y sin esto se ven flotando sobre el marco.
      const mask = new Graphics().rect(0, 0, cellSize, rows * cellSize).fill(0xffffff);
      col.addChild(mask);
      col.mask = mask;

      col.addChild(
        new Graphics()
          .rect(0, 0, cellSize, rows * cellSize)
          .fill(r % 2 === 0 ? PALETTE.reelBg : PALETTE.reelBgAlt),
      );

      const glow = new Graphics()
        .rect(0, 0, cellSize, rows * cellSize)
        .fill({ color: PALETTE.scatter, alpha: 1 });
      glow.alpha = 0;
      col.addChild(glow);

      const nuevo = (row: number, visible: boolean): Sprite => {
        const s = new Sprite(textures.get(SYM.L3) ?? textures.values().next().value!);
        s.anchor.set(0.5);
        s.width = cellSize;
        s.height = cellSize;
        s.x = cellSize / 2;
        s.y = visible ? row * cellSize + cellSize / 2 : -cellSize * 4;
        col.addChild(s);
        return s;
      };

      const list: Sprite[] = [];
      const fantasmas: Sprite[] = [];
      for (let row = 0; row < rows; row++) fantasmas.push(nuevo(row, false));
      for (let row = 0; row < rows; row++) list.push(nuevo(row, true));

      this.#cells.push(list);
      this.#ghosts.push(fantasmas);
      this.#cols.push(col);
      this.#glow.push(glow);
      this.#stopped.push(true);
      this.#colDone.push(0);
      this.#anticipating.push(false);
      this.view.addChild(col);
    }
  }

  get running(): boolean {
    return this.#running;
  }

  /** El sprite de una celda visible. Lo usa el presentador de premios. */
  cellSprite(reel: number, row: number): Sprite {
    return this.#cells[reel]![row]!;
  }

  /** Factor de tiempos: turbo acorta todo sin tocar ninguna probabilidad. */
  #f(): number {
    return this.turbo ? 0.45 : 1;
  }

  #tex(sym: number): Texture {
    return this.#o.textures.get(sym as SymbolId) ?? this.#cells[0]![0]!.texture;
  }

  #restY(row: number): number {
    return row * this.#o.cellSize + this.#o.cellSize / 2;
  }

  /** Pinta la grilla sin animación (arranque y recuperación de ronda). */
  setGrid(grid: readonly number[]): void {
    const { reels, rows, cellSize } = this.#o;
    this.#anims.length = 0;
    for (let r = 0; r < reels; r++) {
      for (let row = 0; row < rows; row++) {
        const s = this.#cells[r]![row]!;
        s.texture = this.#tex(grid[r * rows + row]!);
        s.y = this.#restY(row);
        s.alpha = 1;
        s.width = cellSize;
        s.height = cellSize;
        // Los del otro juego se estacionan bien arriba, fuera de la mascara.
        this.#ghosts[r]![row]!.y = -cellSize * 4;
      }
    }
  }

  /**
   * La caída inicial de una jugada.
   *
   * La expectativa se conserva igual que en los rodillos: si las columnas ya
   * caídas traen las barricas justas para que la siguiente pueda completar
   * el disparo, esa columna tarda bastante más. No cambia ninguna
   * probabilidad —el resultado ya vino resuelto del servidor— pero es
   * probablemente el detalle que más separa un juego que engancha de uno que
   * solo funciona.
   */
  spinTo(grid: readonly number[], events?: SpinEvents): Promise<void> {
    const { reels, rows, cellSize, scattersToTrigger } = this.#o;
    const f = this.#f();
    this.#anims.length = 0;
    this.#running = true;
    this.#slam = false;
    this.#events = events ?? null;
    this.#antNotified = false;
    this.#elapsed = 0;

    // Barricas en las columnas anteriores a cada una.
    let acc = 0;
    let extra = 0;

    for (let r = 0; r < reels; r++) {
      const antes = acc;
      for (let row = 0; row < rows; row++) {
        if (grid[r * rows + row] === SYM.SCATTER) acc++;
      }

      const faltan = reels - r;
      const anticipa =
        r >= scattersToTrigger - 1 &&
        antes >= scattersToTrigger - 1 &&
        antes + faltan >= scattersToTrigger;
      this.#anticipating[r] = anticipa;
      this.#stopped[r] = false;

      /* LA DEMORA DE LA EXPECTATIVA SE SUMA ANTES, no despues.
         Puesta despues, la columna que puede completar el disparo caia a su
         hora y las demoradas eran las de atras: el juego dudaba en el lugar
         equivocado. La que tiene que hacerse esperar es JUSTAMENTE esa. */
      if (anticipa) extra += TIMING.anticipationExtra * f;
      const colDelay = r * TIMING.reelStagger * f + extra;

      /* LA COLUMNA BAJA ENTERA, como un bloque.
         La primera version tiraba lo viejo para abajo y traia lo nuevo desde
         arriba con 90 ms de diferencia, y entre una cosa y la otra la columna
         se veia VACIA por un cuarto de segundo. Se nota muchisimo.

         Si los dos bloques se mueven juntos —el viejo sale por abajo mientras
         el nuevo entra por arriba, misma velocidad, pegados— la columna nunca
         tiene un hueco: es una sola cinta de diez celdas que baja cinco. Que
         es, ademas, lo que pasaria de verdad. */
      const dur = (TIMING.firstReelStop + 150) * f;
      const salto = rows * cellSize;
      const viejos = this.#cells[r]!;
      const entran = this.#ghosts[r]!;

      for (let row = 0; row < rows; row++) {
        const sale = viejos[row]!;
        sale.width = cellSize;
        sale.height = cellSize;
        sale.alpha = 1;
        const y0 = this.#restY(row);
        this.#anims.push({
          s: sale, fromY: y0, toY: y0 + salto,
          t: 0, delay: colDelay, dur, kind: 'fall',
        });

        const entra = entran[row]!;
        entra.texture = this.#tex(grid[r * rows + row]!);
        entra.alpha = 1;
        entra.width = cellSize;
        entra.height = cellSize;
        entra.y = y0 - salto;
        this.#anims.push({
          s: entra, fromY: y0 - salto, toY: y0,
          t: 0, delay: colDelay, dur, kind: 'fall',
        });
      }

      for (const sp of entran) this.#cols[r]!.addChild(sp);
      this.#cells[r] = entran;
      this.#ghosts[r] = viejos;

      const last = colDelay + dur;
      this.#colDone[r] = last;
    }

    return new Promise<void>((res) => { this.#resolve = res; });
  }

  /**
   * Una cascada: explota lo premiado, cae lo que queda, entra lo nuevo.
   *
   * `remove` son los índices planos que ganaron; `grid` es cómo queda el
   * tablero después. Los dos vienen del servidor: el cliente no decide nada,
   * solo averigua QUÉ SPRITE va a dónde para poder animar el movimiento en
   * vez de reemplazar la grilla de golpe.
   */
  tumbleTo(remove: readonly number[], grid: readonly number[]): Promise<void> {
    const { reels, rows, cellSize } = this.#o;
    const f = this.#f();
    this.#anims.length = 0;
    this.#running = true;
    this.#events = null;

    const fuera = new Set(remove);
    const POP = 135 * f;

    for (let r = 0; r < reels; r++) {
      const viejos = this.#cells[r]!;
      const sobreviven: Sprite[] = [];
      const explotan: Sprite[] = [];

      for (let row = 0; row < rows; row++) {
        if (fuera.has(r * rows + row)) explotan.push(viejos[row]!);
        else sobreviven.push(viejos[row]!);
      }

      if (explotan.length === 0) continue;

      // Los que explotan se apagan y quedan libres para reusarse arriba.
      for (const s of explotan) {
        this.#anims.push({ s, fromY: s.y, toY: s.y, t: 0, delay: 0, dur: POP, kind: 'pop' });
      }

      /* Los sprites que explotaron se RECICLAN como los nuevos de arriba.
         Podrían destruirse y crearse otros, pero treinta sprites nuevos por
         cascada, en una jugada que puede tener seis, son doscientos objetos
         por ronda que el recolector después tiene que juntar justo mientras
         corre la animación. */
      const nuevos = explotan;
      const orden: Sprite[] = [...nuevos, ...sobreviven];

      for (let row = 0; row < rows; row++) {
        const s = orden[row]!;
        const esNuevo = row < nuevos.length;
        s.texture = this.#tex(grid[r * rows + row]!);
        const destino = this.#restY(row);

        /* Todo lo que se mueve en esta columna recorre EXACTAMENTE lo mismo
           —la cantidad de celdas que explotaron— y tarda lo mismo. Es lo que
           mantiene la columna pegada mientras cae: si los nuevos entraran
           desde mas arriba o mas rapido, se abriria un hueco entre ellos y
           los que sobrevivieron. */
        const caida = (165 + explotan.length * 22) * f;

        if (esNuevo) {
          /* OJO: la posicion NO se escribe ahora.
             Este sprite es uno de los que estan explotando, y la explosion
             pasa DONDE ESTABA. Si le movemos la `y` aca, salta arriba antes
             de reventar y el jugador ve desaparecer un simbolo que nunca
             estuvo ahi. La escribe la animacion de caida cuando le toca. */
          const desde = destino - explotan.length * cellSize;
          this.#anims.push({
            s, fromY: desde, toY: destino,
            t: 0, delay: POP, dur: caida, kind: 'fall',
          });
        } else if (Math.abs(s.y - destino) > 0.5) {
          this.#anims.push({
            s, fromY: s.y, toY: destino,
            t: 0, delay: POP, dur: caida, kind: 'fall',
          });
        } else {
          s.y = destino;
          s.width = cellSize;
          s.height = cellSize;
          s.alpha = 1;
        }
      }

      this.#cells[r] = orden;
      // Reordenamos también en la escena para que la profundidad acompañe:
      // los nuevos entran DETRÁS, así se ven aparecer desde el fondo.
      for (const s of orden) this.#cols[r]!.addChild(s);
    }

    if (this.#anims.length === 0) {
      this.#running = false;
      return Promise.resolve();
    }
    return new Promise<void>((res) => { this.#resolve = res; });
  }

  /**
   * Frenada de emergencia. Igual que en los rodillos: el jugador que apura
   * no quiere teatro, y el resultado ya estaba decidido antes de que se
   * moviera nada.
   */
  stopNow(): void {
    if (!this.#running) return;
    this.#slam = true;
    for (const a of this.#anims) {
      a.delay = 0;
      a.dur = Math.min(a.dur, 70);
    }
    for (const g of this.#glow) g.alpha = 0;
  }

  update(dtMs: number): void {
    if (!this.#running) return;
    this.#elapsed += dtMs;
    const { cellSize } = this.#o;
    let vivos = 0;

    for (let i = this.#anims.length - 1; i >= 0; i--) {
      const a = this.#anims[i]!;
      a.t += dtMs;
      const local = a.t - a.delay;
      if (local < 0) {
        vivos++;
        continue;
      }
      const k = Math.min(1, local / a.dur);

      if (a.kind === 'pop') {
        /* La explosión: primero crece un pelo y después se va a cero. Ese
           tironcito de más es lo que la hace leer como "reventó" en vez de
           "desapareció". */
        const p = k < 0.3 ? 1 + k * 0.9 : 1.27 * (1 - (k - 0.3) / 0.7);
        a.s.width = cellSize * Math.max(0, p);
        a.s.height = cellSize * Math.max(0, p);
        a.s.alpha = 1 - k;
      } else {
        // Caída con rebote corto al aterrizar.
        const eased =
          k < 1 ? 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * 0.06 * (1 - k) : 1;
        a.s.y = a.fromY + (a.toY - a.fromY) * eased;
        a.s.alpha = 1;
        /* El tamano se restablece AL EMPEZAR a caer, no al aterrizar.
           Los sprites que entran despues de una cascada son los mismos que
           acaban de explotar, y la explosion los dejo en tamano cero: si el
           tamano se arregla recien al final, el simbolo cae invisible y
           aparece de golpe ya puesto. Se veia como un tablero medio vacio. */
        a.s.width = cellSize;
        a.s.height = cellSize;
        if (k >= 1) a.s.y = a.toY;
      }

      if (k >= 1) this.#anims.splice(i, 1);
      else vivos++;
    }

    // Expectativa y aviso de frenada por columna: el sonido y el cartel de
    // "¡casi!" son los mismos que en los otros dos juegos.
    for (let r = 0; r < this.#cols.length; r++) {
      if (this.#stopped[r]) continue;
      const anticipa = this.#anticipating[r] && !this.#slam;
      if (anticipa) {
        const arranca = this.#colDone[r]! - TIMING.anticipationExtra * this.#f();
        if (this.#elapsed > arranca) {
          this.#glow[r]!.alpha = 0.1 + Math.sin(this.#elapsed / 90) * 0.06;
          if (!this.#antNotified) {
            this.#antNotified = true;
            this.#events?.onAnticipation?.(r);
          }
        }
      }
      if (this.#elapsed >= this.#colDone[r]!) {
        this.#stopped[r] = true;
        this.#glow[r]!.alpha = 0;
        this.#events?.onReelStop?.(r, this.#anticipating[r]!);
      }
    }

    if (vivos === 0) {
      this.#running = false;
      for (let r = 0; r < this.#cols.length; r++) {
        if (this.#stopped[r]) continue;
        this.#stopped[r] = true;
        this.#glow[r]!.alpha = 0;
        this.#events?.onReelStop?.(r, this.#anticipating[r]!);
      }
      const done = this.#resolve;
      this.#resolve = null;
      done?.();
    }
  }
}
