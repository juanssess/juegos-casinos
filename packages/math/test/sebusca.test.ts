/**
 * Validación cruzada de Se Busca.
 *
 * Acá hay tres implementaciones de la misma matemática que TIENEN que
 * coincidir: `playFast` (simulador), `play` (juego real) y `measureSebusca`
 * (tuner). Coinciden solo si consumen el RNG exactamente en el mismo orden:
 * giro base → sorteo de multiplicador por cada wild nuevo, en orden de celda.
 *
 * Ese contrato es fácil de romper sin darse cuenta (basta reordenar un bucle)
 * y el síntoma sería un RTP declarado que no es el que entrega el juego.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../src/simulate.ts';
import { rtpFromFreq } from '../src/tune.ts';
import { Sfc32Rng } from '../src/rng.ts';
import { SYM } from '../src/types.ts';
import { createEvaluator } from '../src/evaluate.ts';
import { GAME, type SebuscaDef } from '../../games/sebusca/src/index.ts';
import { createSebuscaEngine } from '../../games/sebusca/src/engine.ts';
import { measureSebusca } from '../../games/sebusca/src/measure.ts';

const ROUNDS = 150_000;
const SEED = 909;

/**
 * Copia del juego sin tope de premio.
 *
 * `measureSebusca` mide el juego SIN tope (el tope depende de la paytable,
 * que es justo lo que el tuner está por resolver), así que la comparación
 * con el simulador solo es exacta si al simulador también se le saca. Con el
 * tope puesto la diferencia es real y esperada: es cuánto recorta el tope.
 */
const UNCAPPED: SebuscaDef = { ...GAME, maxWinX: Number.POSITIVE_INFINITY };

test('sin tope, el simulador y el modelo de frecuencias dan el mismo RTP', () => {
  const sim = simulate(UNCAPPED, {
    rounds: ROUNDS,
    seed: SEED,
    engine: createSebuscaEngine(UNCAPPED),
  });
  const freq = measureSebusca(UNCAPPED, { rounds: ROUNDS, seed: SEED });
  const model = rtpFromFreq(UNCAPPED, freq);

  const diff = Math.abs(sim.rtpTotal - model.total);
  assert.ok(
    diff < 1e-9,
    `RTP distinto: simulador ${(sim.rtpTotal * 100).toFixed(4)}% vs ` +
      `modelo ${(model.total * 100).toFixed(4)}% (diferencia ${(diff * 100).toFixed(4)} puntos). ` +
      'Casi siempre significa que alguien cambió el orden de sorteos en un lado y no en el otro.',
  );
});

test('el tope recorta RTP, y poco', () => {
  const capped = simulate(GAME, {
    rounds: ROUNDS,
    seed: SEED,
    engine: createSebuscaEngine(GAME),
  });
  const uncapped = simulate(UNCAPPED, {
    rounds: ROUNDS,
    seed: SEED,
    engine: createSebuscaEngine(UNCAPPED),
  });
  assert.ok(
    capped.rtpTotal <= uncapped.rtpTotal + 1e-12,
    'el tope no puede AUMENTAR el RTP',
  );
  assert.ok(
    capped.maxWinX <= GAME.maxWinX + 1e-9,
    `el tope no se respeta: premio máximo ${capped.maxWinX}x con tope ${GAME.maxWinX}x`,
  );
});

test('play y playFast dan el mismo total con la misma semilla', () => {
  const engineA = createSebuscaEngine(GAME);
  const engineB = createSebuscaEngine(GAME);
  const rngA = new Sfc32Rng(31337);
  const rngB = new Sfc32Rng(31337);
  const out = {
    baseWin: 0, featureWin: 0, totalWin: 0,
    triggered: false, freeSpinsPlayed: 0, tier: 0,
  };

  for (let i = 0; i < 3000; i++) {
    const full = engineA.play(rngA, 15);
    engineB.playFast(rngB, 15, out);
    assert.equal(
      full.totalWin, out.totalWin,
      `ronda ${i}: play dio ${full.totalWin} y playFast ${out.totalWin}`,
    );
    assert.equal(full.triggered, out.triggered, `ronda ${i}: distinto disparo`);
  }
});

test('los wilds quedan pegados y sus multiplicadores se componen', () => {
  const engine = createSebuscaEngine(GAME);
  const rng = new Sfc32Rng(2024);

  // Buscamos una feature con al menos dos giros para poder comparar.
  for (let attempt = 0; attempt < 50; attempt++) {
    const r = engine.playBonus(rng, 15);
    if (r.free.length < 2) continue;

    // Una celda con wild en el giro k tiene que seguir siendo wild —con el
    // MISMO multiplicador— en todos los giros posteriores.
    const seen = new Map<number, number>();
    for (const spin of r.free) {
      assert.ok(spin.mults, 'un giro gratis tiene que traer su mapa de multiplicadores');
      for (const [cell, mult] of seen) {
        assert.equal(
          spin.grid[cell], SYM.WILD,
          `la celda ${cell} era pegajosa y dejó de ser wild`,
        );
        assert.equal(
          spin.mults[cell], mult,
          `la celda ${cell} cambió de multiplicador (${mult} → ${spin.mults[cell]})`,
        );
      }
      for (let c = 0; c < spin.grid.length; c++) {
        if (spin.grid[c] === SYM.WILD) seen.set(c, spin.mults[c]!);
      }
    }
    return;
  }
  throw new Error('no salió ninguna feature con 2+ giros en 50 compras');
});

test('los multiplicadores de una línea se multiplican entre sí', () => {
  const ev = createEvaluator(GAME);
  const grid = ev.newGrid();
  const cells = GAME.reels * GAME.rows;
  const mults = new Float64Array(cells).fill(1);

  // Línea 0 = fila superior. Cinco H1 con dos wilds ×10 y ×25 en el medio.
  grid.fill(SYM.L5);
  for (let r = 0; r < GAME.reels; r++) grid[r * GAME.rows] = SYM.H1;
  grid[1 * GAME.rows] = SYM.WILD;
  mults[1 * GAME.rows] = 10;
  grid[3 * GAME.rows] = SYM.WILD;
  mults[3 * GAME.rows] = 25;

  const res = ev.evaluate(grid, 1, 15, 1, mults);
  const top = res.lineWins.find((w) => w.line === 0);
  assert.ok(top, 'la línea superior tiene que pagar');
  assert.equal(top.count, 5);
  assert.equal(top.mult, 250, 'x10 y x25 en la misma línea tienen que dar x250');
  assert.equal(top.amount, GAME.paytable[SYM.H1]![5]! * 250);
});
