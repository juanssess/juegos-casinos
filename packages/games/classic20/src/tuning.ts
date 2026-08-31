/**
 * Objetivos de diseño de classic20.
 *
 * Este archivo es la "intención": qué queremos que se SIENTA el juego.
 * `tools/tune.ts` lo toma, mide las frecuencias reales de las tiras y resuelve
 * los premios que cumplen estos objetivos. La paytable de index.ts es el
 * resultado, no la fuente de verdad.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo. 96.5% es el estándar de la industria para un slot online. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra del bonus, en múltiplos de la apuesta.
 *
 * NO es un número inventado: el simulador midió E[premio | disparo] = 77.30x
 * sobre 100M de rondas (tools/sim.ts, semilla 31337). A 80x, el RTP de la
 * compra es 77.30/80 = 96.6% — igual al del juego base. Si cambian las
 * tiras, los paquetes de la escalinata o la paytable, HAY que re-medir y
 * re-fijar este número.
 */
export const BONUS_BUY_X = 80;

/**
 * Cuánto del RTP de líneas aporta cada símbolo (pesos relativos, se normalizan).
 *
 * ESTA es la decisión de diseño más importante después de las tiras. Si los
 * bajos aportan tanto como los altos, el juego se siente chato: ganás seguido
 * y poco, y no hay nada que perseguir. Acá los altos se llevan un poco más de
 * la mitad aunque salgan mucho menos, que es lo que crea la jerarquía.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 18,
  [SYM.H2]: 14,
  [SYM.H3]: 11,
  [SYM.H4]: 9,
  [SYM.L1]: 12,
  [SYM.L2]: 11,
  [SYM.L3]: 10,
  [SYM.L4]: 8,
  [SYM.L5]: 7,
};

/**
 * Forma de cada fila: la relación entre pagar 3, 4 y 5 símbolos.
 * Solo importa la proporción — la escala la resuelve el solver.
 *
 * Los altos tienen la cola más larga (1 : 6 : 40 en H1) para que el premio de
 * 5 en línea sea un evento; los bajos son más planos (1 : 3 : 8) porque su
 * trabajo es sostener la frecuencia de premio, no emocionar a nadie.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [0, 0, 0, 1, 6, 40],
  [SYM.H2]: [0, 0, 0, 1, 5, 25],
  [SYM.H3]: [0, 0, 0, 1, 5, 20],
  [SYM.H4]: [0, 0, 0, 1, 4, 16],
  [SYM.L1]: [0, 0, 0, 1, 4, 12],
  [SYM.L2]: [0, 0, 0, 1, 4, 12],
  [SYM.L3]: [0, 0, 0, 1, 3, 10],
  [SYM.L4]: [0, 0, 0, 1, 3, 10],
  [SYM.L5]: [0, 0, 0, 1, 3, 8],
};
