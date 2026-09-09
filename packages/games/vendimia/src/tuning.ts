/**
 * Objetivos de diseño de La Vendimia.
 *
 * Igual que en los otros dos: este archivo es la INTENCIÓN, tools/tune.ts
 * mide y resuelve, y la paytable de index.ts es el RESULTADO. Nada de acá
 * se elige mirando otro juego; se elige y después se comprueba.
 */

import { SYM, type SymbolId } from '@casino/math';

/** RTP objetivo, el mismo que los otros dos juegos de la casa. */
export const TARGET_RTP = 0.965;

/**
 * Precio de la compra simple del bonus, en múltiplos de la apuesta.
 * MEDIDO. Ver BONUS_VARIANTS para las tres y por qué llevan decimal.
 */
export const BONUS_BUY_X = 56.6;

/**
 * APUESTA ANTE.
 *
 * MEDICION — 20M de rondas por configuracion, semilla 606060, con el costo
 * fijado en 1x para que el RTP reportado sea el retorno BRUTO. El precio
 * justo sale de bruto / 96,58%, que es el RTP medido del juego base.
 *
 *   barricas por columna     bruto    feature          precio justo
 *   [3,2,2,2,2,2]           95,55%   1 de cada 89         0,989x
 *   [3,2,2,2,2,3]          113,50%   1 de cada 69         1,175x
 *   [3,3,2,2,3,3]          157,54%   1 de cada 43         1,631x  <- elegida
 *   [3,3,3,3,3,3]          225,98%   1 de cada 28         2,340x
 *
 * MIRA LA PRIMERA FILA. Una barrica MAS en UNA sola columna da un precio
 * justo MENOR QUE UNO: la apuesta ante saldria mas barata que el juego
 * normal. No es un error de medicion, es la mecanica. Cada scatter que
 * entra le saca densidad a los simbolos que forman racimos, y la frecuencia
 * de racimo cae como la densidad a la QUINTA: con un solo scatter extra, lo
 * que pierde el juego base es mas que lo que gana la feature. (Se ve en la
 * corrida: el RTP base cae de 52,7% a 25,4% cuando el ante sube fuerte.)
 *
 * Eso no pasa en un juego de lineas —ahi un scatter de mas casi no toca los
 * premios de linea— y es exactamente por lo que este numero se mide en vez
 * de copiarse del juego anterior.
 *
 * A 1,63x el RTP con ante da 96,65%, practicamente el mismo que el base, y
 * la feature entra 2,7 veces mas seguido. Ese es el trato.
 */
export const ANTE_COST_X = 1.63;
export const ANTE_SCATTERS: readonly number[] = [3, 3, 2, 2, 3, 3];

/**
 * Variantes de compra.
 *
 * MEDICION — 1,5M de compras por variante, `node tools/buyprice.ts`:
 *
 *   variante   que te llevas              EV medido          precio    RTP
 *   simple     8 giros                     54,603x +-0,116     56,6x   96,47%
 *   grande     12 giros                   133,728x +-0,199    138,6x   96,48%
 *   reserva    8 giros arrancando en x3    90,365x +-0,154     93,6x   96,54%
 *
 * MIRA LA SEGUNDA FILA. Cuatro giros mas —de 8 a 12, un 50% mas— no valen
 * un 50% mas: valen DOS VECES Y MEDIA. Es la escalera arrastrada. Los cuatro
 * giros extra no se juegan desde x1, se juegan desde donde llego la tanda,
 * que es arriba; el ultimo giro de una tanda de 12 vale varias veces lo que
 * el ultimo de una de 8.
 *
 * Cotizar "un 50% mas de giros, un 50% mas de precio" habria dejado la
 * variante grande en 85x cuando vale 138x. Es el mismo agujero que aparecio
 * en Se Busca con los wilds pegajosos: dos mecanicas distintas, el mismo
 * error posible. Todo lo que se ACUMULA dentro de la feature hace que el
 * precio deje de ser lineal en los giros.
 *
 * LOS PRECIOS LLEVAN UN DECIMAL, y no es capricho. Con un EV de 54,6x un
 * escalon entero de precio mueve el RTP de la compra casi un punto: a 56x da
 * 97,5% —mejor que el juego, o sea que convendria comprar siempre y no girar
 * nunca— y a 57x da 95,8%. No hay entero que sirva. Con un decimal las tres
 * quedan dentro de una decima entre si y apenas por debajo del 96,58% del
 * juego, que es lo que sostiene la promesa del menu de compra: la eleccion
 * es de gusto y de bolsillo, no una trampa.
 */
export const BONUS_VARIANTS = [
  { id: 'simple', label: 'La Cosecha', desc: '8 giros con la escalera arrastrada', priceX: 56.6 },
  { id: 'grande', label: 'Cosecha grande', desc: '12 giros: cuatro más para que la escalera suba', extraSpins: 4, priceX: 138.6 },
  { id: 'reserva', label: 'Reserva', desc: '8 giros que ya arrancan en ×3', minMultiplier: 3, priceX: 93.6 },
] as const;

/**
 * Reparto del RTP de racimos por símbolo.
 *
 * Más parejo que en Se Busca a propósito. En un juego de cascadas la
 * emoción no viene del símbolo caro sino de la CADENA: lo que engancha es
 * que la grilla siga explotando. Si el valor se concentra en H1, la mayoría
 * de las cascadas se sienten vacías y el mecanismo se desperdicia.
 *
 * H4 y L5 no están: no aparecen en ninguna tira de este juego.
 */
export const SHARES: Partial<Record<SymbolId, number>> = {
  [SYM.H1]: 20,
  [SYM.H2]: 18,
  [SYM.H3]: 17,
  [SYM.L1]: 16,
  [SYM.L2]: 15,
  [SYM.L3]: 14,
};

/**
 * Forma de cada fila: la relación entre los cinco tramos (5-6, 7-8, 9-11,
 * 12-14, 15+).
 *
 * MUY empinada, y por una razón medida. La primera versión tenía el tramo
 * 15+ en 50 veces el de 5-6, que es lo que uno pone por instinto; el
 * simulador devolvió volatilidad 10,6 —"media"— y un premio máximo de 873×
 * en cinco millones de rondas. Un juego de cascadas que no llega a mil veces
 * la apuesta no tiene de qué presumir.
 *
 * Con el 15+ en 140 veces el de 5-6, la misma matemática da volatilidad 14,2
 * y premios de 4.500×. No cambió ninguna probabilidad: cambió DÓNDE está
 * guardado el valor. Es la decisión de diseño más grande del juego y se toma
 * acá, en seis filas de números.
 */
export const SHAPE: Partial<Record<SymbolId, readonly number[]>> = {
  [SYM.H1]: [1, 3.2, 10, 34, 140],
  [SYM.H2]: [1, 3.1, 9, 30, 120],
  [SYM.H3]: [1, 3.0, 8.5, 27, 100],
  [SYM.L1]: [1, 2.9, 8, 24, 85],
  [SYM.L2]: [1, 2.8, 7.5, 22, 75],
  [SYM.L3]: [1, 2.7, 7, 20, 68],
};
