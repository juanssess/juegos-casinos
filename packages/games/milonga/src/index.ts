/**
 * NACIDO DE VENDIMIA (npm run new-game). La matemática es la del molde
 * hasta que se cambien las tiras o la tabla y se vuelva a medir con el QA.
 *
 * vendimia — modelo matemático "La Vendimia" (racimos con cascadas).
 *
 * El tercer juego, y el primero que NO paga por líneas.
 *
 *  - Grilla 6×5, sin líneas. Un premio es un RACIMO: cinco o más símbolos
 *    iguales pegados entre sí por arriba, abajo, izquierda o derecha.
 *  - CASCADAS. Lo que gana se va, cae lo de arriba, entra lo nuevo, y se
 *    vuelve a mirar. Una jugada puede encadenar varias.
 *  - El multiplicador SUBE con cada cascada: ×1, ×2, ×3, ×5, ×8, ×12, ×20.
 *  - En los giros gratis la escalera NO vuelve a empezar en cada giro: sigue
 *    donde quedó durante toda la feature. Es lo que le da forma de historia.
 *
 * Por qué "La Vendimia": porque en castellano el nombre de la mecánica y el
 * del tema son la misma palabra. Un racimo de uvas ES un racimo. Los dos
 * primeros juegos tenían un tema puesto encima de una matemática; acá el
 * tema y la matemática son la misma cosa, y eso se nota jugando.
 *
 * El TEMA visible (Mendoza, los Andes, la cosecha) vive en la capa de skin
 * del cliente. Acá los símbolos son H1..L4, como siempre.
 */

import {
  SYM,
  buildClusterStrips,
  Sfc32Rng,
  type ClusterGameDef,
  type SymbolCounts,
} from '@casino/math';
import { ANTE_SCATTERS, ANTE_COST_X, BONUS_VARIANTS } from './tuning.ts';

const REELS = 6;
const ROWS = 5;

/**
 * OCHO símbolos pagadores, no nueve.
 *
 * Un juego de líneas puede tener nueve porque cada línea mira cinco celdas y
 * alcanza con que coincidan tres. Un juego de racimos necesita cinco celdas
 * PEGADAS: cuantos más símbolos distintos hay en la grilla, más se diluye
 * cada uno y menos racimos se forman. Con nueve símbolos repartidos en 30
 * celdas, el juego base no pagaba casi nunca.
 *
 * Por eso L5 no aparece en ninguna tira. Está en la enumeración del motor
 * porque la comparten los tres juegos, pero acá no existe.
 */

/**
 * Tabla de pagos: `paytable[símbolo][tramo]` en múltiplos de la FICHA
 * (la apuesta dividida en 20). Los tramos son los de CLUSTER_TIERS:
 * 5-6, 7-8, 9-11, 12-14, 15+.
 *
 * Resuelta por `node tools/tune.ts --game vendimia --rounds 6e7`. No editar
 * a mano: cualquier retoque suelto mueve el RTP y deja de ser cierto lo que
 * declara el pie del juego.
 */
const PAYTABLE: readonly (readonly number[])[] = (() => {
  const t: number[][] = Array.from({ length: 11 }, () => [0, 0, 0, 0, 0]);
  //           5-6  7-8  9-11 12-14  15+
  t[SYM.H1] = [10, 40, 125, 450, 1800];
  t[SYM.H2] = [7, 25, 65, 225, 900];
  t[SYM.H3] = [6, 20, 50, 175, 600];
  t[SYM.L1] = [4, 15, 35, 125, 375];
  t[SYM.L2] = [4, 10, 30, 80, 275];
  t[SYM.L3] = [3, 7, 25, 55, 175];
  return t;
})();

/**
 * Scatter (la barrica) en múltiplos de la apuesta TOTAL, por cantidad.
 *
 * El array es largo porque la grilla tiene 30 celdas y el motor indexa por
 * conteo; de 9 en adelante ya no paga más, que es lo mismo que decir que
 * nadie va a ver esa fila jamás.
 */
const SCATTER_PAYTABLE: readonly number[] = (() => {
  const t = new Array<number>(REELS * ROWS + 1).fill(0);
  t[4] = 3;
  t[5] = 15;
  t[6] = 60;
  t[7] = 200;
  t[8] = 500;
  return t;
})();

