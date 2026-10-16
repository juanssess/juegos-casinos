/**
 * LOS ORIGINALES — Crash, Mines y Plinko.
 *
 * No son tragamonedas: no hay tiras, ni líneas, ni giros gratis. Son juegos
 * de una decisión (cuándo retirarse, cuántas minas, qué riesgo) donde la
 * matemática es CERRADA: el RTP se calcula exacto, no se estima con una
 * simulación. El QA igual simula, pero para controlar que el motor haga lo
 * que la fórmula dice, no para averiguar cuánto paga.
 *
 * La regla de la casa en los tres es la misma y es fuerte: **el RTP es el
 * mismo para CUALQUIER estrategia**. Retirarse en ×1,5 o en ×500, destapar
 * una casilla o veinte, riesgo bajo o alto: el retorno esperado es `rtp` en
 * todos los casos. Por eso el tope de premio nunca recorta un pago:
 *
 *  - Crash: el multiplicador más alto posible ES el tope, y no se puede
 *    pedir un retiro por encima.
 *  - Mines: si la próxima casilla llevaría el premio por encima del tope, la
 *    ronda se cobra sola antes.
 *  - Plinko: las tablas ya están dentro del tope.
 *
 * Los premios en fichas se redondean con REDONDEO ESTOCÁSTICO (`roundPay`):
 * 20 fichas × 1,03 = 20,6 se paga 21 con probabilidad 0,6 y 20 con 0,4. El
 * valor esperado es exactamente 20,6, y el RTP no pierde nada en las
 * apuestas chicas, que con un redondeo hacia abajo perderían casi un punto.
 */

import type { Rng } from './rng.ts';

/** Paga `x` fichas como entero sin cambiar su valor esperado. */
export function roundPay(x: number, rng: Rng): number {
  if (!(x > 0)) return 0;
  const floor = Math.floor(x + 1e-9);
  const rest = x - floor;
  if (rest < 1e-9) return floor;
  // Un sorteo con resolución de 1/2^30, de sobra para centésimos de ficha.
  return rng.nextInt(1 << 30) < rest * (1 << 30) ? floor + 1 : floor;
}

/* ════════════════════════════════════════════════════════════════════
   CRASH
   ════════════════════════════════════════════════════════════════════
   El multiplicador sube desde ×1,00 hasta el punto de quiebre y ahí se
   corta. El punto sale de un solo sorteo:

       u uniforme en (0, 1]        X = ⌊100 · rtp / u⌋ / 100

   Entonces P(X ≥ m) = P(u ≤ rtp / m) = rtp / m, y quien se retira en m
   cobra m con esa probabilidad: m · rtp / m = rtp. Para TODO m. Los que
   salen por debajo de ×1,01 (un ~4 %) son quiebres inmediatos. */

export interface CrashDef {
  kind: 'crash';
  id: string;
  rtp: number;
  /** El multiplicador más alto posible, y el retiro más alto permitido. */
  maxMult: number;
  /** El retiro más bajo permitido. */
  minCashout: number;
}

/** Resolución del sorteo del punto de quiebre. */
const CRASH_STEPS = 2 ** 30;

/** El punto de quiebre, en centésimos (×2,37). Un solo sorteo. */
export function crashPoint(def: CrashDef, rng: Rng): number {
  const u = (rng.nextInt(CRASH_STEPS) + 1) / CRASH_STEPS;
  const x = Math.floor((100 * def.rtp) / u + 1e-9) / 100;
  return Math.max(1, Math.min(def.maxMult, x));
}

/** Retorno exacto de retirarse siempre en `target` (contando la resolución del sorteo). */
export function crashRtp(def: CrashDef, target: number): number {
  const m = Math.min(target, def.maxMult);
  return (m * Math.floor((CRASH_STEPS * def.rtp) / m)) / CRASH_STEPS;
}

/* ════════════════════════════════════════════════════════════════════
   MINES
   ════════════════════════════════════════════════════════════════════
   Un tablero de 25 casillas con `m` minas, ubicadas al apostar. Cada
   casilla segura destapada sube el multiplicador; una mina se lleva la
   apuesta. Después de `k` casillas seguras:

       P(sobrevivir k) = C(25 − m, k) / C(25, k)
       multiplicador   = rtp / P(sobrevivir k)

   y otra vez el producto da `rtp` para cualquier m y cualquier k. */

export interface MinesDef {
  kind: 'mines';
  id: string;
  rtp: number;
  cells: number;
  minMines: number;
  maxMines: number;
  /** Tope de premio: la ronda se cobra sola antes de pasarlo. */
  maxMult: number;
}

/** Multiplicador exacto tras `k` casillas seguras con `m` minas. */
export function minesMultiplier(def: MinesDef, m: number, k: number): number {
  let p = 1;
  for (let i = 0; i < k; i++) p *= (def.cells - m - i) / (def.cells - i);
  return def.rtp / p;
}

