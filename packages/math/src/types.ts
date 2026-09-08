/**
 * Tipos base del motor matemático.
 *
 * Regla de oro de este paquete: NO conoce gráficos, ni tema, ni red.
 * Es una librería de funciones puras + un RNG inyectable. Todo lo que
 * hay acá se puede correr 10^9 veces en un simulador sin tocar un pixel.
 */

/** Un símbolo es un índice numérico (rápido en arrays tipados). */
export type SymbolId = number;

/**
 * Símbolos genéricos. El TEMA no vive acá: "H1" puede ser Zeus, Anubis o
 * una sandía según el skin. La matemática nunca se entera.
 */
export const SYM = {
  WILD: 0,
  SCATTER: 1,
  H1: 2,
  H2: 3,
  H3: 4,
  H4: 5,
  L1: 6,
  L2: 7,
  L3: 8,
  L4: 9,
  L5: 10,
} as const;

export const SYMBOL_COUNT = 11;

export const SYMBOL_NAMES: readonly string[] = [
  'WILD',
  'SCATTER',
  'H1',
  'H2',
  'H3',
  'H4',
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
];

/** Símbolos que pueden formar una línea pagadora (excluye WILD y SCATTER). */
export const PAYING_SYMBOLS: readonly SymbolId[] = [
  SYM.H1,
  SYM.H2,
  SYM.H3,
  SYM.H4,
  SYM.L1,
  SYM.L2,
  SYM.L3,
  SYM.L4,
  SYM.L5,
];

/**
 * Tabla de pagos: `paytable[symbolId][count]` = múltiplo de la apuesta por línea.
 * Los índices 0..2 son siempre 0 (mínimo 3 en línea).
 */
export type Paytable = readonly (readonly number[])[];

/** Una línea de pago: fila elegida en cada rodillo, de izquierda a derecha. */
export type Payline = readonly number[];

/** Tiras de rodillo: un array de símbolos por rodillo. */
export type ReelStrips = readonly (readonly SymbolId[])[];

/** Ventana visible: `grid[reel * rows + row]`. Plana a propósito, por velocidad. */
export type Grid = Int8Array;

/** Un win individual de línea, para poder animarlo después en el cliente. */
export interface LineWin {
  /** Índice de la línea de pago (0-based). */
  line: number;
  /** Símbolo que formó el win. */
  symbol: SymbolId;
  /** Cuántos símbolos consecutivos desde el rodillo 1. */
  count: number;
  /** Producto de multiplicadores de los wilds de la línea (1 si no hay). */
  mult?: number;
  /** Premio en créditos (ya multiplicado por lineBet y el multiplicador activo). */
  amount: number;
}

/** Resultado de evaluar UNA ventana (un giro). */
export interface SpinEval {
  /** Wins de línea, ordenados por premio descendente. */
  lineWins: LineWin[];
  /** Cantidad de scatters en toda la ventana. */
  scatterCount: number;
  /** Premio de scatter en créditos (paga en cualquier posición). */
  scatterWin: number;
  /** Suma de lineWins + scatterWin. */
  totalWin: number;
}

/** Un paquete de giros gratis: cuántos giros y con qué multiplicador. */
export interface ClimbTier {
  spins: number;
  multiplier: number;
}

/**
 * La Escalinata: al disparar la feature, una serie de sorteos decide qué
 * paquete de giros gratis te llevás. Se sube de a un nivel; cada ascenso
 * tiene su probabilidad (en milésimas, para que el sorteo sea entero y
 * auditable: `rng.nextInt(1000) < ascendPerMil[i]`).
 */
export interface ClimbDef {
  tiers: readonly ClimbTier[];
  /** Probabilidad de subir del nivel i al i+1. Largo = tiers.length - 1. */
  ascendPerMil: readonly number[];
}

/** Resultado de la escalada, para que el cliente la reproduzca. */
export interface ClimbResult {
  /** Una decisión por escalón intentado (true = subió). */
  ascents: boolean[];
  /** Nivel final alcanzado, 1-based. */
  tier: number;
  spins: number;
  multiplier: number;
}

/**
 * Una variante de compra de bonus.
 *
 * Comprar el bonus no tiene por qué ser una sola cosa. Un jugador que paga
 * más quiere algo concreto a cambio, y "más caro" sin nada atrás es sólo
 * más caro. Cada variante fuerza una condición distinta sobre la feature.
 *
 * `priceX` NO se elige: se MIDE con tools/buyprice.ts y sale de
 * `EV / RTP_objetivo`, igual que el precio de la compra simple. Si alguna
 * variante quedara por debajo de ese precio sería un agujero: convendría
 * comprar siempre esa y nunca girar.
 */
export interface BonusVariant {
  id: string;
  label: string;
  /** Qué te llevás, dicho para el jugador. */
  desc: string;
  /** Nivel mínimo garantizado de la escalinata (1-based). Sólo con `climb`. */
  minTier?: number;
  /** Giros gratis extra sobre lo que dé la feature. */
  extraSpins?: number;
  /** Multiplicador mínimo garantizado, para juegos sin escalinata. */
  minMultiplier?: number;
  /** Precio en múltiplos de la apuesta. MEDIDO, no elegido. */
  priceX: number;
}

/** Definición completa de un juego de slot de líneas. */
export interface SlotGameDef {
  id: string;
  reels: number;
  rows: number;
  paylines: readonly Payline[];
  paytable: Paytable;
  /** Pagos de scatter, en múltiplos de la APUESTA TOTAL (no de la línea). */
  scatterPaytable: readonly number[];
  /** Tiras del juego base. */
  baseStrips: ReelStrips;
  /** Tiras de la ronda de giros gratis (normalmente distintas). */
  freeStrips: ReelStrips;
  /** Scatters necesarios para disparar la feature. */
  scattersToTrigger: number;
  /** Giros gratis otorgados al disparar (si NO hay escalinata). */
  freeSpinsAwarded: number;
  /** Giros gratis extra por retrigger dentro de la feature. */
  freeSpinsRetrigger: number;
  /** Multiplicador de la feature (si NO hay escalinata). */
  freeSpinMultiplier: number;
  /** Escalinata: si está presente, decide el paquete y pisa los dos campos de arriba. */
  climb?: ClimbDef;
  /** Tope de giros gratis acumulados (evita colas infinitas en la simulación). */
  maxFreeSpins: number;

  /**
   * APUESTA ANTE — pagar más por más chance de bonus.
   *
   * Son tiras de base con MÁS scatters. El jugador paga `anteCostX` veces la
   * apuesta y a cambio la feature dispara más seguido.
   *
   * La regla que lo vuelve honesto y no un truco: si cobrás 1,25× tenés que
   * devolver 1,25× más premio, o el RTP declarado deja de ser cierto para
   * quien juega con ante. Por eso el conteo de scatters de estas tiras no se
   * elige a ojo: se ajusta MIDIENDO hasta que el RTP con ante coincide con
   * el del juego base. Ver el comentario en las tiras de cada juego.
   */
  anteStrips?: ReelStrips;
  /** Cuánto multiplica el costo de la apuesta. */
  anteCostX?: number;

  /** Variantes de compra del bonus. La primera es la simple. */
  bonusVariants?: readonly BonusVariant[];
}
