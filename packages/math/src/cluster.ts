/**
 * RACIMOS Y CASCADAS — la tercera mecánica.
 *
 * Los dos primeros juegos pagan por LÍNEAS: se recorre una lista de caminos
 * fijos de izquierda a derecha y se cobra el más largo. Este no. Acá un
 * premio es un RACIMO: un grupo de símbolos iguales pegados entre sí
 * (arriba, abajo, izquierda, derecha), de cinco o más. La forma no importa;
 * importa que estén conectados.
 *
 * Eso cambia tres cosas de raíz y por eso vive en su propio archivo en vez
 * de ser una opción de `evaluate.ts`:
 *
 *  1. NO HAY LÍNEAS. `paylines` queda vacío. El premio se paga en múltiplos
 *     de la apuesta total dividida en `betDivisor` fichas, no por línea.
 *  2. EL PREMIO NO TERMINA LA JUGADA. Los símbolos que ganaron se van, los
 *     de arriba caen, entran nuevos desde la tira, y se vuelve a evaluar.
 *     Una jugada puede encadenar diez cascadas.
 *  3. EL MULTIPLICADOR SUBE CON CADA CASCADA. Es lo que convierte una
 *     racha en un premio grande: la quinta cascada vale mucho más que la
 *     primera.
 *
 * ---------------------------------------------------------------------
 * DE DÓNDE SALEN LOS SÍMBOLOS QUE CAEN
 * ---------------------------------------------------------------------
 * De la misma tira, leída HACIA ARRIBA. Cada columna tiene su tira y su
 * posición de parada; la ventana visible son `rows` símbolos hacia abajo
 * desde la parada, y lo que entra al caer son los símbolos que estaban
 * justo ARRIBA de la parada, uno por uno.
 *
 * La propiedad que esto compra es enorme: **toda la cadena de cascadas
 * queda determinada por las seis posiciones de parada**. No se sortea nada
 * más en toda la jugada. Una ronda entera se reproduce con seis números, y
 * un laboratorio puede recalcularla sin conocer nada del motor. Si en cada
 * cascada se sortearan símbolos nuevos, harían falta cientos de sorteos
 * para reproducir una sola jugada.
 *
 * ---------------------------------------------------------------------
 * EL WILD Y LA REGLA QUE HAY QUE DECIR EN VOZ ALTA
 * ---------------------------------------------------------------------
 * El wild pega racimos: cuenta como cualquier símbolo pagador. Un wild
 * entre dos grupos de uvas los une en uno solo.
 *
 * Y un wild puede pertenecer a DOS racimos a la vez —uno de uvas y uno de
 * copas— y cobrar en los dos. Es la regla estándar del género y es la que
 * hace que un wild valga la pena, pero es también la que rompe la
 * intuición de "cada celda paga una vez". Está escrita en la tabla de
 * pagos del juego, no escondida acá.
 *
 * Un grupo hecho SOLO de wilds no paga: no hay símbolo al que sustituir.
 */

import type { Grid, ReelStrips, SlotGameDef, SpinEval, LineWin, SymbolId } from './types.ts';
import { SYM } from './types.ts';
import type { Rng } from './rng.ts';
import { buildStrip, type SymbolCounts } from './reels.ts';

/** Mínimo de símbolos conectados para que un racimo pague. */
export const MIN_CLUSTER = 5;

/**
 * Escalones de la tabla de pagos, por tamaño de racimo.
 *
 * Un juego de racimos no puede tener un premio por cada tamaño posible: con
 * 30 celdas serían 26 filas por símbolo y la tabla se vuelve ilegible. Se
 * agrupan en tramos, como hace todo el género.
 */
export const CLUSTER_TIERS: readonly (readonly [number, number])[] = [
  [5, 6],
  [7, 8],
  [9, 11],
  [12, 14],
  [15, 999],
];

/** Etiqueta de cada tramo, para la tabla de pagos y los reportes. */
export const TIER_LABELS: readonly string[] = ['5-6', '7-8', '9-11', '12-14', '15+'];

