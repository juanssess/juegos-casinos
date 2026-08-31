/**
 * Ajuste de la paytable para alcanzar el RTP objetivo con el reparto deseado.
 *
 *   node tools/tune.ts --rounds 5e6
 *   node tools/tune.ts --game sebusca --rounds 2e7
 *
 * Mide frecuencias una sola vez (caro) y después resuelve los premios con
 * álgebra (gratis). Imprime la paytable lista para pegar en el juego.
 */

import {
  rtpFromFreq,
  solveByTargets,
  validatePaytable,
  formatBreakdown,
  SYMBOL_NAMES,
  PAYING_SYMBOLS,
} from '@casino/math';
import { pickGame } from './games.ts';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (process.argv[i + 1] ?? fallback);
}

const entry = pickGame(process.argv);
const game = entry.game;

const rounds = Math.round(Number(arg('rounds', '2e6')));
const target = Number(arg('target', String(entry.targetRtp)));
const seed = Number(arg('seed', '777'));

console.log(`Midiendo frecuencias de ${game.id} con ${rounds.toLocaleString('es-AR')} rondas...\n`);
const freq = entry.measure({ rounds, seed });
console.log(formatBreakdown(game, freq, rtpFromFreq(game, freq)));
console.log(`\n  (medición en ${(freq.elapsedMs / 1000).toFixed(1)}s)\n`);
console.log('─'.repeat(66));

const solved = solveByTargets(game, freq, {
  targetRtp: target,
  shares: entry.shares,
  shape: entry.shape,
});
const after = solved.rtp;

console.log(`\nObjetivo ${(target * 100).toFixed(2)}%  →  resuelto ${(after.total * 100).toFixed(3)}%  ` +
  `(error ${(solved.error * 100).toFixed(3)} puntos)\n`);

console.log('Paytable resuelta (múltiplos de la apuesta por línea)');
console.log('  símbolo        3        4        5      aporta');
for (const sym of PAYING_SYMBOLS) {
  const row = solved.paytable[sym]!;
  const c = after.bySymbol.find((s) => s.symbol === sym)!;
  console.log(
    `  ${SYMBOL_NAMES[sym]!.padEnd(9)} ${String(row[3]).padStart(8)} ` +
      `${String(row[4]).padStart(8)} ${String(row[5]).padStart(8)}` +
      `     ${(c.total * 100).toFixed(2)}%`,
  );
}
console.log(`  ${'SCATTER'.padEnd(9)} ${'—'.padStart(8)} ${'—'.padStart(8)} ${'—'.padStart(8)}     ${(after.scatter * 100).toFixed(2)}%`);

console.log(
  `\n  base ${((after.base + after.scatter) * 100).toFixed(2)}%  ·  ` +
    `feature ${(after.feature * 100).toFixed(2)}%  ·  ` +
    `la feature aporta el ${((after.feature / after.total) * 100).toFixed(1)}% del RTP`,
);

const problems = validatePaytable(game, solved.paytable);
if (problems.length === 0) {
  console.log('\n✓ La tabla es monótona: se lee bien de arriba a abajo.');
} else {
  console.log('\n⚠ Problemas de legibilidad en la tabla:');
  for (const p of problems) console.log(`   · ${p}`);
  console.log('   Se arregla en las TIRAS o en los pesos, nunca tocando el premio a mano.');
}

console.log(`\nPara pegar en packages/games/${game.id === 'classic20' ? 'classic20' : game.id}/src/index.ts:`);
for (const sym of PAYING_SYMBOLS) {
  const r = solved.paytable[sym]!;
  console.log(`  t[SYM.${SYMBOL_NAMES[sym]}] = [0, 0, 0, ${r[3]}, ${r[4]}, ${r[5]}];`);
}