/**
 * Tiras del juego base.
 *
 * LOS CONTEOS VAN CASI PLANOS: de 7 a 12, una relación de 1,7 a 1. En un
 * juego de líneas eso sería una jerarquía inexistente. Acá alcanza y sobra,
 * porque la frecuencia va como la densidad a la quinta: 1,7 a 1 en la tira
 * son casi 15 a 1 en la pantalla. La jerarquía la hace la TABLA DE PAGOS.
 *
 * Y por eso los seis conteos van en escalera de a uno (7, 8, 9, 10, 11, 12)
 * en vez de agruparse en "altos" y "bajos": con dos símbolos del mismo
 * conteo el solver les da el mismo premio, y dos filas idénticas en la tabla
 * de pagos son dos símbolos que no hacía falta dibujar.
 *
 * La primera versión tenía H1 en 3 y L1 en 11 —lo que uno pondría por
 * instinto viniendo de un juego de líneas— y los altos ganaban 1 de cada
 * 3.500 rondas contra 1 de cada 10 de los bajos. El solver contestó con
 * premios de diez mil fichas para H1, que es la forma que tiene un solver
 * de avisar que el problema no está en los premios.
 *
 * Un solo wild por tira, y por la razón inversa: el wild pega racimos que
 * no existirían y puede cobrar en dos a la vez.
 */
/** Discos por columna: menos que La Vendimia, así la función sale menos seguido y pesa más. */
const BASE_SCATTERS: readonly number[] = [2, 1, 2, 2, 1, 2];

const BASE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, (_, i) => ({
  [SYM.WILD]: 1,
  [SYM.SCATTER]: BASE_SCATTERS[i]!,
  [SYM.H1]: 7,
  [SYM.H2]: 8,
  [SYM.H3]: 9,
  [SYM.L1]: 10,
  [SYM.L2]: 11,
  [SYM.L3]: 12,
}));

/**
 * Tiras de los giros gratis.
 *
 * Más wilds y menos altos que en el base. Suena al revés y no lo es: lo que
 * hace grande a la feature acá no son los símbolos caros sino la CANTIDAD
 * de cascadas, porque cada una sube la escalera y la escalera no vuelve
 * atrás. Una tira que cascadea seguido vale mucho más que una que paga
 * fuerte una vez.
 */
const FREE_COUNTS: readonly SymbolCounts[] = Array.from({ length: REELS }, () => ({
  [SYM.WILD]: 2,
  [SYM.SCATTER]: 1,
  [SYM.H1]: 7,
  [SYM.H2]: 8,
  [SYM.H3]: 9,
  [SYM.L1]: 11,
  [SYM.L2]: 12,
  [SYM.L3]: 12,
}));

/**
 * TIRAS DE APUESTA ANTE. Mismo criterio que en los otros dos juegos: el
 * conteo de scatters no se elige, se ajusta MIDIENDO hasta que el RTP con
 * ante coincide con el del base. Ver tuning.ts.
 */
const ANTE_COUNTS: readonly SymbolCounts[] = BASE_COUNTS.map((r, i) => ({
  ...r,
  [SYM.SCATTER]: ANTE_SCATTERS[i]!,
}));

const STRIP_SEED = 0x7ed111a;

export const GAME: ClusterGameDef = {
  id: 'milonga',
  reels: REELS,
  rows: ROWS,
  /* Sin líneas. La apuesta igual se divide en fichas para que los premios
     chicos no sean fracciones de crédito. */
  paylines: [],
  betDivisor: 20,
  paytable: PAYTABLE,
  scatterPaytable: SCATTER_PAYTABLE,
  baseStrips: buildClusterStrips(BASE_COUNTS, new Sfc32Rng(STRIP_SEED)),
  anteStrips: buildClusterStrips(ANTE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xa17e)),
  anteCostX: ANTE_COST_X,
  bonusVariants: BONUS_VARIANTS,
  freeStrips: buildClusterStrips(FREE_COUNTS, new Sfc32Rng(STRIP_SEED ^ 0xdead)),

  /**
   * CUATRO barricas disparan, no tres.
   *
   * Con 30 celdas la ventana es el doble de grande que la de Maverick: tres
   * scatters en 30 celdas es casi tan común como dos en 15. Cuatro deja la
   * feature donde tiene que estar.
   */
  scattersToTrigger: 4,
  freeSpinsAwarded: 8,
  freeSpinsRetrigger: 5,
  /** No se usa: acá el multiplicador es la escalera de cascadas. */
  freeSpinMultiplier: 1,
  maxFreeSpins: 300,

  /**
   * La escalera del multiplicador.
   *
   * Sube con cada cascada de la misma jugada. Los primeros escalones son
   * cortos porque una segunda cascada es común; los últimos saltan fuerte
   * porque una sexta cascada es una historia que se cuenta.
   */
  // La de La Milonga es más empinada que la de La Vendimia: cada cascada
  // casi duplica. Es la diferencia de volatilidad entre los dos juegos.
  cascadeMults: [1, 2, 4, 8, 15, 25, 40, 60, 100],
  freeCarriesLadder: true,

  /** Tope de premio por ronda: 10.000×. Con la escalera hasta ×100 el juego lo alcanza (lo controla el QA). */
  maxWinX: 10_000,
};

export { BASE_COUNTS, FREE_COUNTS, PAYTABLE, SCATTER_PAYTABLE };