/** Definición de un juego de racimos con cascadas. */
export interface ClusterGameDef extends SlotGameDef {
  /**
   * `paytable[símbolo][tramo]`, en múltiplos de la FICHA (apuesta ÷
   * `betDivisor`). Ojo: acá el segundo índice es el tramo de CLUSTER_TIERS,
   * no la cantidad de símbolos en línea. Es el mismo tipo con otro
   * significado, y por eso este juego trae su propio medidor y su propio
   * validador.
   */
  paytable: readonly (readonly number[])[];
  /**
   * Multiplicador según el número de cascada: `cascadeMults[0]` es la caída
   * inicial, `[1]` la primera cascada, y así. Se aplana en el último valor.
   */
  cascadeMults: readonly number[];
  /**
   * En los giros gratis el multiplicador NO vuelve a empezar en cada giro:
   * la escalera sigue donde quedó durante toda la feature. Es la identidad
   * del bonus — una feature que cascadea mucho termina arriba y se queda.
   */
  freeCarriesLadder: boolean;
  /** Tope de premio por ronda, en múltiplos de la apuesta. */
  maxWinX: number;
}

/** Un racimo ganador. */
export interface Cluster {
  symbol: SymbolId;
  size: number;
  cells: number[];
}

/** Una cascada: la grilla que quedó, lo que pagó y con qué multiplicador. */
export interface TumbleRecord {
  /** Grilla YA caída y rellenada (la que se evalúa en esta cascada). */
  grid: number[];
  /** Racimos que ganaron sobre esa grilla. */
  result: SpinEval;
  multiplier: number;
  win: number;
}

export interface ClusterEvaluator {
  newGrid(): Grid;
  /** Caída inicial: sortea una parada por columna y llena la ventana. */
  drop(strips: ReelStrips, rng: Rng, out: Grid, stops: Int32Array, feed: Int32Array): void;
  /** Racimos de la grilla. Reusa buffers internos: consumir antes de volver a llamar. */
  clusters(grid: Grid): readonly Cluster[];
  countScatters(grid: Grid): number;
  /**
   * Saca las celdas marcadas, deja caer lo que queda y rellena desde arriba
   * con la tira. Modifica `grid` y avanza `feed`.
   */
  tumble(grid: Grid, remove: Uint8Array, strips: ReelStrips, feed: Int32Array): void;
  /** Premio de un racimo, en múltiplos de la ficha. */
  payOf(symbol: SymbolId, size: number): number;
  /** Índice del tramo al que cae un tamaño (−1 si no paga). */
  tierOf(size: number): number;
}

