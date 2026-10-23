/**
 * Objetivos de diseño de El Aconcagua: las 20 líneas y la Escalinata de
 * Maverick —acá El Ascenso, de campamento en campamento hasta la cumbre— con
 * volatilidad BAJA: multiplicadores de la función de ×2 a ×4, menos wilds en
 * los giros gratis y una tabla más plana. Es el juego más parejo del salón.
 *
 * Este archivo es la INTENCIÓN, tools/tune.ts mide y resuelve, y la paytable
 * de index.ts es el RESULTADO.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Las tres compras. Precios MEDIDOS con el QA rápido (200.000 compras cada
 * una): EV 33,63× / 48,31× / 99,32× → a estos precios cada compra devuelve
 * el 96,5 %.
 */
export const BONUS_BUY_X = 34.9;
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'El Ascenso', desc: 'La subida decide tu paquete', priceX: 34.9 },
  { id: 'dorada', label: 'Campamento alto', desc: 'Arrancás en el campamento 3 o más arriba', minTier: 3, priceX: 50.1 },
  { id: 'cima', label: 'La Cumbre', desc: 'La cumbre garantizada: 20 giros ×4', minTier: 5, priceX: 102.9 },
] as const;

/**
 * APUESTA ANTE. El juego base tiene 2 banderas por rodillo (bonus 1/209).
 *
 * MEDICIÓN — 12M de rondas, retorno bruto sobre la apuesta base:
 *   [3,2,2,2,3] → 105,1 %, bonus 1/130, precio justo 1,09×
 *   [3,2,3,2,3] → 110,4 %, 1/104, 1,14×   <- elegida: el bonus sale el doble
 *   [3,3,3,3,3] → 126,0 %, 1/68,  1,31×
 */
export const ANTE_COST_X = 1.14;
export const ANTE_SCATTERS: readonly number[] = [3, 2, 3, 2, 3];

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
  [SYM.H1]: [0, 0, 0, 1, 3, 8],
  [SYM.H2]: [0, 0, 0, 1, 3, 7],
  [SYM.H3]: [0, 0, 0, 1, 2.5, 6],
  [SYM.H4]: [0, 0, 0, 1, 2.5, 5],
  [SYM.L1]: [0, 0, 0, 1, 2.5, 5],
  [SYM.L2]: [0, 0, 0, 1, 2, 4.5],
  [SYM.L3]: [0, 0, 0, 1, 2, 4],
  [SYM.L4]: [0, 0, 0, 1, 2, 4],
  [SYM.L5]: [0, 0, 0, 1, 2, 3.5],
};
