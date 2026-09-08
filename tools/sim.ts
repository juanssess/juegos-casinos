/**
 * CLI del simulador.
 *
 *   node tools/sim.ts --rounds 1e8 --seed 42
 *   node tools/sim.ts --game sebusca --rounds 1e8 --strips
 *
 * Node 24 corre TypeScript directo (type stripping), así que no hay build.
 */

import { simulate, formatReport, describeStrips, SYMBOL_NAMES } from '@casino/math';
import { pickGame } from './games.ts';

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return process.argv[i + 1] ?? fallback;
}

const has = (name: string) => process.argv.includes(`--${name}`);

const entry = pickGame(process.argv);
const game = entry.game;

const rounds = Math.round(Number(arg('rounds', '5e6')));
const seed = Number(arg('seed', '20260828'));
const bet = Number(arg('bet', String(game.paylines.length)));

if (has('strips')) {
  console.log('Tiras del juego base:');
  console.log(describeStrips(game.baseStrips, SYMBOL_NAMES));
  console.log('\nTiras de giros gratis:');
  console.log(describeStrips(game.freeStrips, SYMBOL_NAMES));
  console.log('');
}

process.stdout.write(`Simulando ${rounds.toLocaleString('es-AR')} rondas de ${game.id}...\n`);

const ante = has('ante');
if (ante && !game.anteStrips) {
  console.log(`${game.id} no tiene tiras de apuesta ante.`);
  process.exit(1);
}
if (ante) {
  console.log(`Con APUESTA ANTE: costo x${game.anteCostX}, tiras con mas scatters.`);
}

const report = simulate(game, {
  rounds,
  bet,
  seed,
  ante,
  engine: entry.engine(),
  chunk: Math.max(1, Math.floor(rounds / 10)),
  onProgress: (done, total) => {
    process.stdout.write(`  ${Math.round((done / total) * 100)}%\r`);
  },
});

console.log('\n' + formatReport(report));
