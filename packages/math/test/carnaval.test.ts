/**
 * El Carnaval — multiplicadores que se acumulan.
 *
 * Las reglas de la acumulación sobre rondas reales del motor, la validación
 * cruzada de siempre (`play` contra `playFast`) y la que más importa para un
 * juego nuevo: que el modelo del solver y el motor den el mismo RTP. Si se
 * separan, el solver resuelve tablas para otro juego.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Sfc32Rng, createClusterEngine, measureCluster, clusterRtp, simulate, type FastRound } from '../src/index.ts';
import { GAME } from '../../games/carnaval/src/index.ts';

const BET = 20;
const engine = createClusterEngine(GAME);

test('play y playFast dan el mismo total con la misma semilla', () => {
  const a = new Sfc32Rng(515);
  const b = new Sfc32Rng(515);
  const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  for (let i = 0; i < 5000; i++) {
    const r = engine.play(a, BET);
    engine.playFast(b, BET, out);
    assert.equal(Math.round(r.totalWin * 1e6), Math.round(out.totalWin * 1e6), `ronda ${i}`);
  }
});

test('el total acumulado nunca baja y es el que multiplica cada secuencia', () => {
  const rng = new Sfc32Rng(77);
  for (let k = 0; k < 150; k++) {
    const r = engine.playBonus(rng, BET);
    let prev = 0;
    for (const f of r.free) {
      assert.ok(f.bombTotal !== undefined, 'cada giro gratis informa el total');
      assert.ok(f.bombTotal! >= prev, `el total bajó de ${prev} a ${f.bombTotal}`);
      // Si la secuencia se multiplicó, fue por el total vigente después de sumarla.
      if (f.bombMult) assert.equal(f.bombMult, f.bombTotal);
      prev = f.bombTotal!;
    }
  }
});

test('en el juego base las esferas multiplican sin acumular', () => {
  const rng = new Sfc32Rng(91);
  let vistas = 0;
  for (let i = 0; i < 40_000 && vistas < 20; i++) {
    const r = engine.play(rng, BET);
    if (!r.base.bombMult) continue;
    vistas++;
    // La suma de las esferas que quedaron en pantalla, ni más ni menos.
    const last = r.base.tumbles?.[r.base.tumbles.length - 1]?.mults ?? r.base.mults ?? [];
    assert.equal(r.base.bombMult, last.reduce((a, v) => a + v, 0));
    assert.equal(r.base.bombTotal, undefined, 'el juego base no acumula');
  }
  assert.ok(vistas > 0, 'en 40.000 rondas tiene que haber esferas que multipliquen');
});

test('el modelo del solver y el motor dan el mismo RTP', () => {
  const rounds = 400_000;
  const model = clusterRtp(GAME, measureCluster(GAME, { rounds, seed: 33 })).total;
  const sim = simulate(GAME, { rounds, bet: BET, seed: 33, engine: createClusterEngine({ ...GAME, maxWinX: Number.POSITIVE_INFINITY }) });
  // Misma semilla y mismo consumo del RNG: tienen que coincidir casi exacto.
  assert.ok(Math.abs(model - sim.rtpTotal) < 0.005, `modelo ${model} contra motor ${sim.rtpTotal}`);
});

test('la compra siempre dispara', () => {
  const rng = new Sfc32Rng(5);
  for (let i = 0; i < 200; i++) assert.ok(engine.playBonus(rng, BET).triggered);
});