/** Cuántas casillas se pueden destapar antes de que el premio pase el tope. */
export function minesMaxReveals(def: MinesDef, m: number): number {
  let k = 0;
  while (k < def.cells - m && minesMultiplier(def, m, k + 1) <= def.maxMult) k++;
  return k;
}

/** Ubica las minas: Fisher-Yates parcial, `m` sorteos. Devuelve las casillas ordenadas. */
export function placeMines(def: MinesDef, m: number, rng: Rng): number[] {
  const cells = Array.from({ length: def.cells }, (_, i) => i);
  for (let i = 0; i < m; i++) {
    const j = i + rng.nextInt(def.cells - i);
    const t = cells[i]!;
    cells[i] = cells[j]!;
    cells[j] = t;
  }
  return cells.slice(0, m).sort((a, b) => a - b);
}

/* ════════════════════════════════════════════════════════════════════
   PLINKO
   ════════════════════════════════════════════════════════════════════
   La bola cae por `n` filas de clavos y en cada una va a la izquierda o a
   la derecha con la misma probabilidad: n sorteos de una moneda. Termina en
   el casillero k (las veces que fue a la derecha), con probabilidad
   C(n, k) / 2^n, y paga lo que diga la tabla de ese casillero. */

export interface PlinkoDef {
  kind: 'plinko';
  id: string;
  rtp: number;
  rows: readonly number[];
  risks: readonly { id: string; label: string }[];
  /** `tables['16-alto']`: un pago por casillero, de izquierda a derecha. */
  tables: Readonly<Record<string, readonly number[]>>;
}

export const plinkoKey = (rows: number, risk: string): string => `${rows}-${risk}`;

/** El camino de la bola (0 = izquierda, 1 = derecha) y el casillero donde cae. */
export function plinkoDrop(rows: number, rng: Rng): { path: number[]; bucket: number } {
  const path: number[] = [];
  let bucket = 0;
  for (let i = 0; i < rows; i++) {
    const right = rng.nextInt(2);
    path.push(right);
    bucket += right;
  }
  return { path, bucket };
}

/** Probabilidad de cada casillero: la binomial de `rows` monedas. */
export function plinkoOdds(rows: number): number[] {
  const out: number[] = [];
  let c = 1;
  for (let k = 0; k <= rows; k++) {
    out.push(c / 2 ** rows);
    c = (c * (rows - k)) / (k + 1);
  }
  return out;
}

/** Retorno exacto de una tabla. */
export function plinkoRtp(def: PlinkoDef, rows: number, risk: string): number {
  const t = def.tables[plinkoKey(rows, risk)];
  if (!t) throw new Error(`${def.id}: no hay tabla ${plinkoKey(rows, risk)}`);
  return plinkoOdds(rows).reduce((a, p, k) => a + p * (t[k] ?? 0), 0);
}

export type OriginalDef = CrashDef | MinesDef | PlinkoDef;

/**
 * Las configuraciones que el QA controla de cada original, con su retorno
 * exacto: todos los retiros típicos de Crash, todas las combinaciones de
 * minas y casillas, todas las tablas de Plinko. Una sola que se vaya del
 * objetivo frena la publicación.
 */
export interface OriginalConfig {
  label: string;
  exact: number;
  maxX: number;
  /** Lo que juega el jugador en esta configuración. */
  play: { target?: number; mines?: number; reveals?: number; rows?: number; risk?: string };
}

export function originalConfigs(def: OriginalDef): OriginalConfig[] {
  if (def.kind === 'crash') {
    return [1.01, 1.2, 1.5, 2, 3, 5, 10, 25, 100, 1000, def.maxMult].map((t) => ({
      label: `retiro en ×${t}`, exact: crashRtp(def, t), maxX: t, play: { target: t },
    }));
  }
  if (def.kind === 'mines') {
    const out: OriginalConfig[] = [];
    for (let m = def.minMines; m <= def.maxMines; m++) {
      const top = minesMaxReveals(def, m);
      for (let k = 1; k <= top; k++) {
        const mult = minesMultiplier(def, m, k);
        // P(sobrevivir) × multiplicador: es `rtp` por construcción, se controla igual.
        let p = 1;
        for (let i = 0; i < k; i++) p *= (def.cells - m - i) / (def.cells - i);
        out.push({ label: `${m} minas, ${k} casillas`, exact: p * mult, maxX: mult, play: { mines: m, reveals: k } });
      }
    }
    return out;
  }
  return def.rows.flatMap((n) => def.risks.map((r) => ({
    label: `${n} filas, riesgo ${r.label.toLowerCase()}`,
    exact: plinkoRtp(def, n, r.id),
    maxX: Math.max(...(def.tables[plinkoKey(n, r.id)] ?? [0])),
    play: { rows: n, risk: r.id },
  })));
}