export function createClusterEvaluator(game: ClusterGameDef): ClusterEvaluator {
  const { reels, rows } = game;
  const cells = reels * rows;
  const tiers = CLUSTER_TIERS;

  // Tabla de vecinos precalculada. Recalcular los cuatro vecinos con ifs
  // dentro del BFS es el costo dominante cuando esto corre 10^8 veces.
  const nbCount = new Int8Array(cells);
  const nb = new Int32Array(cells * 4);
  for (let r = 0; r < reels; r++) {
    for (let row = 0; row < rows; row++) {
      const i = r * rows + row;
      let n = 0;
      if (row > 0) nb[i * 4 + n++] = i - 1;
      if (row < rows - 1) nb[i * 4 + n++] = i + 1;
      if (r > 0) nb[i * 4 + n++] = i - rows;
      if (r < reels - 1) nb[i * 4 + n++] = i + rows;
      nbCount[i] = n;
    }
  }

  /** Tamaño → tramo, resuelto una vez. */
  const tierBySize = new Int8Array(cells + 1).fill(-1);
  for (let s = MIN_CLUSTER; s <= cells; s++) {
    for (let t = 0; t < tiers.length; t++) {
      if (s >= tiers[t]![0] && s <= tiers[t]![1]) {
        tierBySize[s] = t;
        break;
      }
    }
  }

  const payFlat = new Float64Array(game.paytable.length * tiers.length);
  for (let s = 0; s < game.paytable.length; s++) {
    const row = game.paytable[s];
    if (!row) continue;
    for (let t = 0; t < tiers.length && t < row.length; t++) payFlat[s * tiers.length + t] = row[t]!;
  }

  // Buffers del BFS.
  const seen = new Int32Array(cells);
  const done = new Uint8Array(cells);
  const queue = new Int32Array(cells);
  let stamp = 0;
  const found: Cluster[] = [];

  function clusters(grid: Grid): readonly Cluster[] {
    found.length = 0;
    done.fill(0);

    for (let i = 0; i < cells; i++) {
      const sym = grid[i]!;
      // Los wilds no son semilla: un grupo de puros wilds no paga, y un wild
      // que acompaña a un símbolo ya se recorre desde ese símbolo.
      if (sym === SYM.WILD || sym === SYM.SCATTER || done[i]) continue;

      stamp++;
      let head = 0;
      let tail = 0;
      queue[tail++] = i;
      seen[i] = stamp;
      const group: number[] = [];

      while (head < tail) {
        const c = queue[head++]!;
        group.push(c);
        // Solo las celdas del símbolo se marcan como consumidas. Los wilds
        // quedan libres para formar parte del racimo de otro símbolo.
        if (grid[c] === sym) done[c] = 1;

        const n = nbCount[c]!;
        for (let k = 0; k < n; k++) {
          const j = nb[c * 4 + k]!;
          if (seen[j] === stamp) continue;
          const g = grid[j]!;
          if (g === sym || g === SYM.WILD) {
            seen[j] = stamp;
            queue[tail++] = j;
          }
        }
      }

      if (group.length >= MIN_CLUSTER) {
        found.push({ symbol: sym, size: group.length, cells: group });
      }
    }
    return found;
  }

  function countScatters(grid: Grid): number {
    let n = 0;
    for (let i = 0; i < cells; i++) if (grid[i] === SYM.SCATTER) n++;
    return n;
  }

  function drop(strips: ReelStrips, rng: Rng, out: Grid, stops: Int32Array, feed: Int32Array): void {
    for (let r = 0; r < reels; r++) {
      const strip = strips[r]!;
      const len = strip.length;
      const stop = rng.nextInt(len);
      stops[r] = stop;
      const base = r * rows;
      for (let row = 0; row < rows; row++) out[base + row] = strip[(stop + row) % len]!;
      // Lo próximo que caiga en esta columna es lo que estaba justo arriba
      // de la parada. Desde acá se camina la tira hacia atrás.
      feed[r] = (stop - 1 + len) % len;
    }
  }

  const column = new Int8Array(rows);

  function tumble(grid: Grid, remove: Uint8Array, strips: ReelStrips, feed: Int32Array): void {
    for (let r = 0; r < reels; r++) {
      const base = r * rows;

      // Compactamos hacia abajo lo que sobrevive.
      let write = rows - 1;
      for (let row = rows - 1; row >= 0; row--) {
        if (!remove[base + row]) column[write--] = grid[base + row]!;
      }

      const nuevos = write + 1;
      if (nuevos === 0) continue;

      // Y llenamos los huecos de arriba. El primero que entra es el que
      // estaba más cerca, y por eso cae MÁS ABAJO de los nuevos.
      const strip = strips[r]!;
      const len = strip.length;
      let f = feed[r]!;
      for (let row = nuevos - 1; row >= 0; row--) {
        column[row] = strip[f]!;
        f = (f - 1 + len) % len;
      }
      feed[r] = f;

      for (let row = 0; row < rows; row++) grid[base + row] = column[row]!;
    }
  }

  function tierOf(size: number): number {
    return size <= cells ? tierBySize[size]! : tiers.length - 1;
  }

  function payOf(symbol: SymbolId, size: number): number {
    const t = tierOf(size);
    return t < 0 ? 0 : payFlat[symbol * tiers.length + t]!;
  }

  return {
    newGrid: () => new Int8Array(cells),
    drop,
    clusters,
    countScatters,
    tumble,
    payOf,
    tierOf,
  };
}

/** Convierte racimos a la forma que ya entiende el resto del sistema. */
export function clustersToEval(
  ev: ClusterEvaluator,
  list: readonly Cluster[],
  coin: number,
  multiplier: number,
  scatterCount: number,
  scatterWin: number,
): SpinEval {
  const lineWins: LineWin[] = list.map((c) => ({
    // `line` no significa nada en un juego de racimos: se manda −1 para que
    // el cliente no intente dibujar el camino de una línea que no existe.
    line: -1,
    symbol: c.symbol,
    count: c.size,
    mult: multiplier,
    amount: ev.payOf(c.symbol, c.size) * coin * multiplier,
    cells: c.cells.slice(),
  }));
  lineWins.sort((a, b) => b.amount - a.amount);
  let totalWin = scatterWin;
  for (const w of lineWins) totalWin += w.amount;
  return { lineWins, scatterCount, scatterWin, totalWin };
}

