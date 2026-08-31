/**
 * classic20 — slot 5x3, 20 líneas fijas, wild + scatter + giros gratis.
 *
 * Es el juego #1 a propósito: aburrido y canónico. Sirve para dejar el
 * pipeline entero funcionando (math → simulador → RGS → cliente) sin que una
 * feature exótica se coma el proyecto. El juego #2 ya puede ser un 6x5 con
 * tumbles y multiplicadores.
 *
 * NOTA SOBRE EL TEMA: acá no hay tema. Los símbolos son H1..H4 (altos) y
 * L1..L5 (bajos). Qué es cada uno (un dios griego, un jaguar, una fruta) se
 * decide en la capa de skin del cliente. Esta es la razón por la que un
 * proveedor puede sacar 15 juegos "distintos" con la misma matemática.
 */

import {
  SYM,
  buildStrips,
  Sfc32Rng,
  type SlotGameDef,
  type SymbolCounts,
} from '@casino/math';
import { PAYLINES } from './paylines.ts';

const REELS = 5;
const ROWS = 3;

/**
 * Tabla de pagos, en múltiplos de la APUESTA POR LÍNEA.
 * Índice = cantidad de símbolos consecutivos desde el rodillo 1.
 *
 * El WILD no tiene fila propia: una línea llena de wilds paga como H1,
 * porque el evaluador prueba todos los símbolos y se queda con el mejor.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0, 0]);
  // Resuelto por tools/tune.ts contra los objetivos de tuning.ts.
  // No editar a mano: si tocás un número acá, el RTP deja de ser el declarado.
  //                    3    4     5
  t[SYM.H1] = [0, 0, 0, 55, 350, 2250];
  t[SYM.H2] = [0, 0, 0, 35, 175, 850];
  t[SYM.H3] = [0, 0, 0, 20, 90, 400];
  t[SYM.H4] = [0, 0, 0, 15, 55, 225];
  t[SYM.L1] = [0, 0, 0, 10, 45, 150];
  t[SYM.L2] = [0, 0, 0, 10, 40, 125];
  t[SYM.L3] = [0, 0, 0, 10, 35, 100];
  t[SYM.L4] = [0, 0, 0, 9, 25, 90];
  t[SYM.L5] = [0, 0, 0, 8, 25, 65];
  return t;
})();

/** Pagos del scatter, en múltiplos de la APUESTA TOTAL. */
const SCATTER_PAYTABLE: readonly number[] = [0, 0, 0, 2, 10, 50];

/**
 * Composición de las tiras del juego base.
 *
 * Dos decisiones clásicas visibles acá:
 *  - No hay WILD en los rodillos 1 y 5. Baja mucho el RTP y hace que el wild
 *    se sienta especial cuando aparece.
 *  - El rodillo 3 tiene más wilds que el 2 y el 4: es el que el ojo mira.
 */
const BASE_COUNTS: readonly SymbolCounts[] = [
  // rodillo 1 — sin wild
  { [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 10, [SYM.L2]: 10, [SYM.L3]: 10, [SYM.L4]: 10, [SYM.L5]: 10, [SYM.SCATTER]: 2 },
  // rodillo 2
  { [SYM.WILD]: 4, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 2 },
  // rodillo 3 — el más generoso en wilds
  { [SYM.WILD]: 5, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 2 },
  // rodillo 4
  { [SYM.WILD]: 4, [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 9, [SYM.L2]: 9, [SYM.L3]: 9, [SYM.L4]: 9, [SYM.L5]: 9, [SYM.SCATTER]: 2 },
  // rodillo 5 — sin wild
  { [SYM.H1]: 4, [SYM.H2]: 5, [SYM.H3]: 6, [SYM.H4]: 7, [SYM.L1]: 10, [SYM.L2]: 10, [SYM.L3]: 10, [SYM.L4]: 10, [SYM.L5]: 10, [SYM.SCATTER]: 2 },
];

/**
 * Tiras de la ronda de giros gratis.
 *
 * Más altos, más wilds y MENOS scatters. Lo último es clave: con las mismas
 * tiras del base, los retriggers se disparan en cadena y el RTP de la feature
 * se va al techo.
 */
const FREE_COUNTS: readonly SymbolCounts[] = [
  { [SYM.H1]: 6, [SYM.H2]: 7, [SYM.H3]: 8, [SYM.H4]: 8, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 2 },
  { [SYM.WILD]: 7, [SYM.H1]: 6, [SYM.H2]: 7, [SYM.H3]: 8, [SYM.H4]: 8, [SYM.L1]: 7, [SYM.L2]: 7, [SYM.L3]: 7, [SYM.L4]: 7, [SYM.L5]: 7, [SYM.SCATTER]: 2 },
  { [SYM.WILD]: 8, [SYM.H1]: 6, [SYM.H2]: 7, [SYM.H3]: 8, [SYM.H4]: 8, [SYM.L1]: 7, [SYM.L2]: 7, [SYM.L3]: 7, [SYM.L4]: 7, [SYM.L5]: 7, [SYM.SCATTER]: 2 },
  { [SYM.WILD]: 7, [SYM.H1]: 6, [SYM.H2]: 7, [SYM.H3]: 8, [SYM.H4]: 8, [SYM.L1]: 7, [SYM.L2]: 7, [SYM.L3]: 7, [SYM.L4]: 7, [SYM.L5]: 7, [SYM.SCATTER]: 2 },
  { [SYM.H1]: 6, [SYM.H2]: 7, [SYM.H3]: 8, [SYM.H4]: 8, [SYM.L1]: 8, [SYM.L2]: 8, [SYM.L3]: 8, [SYM.L4]: 8, [SYM.L5]: 8, [SYM.SCATTER]: 2 },
];

/**
 * Semilla fija para armar las tiras.
 *
 * Las tiras tienen que ser SIEMPRE las mismas: son parte de la definición del
 * juego, no algo que se re-sortea en cada arranque. Con una semilla fija el
 * resultado es reproducible y auditable.
 */
const STRIP_SEED = 0x5eed_c20;

export const GAME: SlotGameDef = {
  id: 'classic20',
  reels: REELS,
  rows: ROWS,
  paylines: PAYLINES,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: buildStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED)),
  freeStrips: buildStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xf1ee)),
  scattersToTrigger: 3,
  // Fallback si no hubiera escalinata; con `climb` presente no se usan.
  freeSpinsAwarded: 12,
  freeSpinsRetrigger: 5,
  freeSpinMultiplier: 5,
  maxFreeSpins: 500,
  /**
   * La Escalinata: al disparar, se sube la pirámide sorteo a sorteo y el
   * nivel alcanzado define el paquete de giros gratis.
   *
   * Diseño: el nivel 1 ya es un premio digno (nadie baja de 8 giros ×4),
   * y la cima es una historia para contar (20 giros ×10, ~1.2% de las
   * escaladas). Las probabilidades decrecen para que cada escalón suba la
   * tensión: 60% → 45% → 30% → 15%.
   */
  climb: {
    tiers: [
      { spins: 8, multiplier: 4 },
      { spins: 10, multiplier: 5 },
      { spins: 12, multiplier: 6 },
      { spins: 15, multiplier: 8 },
      { spins: 20, multiplier: 10 },
    ],
    ascendPerMil: [600, 450, 300, 150],
  },
};

export { PAYLINES, BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
