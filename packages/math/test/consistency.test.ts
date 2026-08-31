/**
 * Validación cruzada entre las dos formas de calcular el RTP.
 *
 * `simulate()` suma premios ronda por ronda. `measure()` + `rtpFromFreq()`
 * cuenta combinaciones y después las multiplica por la paytable. Son la MISMA
 * suma reorganizada, así que con el mismo RNG tienen que dar exactamente lo
 * mismo. Si no coinciden, uno de los dos tiene un bug — y como el simulador es
 * el que valida el RTP que declarás públicamente, ese bug importa.
 *
 * Ambos recorridos consumen el RNG igual (5 `nextInt` por giro, en `spin`),
 * así que con la misma semilla ven exactamente las mismas ventanas.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../src/simulate.ts';
import { measure, rtpFromFreq } from '../src/tune.ts';
import { createEvaluator } from '../src/evaluate.ts';
import { createRoundEngine } from '../src/round.ts';
import { Sfc32Rng } from '../src/rng.ts';
import { SYM } from '../src/types.ts';
import { GAME } from '../../games/classic20/src/index.ts';

const ROUNDS = 200_000;
const SEED = 4242;

test('el simulador y el modelo de frecuencias dan el mismo RTP', () => {
  const sim = simulate(GAME, { rounds: ROUNDS, seed: SEED });
  const freq = measure(GAME, { rounds: ROUNDS, seed: SEED });
  const model = rtpFromFreq(GAME, freq);

  const diff = Math.abs(sim.rtpTotal - model.total);
  assert.ok(
    diff < 1e-9,
    `RTP distinto: simulador ${(sim.rtpTotal * 100).toFixed(4)}% vs ` +
      `modelo ${(model.total * 100).toFixed(4)}% (diferencia ${(diff * 100).toFixed(4)} puntos)`,
  );
});

test('las dos rutas ven exactamente las mismas rondas', () => {
  // Si esto falla, la comparación de RTP de arriba no prueba nada.
  const sim = simulate(GAME, { rounds: ROUNDS, seed: SEED });
  const freq = measure(GAME, { rounds: ROUNDS, seed: SEED });
  assert.equal(sim.triggers, freq.triggers, 'distinta cantidad de disparos de feature');
});

test('el wild sustituye y una línea de wilds paga como el símbolo más alto', () => {
  const ev = createEvaluator(GAME);
  const grid = ev.newGrid();
  const lineBet = 1;

  // Línea central (índice 0 de PAYLINES) llena de wilds.
  grid.fill(SYM.L5);
  for (let r = 0; r < GAME.reels; r++) grid[r * GAME.rows + 1] = SYM.WILD;

  const res = ev.evaluate(grid, lineBet, 20, 1);
  const central = res.lineWins.find((w) => w.line === 0);
  assert.ok(central, 'la línea central de wilds tiene que pagar');
  assert.equal(central.symbol, SYM.H1, 'cinco wilds pagan como el símbolo más alto');
  assert.equal(central.count, 5);
  assert.equal(central.amount, GAME.paytable[SYM.H1]![5]);
});

test('el scatter paga esté donde esté, no en línea', () => {
  const ev = createEvaluator(GAME);
  const grid = ev.newGrid();
  grid.fill(SYM.L5);
  // Tres scatters en filas distintas, sin formar ninguna línea.
  grid[0 * GAME.rows + 0] = SYM.SCATTER;
  grid[2 * GAME.rows + 2] = SYM.SCATTER;
  grid[4 * GAME.rows + 1] = SYM.SCATTER;

  const res = ev.evaluate(grid, 1, 20, 1);
  assert.equal(res.scatterCount, 3);
  assert.equal(res.scatterWin, GAME.scatterPaytable[3]! * 20);
});

test('la compra del bonus siempre dispara y respeta la distribución condicional', () => {
  const engine = createRoundEngine(GAME);
  const rng = new Sfc32Rng(777);
  for (let i = 0; i < 200; i++) {
    const r = engine.playBonus(rng, 20);
    assert.ok(r.triggered, 'toda compra tiene que disparar la feature');
    assert.ok(r.climb, 'con escalinata definida, toda feature escala');
    assert.ok(r.climb.tier >= 1 && r.climb.tier <= GAME.climb!.tiers.length);
    const pkg = GAME.climb!.tiers[r.climb.tier - 1]!;
    assert.equal(r.climb.spins, pkg.spins);
    assert.equal(r.climb.multiplier, pkg.multiplier);
    // Todos los giros gratis usan el multiplicador del paquete.
    for (const f of r.free) assert.equal(f.multiplier, pkg.multiplier);
  }
});

test('el RNG criptográfico reparte parejo', () => {
  // Chequeo grueso de que el rechazo de módulo no introduce sesgo.
  const rng = new Sfc32Rng(1);
  const buckets = new Int32Array(7);
  const n = 700_000;
  for (let i = 0; i < n; i++) buckets[rng.nextInt(7)]!++;
  const expected = n / 7;
  for (let i = 0; i < 7; i++) {
    const dev = Math.abs(buckets[i]! - expected) / expected;
    assert.ok(dev < 0.02, `el bucket ${i} se desvía ${(dev * 100).toFixed(2)}%`);
  }
});
