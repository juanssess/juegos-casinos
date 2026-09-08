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
 * VARIANTES DE COMPRA.
 *
 * Comprar el bonus no tiene por que ser una sola cosa. Cada variante fuerza
 * un piso distinto en la escalinata: la simple deja que la escalada decida
 * sola, la dorada garantiza al menos el nivel 3, y la cima entrega el 5
 * directo. Mas caro, y con algo concreto atras.
 *
 * Los precios estan MEDIDOS con tools/buyprice.ts (EV / RTP objetivo) y
 * anotados al lado. Si se tocan las tiras, la escalinata o la paytable, hay
 * que re-medirlos: una variante mal cotizada por debajo de su EV seria un
 * agujero por donde se va la casa.
 */
/* MEDICION — 3M de compras por variante, tools/buyprice.ts
 *
 *   variante   EV medido        precio justo   fijado   RTP de la compra
 *   simple      77,336x +-0,120     80,14x       80x         96,67%
 *   dorada     109,792x +-0,143    113,77x      114x         96,31%
 *   cima       281,719x +-0,284    291,94x      292x         96,48%
 *
 * Las tres caen entre 96,31% y 96,67%, o sea alrededor del 96,58% que mide
 * el juego base. Eso es lo que hace que comprar no sea ni mejor ni peor
 * negocio que girar: solo mas rapido.
 *
 * El redondeo se comprueba SIEMPRE despues de elegirlo. Redondear para
 * abajo puede dejar la compra por encima del RTP del base, y ahi la
 * estrategia optima pasa a ser comprar siempre y no girar nunca. */
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Escalinata', desc: 'La escalada decide tu paquete', priceX: 80 },
  { id: 'dorada', label: 'Escalinata dorada', desc: 'Arrancás en el nivel 3 o mejor', minTier: 3, priceX: 114 },
  { id: 'cima', label: 'La Cima', desc: 'El nivel 5 garantizado: 20 giros ×10', minTier: 5, priceX: 292 },
] as const;

/**
 * APUESTA ANTE.
 *
 * `ANTE_COST_X` es cuanto se paga de mas. 1,25x es el estandar de la
 * industria y es el que se siente como "un poco mas", no como otra apuesta.
 *
 * `ANTE_SCATTERS` es cuantos scatters lleva cada tira de ante contra los 2
 * del base. Este numero SE MIDE: se sube hasta que el RTP con ante coincide
 * con el del juego base. Si no coincidiera, cobrar 1,25x seria cobrar de mas
 * por lo mismo — y el 96,66% que dice la pantalla dejaria de ser cierto para
 * el que aprieta ante.
 *
 * Medicion en tools/sim.ts --ante. El resultado esta anotado abajo.
 */
export const ANTE_COST_X = 1.75;
export const ANTE_SCATTERS: readonly number[] = [3, 3, 3, 3, 3];

/* MEDICION DEL ANTE — 60M de rondas por corrida, semilla 20261.
 *
 *   base   96,58% +- 0,234   feature 1 de cada 209
 *   ante   96,90% +- 0,403   feature 1 de cada  69
 *
 * La diferencia (0,32 pp) es menor que el ruido combinado (0,47 pp): son
 * el mismo RTP. El ante triplica la frecuencia de la feature y cobra 1,75x.
 *
 * El camino hasta aca vale anotarlo, porque el numero "obvio" era trampa:
 *   3 scatters en las 5 tiras a 1,25x  ->  RTP 135,8%   (quiebra la casa)
 *   3 scatters en 1,3,5   a 1,25x      ->  RTP 106,2%
 *   3 scatters en 1,5     a 1,25x      ->  RTP  94,5%   (castiga al jugador)
 *   3 scatters en 1-4     a 1,50x      ->  RTP  99,4%
 *   3 scatters en las 5   a 1,75x      ->  RTP  96,9%   <-- este
 *
 * Con conteos enteros de scatter no se llega a 1,25x sin quedar de un lado
 * o del otro. Antes que forzar un precio lindo con un RTP torcido, se
 * ajusto el precio al numero que la medicion pedia. */

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
