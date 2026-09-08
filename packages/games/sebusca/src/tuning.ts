/**
 * Objetivos de diseño de Se Busca.
 *
 * Igual que en classic20: este archivo es la intención, tools/tune.ts mide y
 * resuelve, y la paytable de index.ts es el resultado.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra del bonus, en múltiplos de la apuesta.
 *
 * Medido con `node tools/buyprice.ts --game sebusca --rounds 2e6`:
 * EV de la compra = 145,24× ± 0,77 (95% conf.).
 *
 * A 151× el RTP de la compra es 96,19%, apenas POR DEBAJO del 96,44% del
 * juego. Es a propósito: si la compra pagara mejor que el juego base,
 * comprar sería estrategia dominante y nadie giraría normal. El cuarto de
 * punto es la prima por saltarse la espera.
 *
 * Re-medir y re-fijar si cambian tiras, paytable o tabla de multiplicadores.
 */
export const BONUS_BUY_X = 151;

/**
 * APUESTA ANTE.
 *
 * MEDICION — 80M de rondas por corrida, semilla 4242:
 *
 *   base                    95,82% +- 0,774   feature 1 de cada 259
 *   ante [2,1,1,1,2] 1,75x  99,33% +- 1,214   feature 1 de cada 108
 *
 * A 1,75x los intervalos NO se solapaban: el ante quedaba 3,5 pp arriba.
 * El retorno bruto medido es 173,83%, asi que el precio justo sale de
 * 173,83 / 95,82 = 1,81x. A 1,80x el RTP del ante da 96,57% +- 1,18, que
 * si se solapa con el del base.
 *
 * Se Busca arranca con UN scatter por tira —es el juego de volatilidad muy
 * alta y la feature tiene que costar de encontrar— asi que el salto minimo
 * posible es subir a dos en dos tiras. Eso ya duplica largo la frecuencia
 * (259 -> 108), y por eso el ante sale mas caro que en Maverick: no hay un
 * escalon mas chico disponible con conteos enteros.
 */
export const ANTE_COST_X = 1.8;
export const ANTE_SCATTERS: readonly number[] = [2, 1, 1, 1, 2];

/**
 * Variantes de compra. Se Busca no tiene escalinata: lo que se compra son
 * GIROS. Con wilds pegajosos, cada giro extra vale mas que el anterior
 * —los multiplicadores ya puestos siguen ahi— asi que el precio no crece
 * lineal con los giros. Otra razon para medirlo en vez de calcularlo.
 */
/* MEDICION — 2M de compras por variante, tools/buyprice.ts
 *
 *   variante   giros   EV medido           fijado    RTP     EV por giro
 *   simple       8      145,244x +-0,772     151x    96,19%     18,2x
 *   larga       12      455,430x +-1,561     472x    96,49%     38,0x
 *   completa    16    1.011,086x +-2,471   1.048x    96,48%     63,2x
 *
 * Las tres alrededor del 95,82% que mide el juego base.
 *
 * MIRA LA ULTIMA COLUMNA. El EV por giro se TRIPLICA entre la corta y la
 * larga: el doble de giros no vale el doble, vale siete veces. Son los
 * wilds pegajosos — los multiplicadores que ya estan puestos siguen
 * sumando en cada giro que queda, asi que el ultimo giro de una tanda de
 * 16 juega sobre una grilla mucho mas cargada que el ultimo de una de 8.
 *
 * Es exactamente la razon por la que estos precios se miden y no se
 * calculan. Cotizar "el doble de giros, el doble de precio" habria dejado
 * la variante completa a 302x cuando vale 1.048x: un agujero por donde se
 * iba la casa entera. */
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Cacería', desc: '8 giros con wilds pegajosos', priceX: 151 },
  { id: 'larga', label: 'Cacería larga', desc: '12 giros: más tiempo para que se peguen', extraSpins: 4, priceX: 472 },
  { id: 'completa', label: 'Cacería completa', desc: '16 giros: el doble de tanda', extraSpins: 8, priceX: 1048 },
] as const;

/**
 * Reparto del RTP de líneas por símbolo. MUY top-heavy: en un juego de
 * volatilidad extrema los bajos son relleno y el jugador persigue al
 * forajido (H1).
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 24,
  [SYM.H2]: 15,
  [SYM.H3]: 11,
  [SYM.H4]: 9,
  [SYM.L1]: 10,
  [SYM.L2]: 9,
  [SYM.L3]: 8,
  [SYM.L4]: 7,
  [SYM.L5]: 7,
};

/**
 * Forma de cada fila (relación 3-4-5). Los altos con cola empinada:
 * el 5-en-línea del forajido tiene que ser un evento aun sin multiplicadores.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [0, 0, 0, 1, 7, 50],
  [SYM.H2]: [0, 0, 0, 1, 6, 30],
  [SYM.H3]: [0, 0, 0, 1, 5, 20],
  [SYM.H4]: [0, 0, 0, 1, 4, 15],
  [SYM.L1]: [0, 0, 0, 1, 4, 12],
  [SYM.L2]: [0, 0, 0, 1, 3, 10],
  [SYM.L3]: [0, 0, 0, 1, 3, 10],
  [SYM.L4]: [0, 0, 0, 1, 3, 9],
  [SYM.L5]: [0, 0, 0, 1, 3, 8],
};
