/**
 * Precio de la compra del bonus.
 *
 *   node tools/buyprice.ts --game sebusca --rounds 2000000
 *
 * Simula SOLO rondas con feature garantizada (`playBonus`), que es exactamente
 * lo que recibe el que compra. Medir así en vez de sacar el dato de una
 * simulación normal tiene dos ventajas:
 *
 *  - Precisión: en una corrida normal solo 1 de cada ~250 rondas aporta un
 *    dato útil; acá aportan todas. Mismo tiempo, ~250× más muestras.
 *  - Exactitud conceptual: `playBonus` usa muestreo por rechazo, así que su
 *    distribución ES la condicional al disparo. No hay que asumir nada.
 *
 * El precio justo sale de: precio = EV / RTP_objetivo.
 */

import { pickGame } from './games.ts';
import { Sfc32Rng } from '@casino/math';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const entry = pickGame(process.argv);
const game = entry.game;
const engine = entry.engine();

const rounds = Math.round(Number(arg('rounds', '1e6')));
const seed = Number(arg('seed', '4242'));
/* La apuesta de referencia son las FICHAS del juego: la cantidad de líneas
   en un juego de líneas, y `betDivisor` en uno de racimos, que no tiene. Con
   `paylines.length` a secas, La Vendimia cotizaba con apuesta cero. */
const bet = game.paylines.length || game.betDivisor || 20;
const rng = new Sfc32Rng(seed);

/* Que variante cotizar. Sin --variant se mide la compra simple, que es el
   comportamiento de siempre. */
const variantId = arg('variant', '');
const variante = variantId
  ? (game.bonusVariants ?? []).find((v) => v.id === variantId)
  : undefined;
if (variantId && !variante) {
  console.log(`El juego ${game.id} no tiene la variante "${variantId}".`);
  console.log(`Tiene: ${(game.bonusVariants ?? []).map((v) => v.id).join(', ') || '(ninguna)'}`);
  process.exit(1);
}
if (variante) console.log(`Variante: ${variante.label} — ${variante.desc}`);

console.log(`Simulando ${rounds.toLocaleString('es-AR')} compras de bonus de ${game.id}...`);

let sum = 0;
let sumSq = 0;
let max = 0;
let capped = 0;
const capX = (game as { maxWinX?: number }).maxWinX ?? Infinity;
const t0 = performance.now();

for (let i = 0; i < rounds; i++) {
  const r = engine.playBonus(rng, bet, variante);
  const x = r.totalWin / bet;
  sum += x;
  sumSq += x * x;
  if (x > max) max = x;
  if (x >= capX - 1e-9) capped++;
}

const ev = sum / rounds;
const variance = Math.max(0, sumSq / rounds - ev * ev);
const se = Math.sqrt(variance / rounds);
const ci = 1.96 * se;
const secs = (performance.now() - t0) / 1000;

console.log(`\n  ${secs.toFixed(1)}s  ·  ${Math.round(rounds / secs).toLocaleString('es-AR')} compras/s\n`);
console.log(`EV de la compra ... ${ev.toFixed(3)}x  ± ${ci.toFixed(3)} (95% conf.)`);
console.log(`premio máximo ..... ${max.toFixed(1)}x`);
if (capped > 0) {
  console.log(`tope alcanzado .... ${((capped / rounds) * 100).toFixed(4)}% de las compras`);
}

console.log('\nPrecio según el RTP que quieras darle a la compra:');
for (const target of [0.97, 0.965, 0.96, 0.955, 0.95]) {
  const price = ev / target;
  const rounded = Math.round(price);
  console.log(
    `  RTP ${(target * 100).toFixed(1)}%  →  ${price.toFixed(1)}x` +
      `   (a ${rounded}x el RTP real sería ${((ev / rounded) * 100).toFixed(2)}%)`,
  );
}