/* ============================================================
   TIRAS PARA RACIMOS

   Las tiras de un juego de líneas no sirven acá, y la razón es
   contundente: en un juego de líneas la frecuencia de un símbolo crece
   más o menos LINEAL con cuántas veces está en la tira. En uno de
   racimos crece como la densidad a la QUINTA, porque hacen falta cinco
   celdas pegadas.

   La primera medición de La Vendimia lo mostró sin lugar a dudas: con
   H1 en 3 por tira y L1 en 11 —una relación de 3,7 a 1, que en un juego
   de líneas da una jerarquía linda— los altos ganaban 1 de cada 3.500
   rondas y los bajos 1 de cada 10. Una relación de 350 a 1. El solver
   respondió lo único que podía: premios de diez mil fichas para el
   símbolo alto, que es la forma que tiene un solver de gritar que las
   tiras están mal.

   De ahí salen las dos reglas de este constructor:

   1. LOS CONTEOS VAN CASI PLANOS. La jerarquía la hace la tabla de
      pagos, no la rareza. Una relación de 1,4 a 1 en la tira ya da 5 a
      1 en frecuencia.

   2. SE PLANTAN CORRIDAS. Dos símbolos iguales seguidos en la tira son
      dos celdas pegadas verticalmente en la columna, garantizado. Ese
      par es la semilla de casi todos los racimos: cinco sueltos casi
      nunca caen conectados, pero par + par + suelto en tres columnas
      vecinas sí. Un constructor que solo mezcla al azar deja la
      adyacencia librada a la suerte, y ahí el orden de la tira pesa más
      que la composición (se vio: dos símbolos con el MISMO conteo
      ganaban el doble uno que el otro).
   ============================================================ */

export interface ClusterStripOptions {
  /** Probabilidad (en %) de que una aparición arranque una corrida. */
  runPerCent?: number;
  /** Dentro de una corrida, probabilidad (en %) de que sea de tres y no de dos. */
  triplePerCent?: number;
}

function shuffleBlocks<T>(arr: T[], rng: Rng): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const t = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = t;
  }
}

/**
 * Arma una tira pensada para formar racimos.
 *
 * El scatter y el wild se reparten espaciados igual que siempre (los pega
 * `buildStrip`, cuya lógica de espaciado se reusa armando una tira auxiliar).
 * El resto se agrupa en bloques de 1, 2 o 3 y se mezclan los BLOQUES.
 */
export function buildClusterStrip(
  counts: SymbolCounts,
  rng: Rng,
  opts: ClusterStripOptions = {},
): SymbolId[] {
  const runPerCent = opts.runPerCent ?? 38;
  const triplePerCent = opts.triplePerCent ?? 22;

  // Posiciones de los espaciados: se saca de una tira normal, que ya sabe
  // repartirlos sin que queden pegados.
  const scaffold = buildStrip(counts, rng);
  const length = scaffold.length;
  const strip: SymbolId[] = new Array(length).fill(-1);
  for (let i = 0; i < length; i++) {
    if (scaffold[i] === SYM.SCATTER || scaffold[i] === SYM.WILD) strip[i] = scaffold[i]!;
  }

  // Bloques del resto.
  const blocks: { sym: SymbolId; size: number }[] = [];
  for (const [key, n] of Object.entries(counts)) {
    const sym = Number(key);
    if (sym === SYM.SCATTER || sym === SYM.WILD) continue;
    let left = n ?? 0;
    while (left > 0) {
      let size = 1;
      if (left >= 2 && rng.nextInt(100) < runPerCent) {
        size = left >= 3 && rng.nextInt(100) < triplePerCent ? 3 : 2;
      }
      blocks.push({ sym, size });
      left -= size;
    }
  }
  shuffleBlocks(blocks, rng);

  // Colocación. Si el bloque que toca es del mismo símbolo que lo último
  // escrito, se pospone: dos bloques iguales seguidos harían una corrida de
  // cuatro o cinco, que en la columna es un racimo regalado.
  let cursor = 0;
  const pending = blocks.slice();
  let last: SymbolId = -1;
  while (pending.length > 0) {
    while (cursor < length && strip[cursor] !== -1) {
      last = strip[cursor]!;
      cursor++;
    }
    if (cursor >= length) break;

    let pick = 0;
    while (pick < pending.length && pending[pick]!.sym === last) pick++;
    if (pick === pending.length) pick = 0; // no quedó otra: se acepta la corrida
    const b = pending.splice(pick, 1)[0]!;

    for (let k = 0; k < b.size && cursor < length; k++) {
      while (cursor < length && strip[cursor] !== -1) cursor++;
      if (cursor >= length) break;
      strip[cursor] = b.sym;
      last = b.sym;
      cursor++;
    }
  }

  // Por si quedó algún hueco (bloques más largos que el espacio libre final).
  for (let i = 0; i < length; i++) if (strip[i] === -1) strip[i] = scaffold[i]!;

  return strip;
}

/** Las tiras de todas las columnas de un juego de racimos. */
export function buildClusterStrips(
  perReel: readonly SymbolCounts[],
  rng: Rng,
  opts: ClusterStripOptions = {},
): ReelStrips {
  return perReel.map((counts) => buildClusterStrip(counts, rng, opts));
}
