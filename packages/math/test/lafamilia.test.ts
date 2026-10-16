/**
 * La Familia — pruebas de consistencia del motor (generadas por new-game).
 *
 * Valen para cualquier juego: la ruta con detalle (`play`) y la rápida
 * (`playFast`) tienen que dar exactamente lo mismo con la misma semilla, y la
 * compra del bonus tiene que disparar siempre. Las reglas propias del juego
 * se agregan abajo cuando la mecánica cambie respecto del molde (feria).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Sfc32Rng, type FastRound } from '../src/index.ts';
import { MANIFEST } from '../../games/lafamilia/src/manifest.ts';

const bet = MANIFEST.game.paylines.length || MANIFEST.game.betDivisor || 20;

test('play y playFast dan el mismo total con la misma semilla', () => {
  const eng = MANIFEST.engine();
  const a = new Sfc32Rng(1873);
  const b = new Sfc32Rng(1873);
  const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  for (let i = 0; i < 3000; i++) {
    const lento = eng.play(a, bet);
    eng.playFast(b, bet, out);
    assert.equal(lento.totalWin, out.totalWin, `ronda ${i}: la ruta con detalle y la rápida se separaron`);
  }
});

test('la compra del bonus siempre dispara', () => {
  const eng = MANIFEST.engine();
  const rng = new Sfc32Rng(7);
  for (let i = 0; i < 200; i++) assert.ok(eng.playBonus(rng, bet).triggered, `compra ${i} sin feature`);
});

test('las bolsas quedan fijas y cada nueva bolsa renueva los intentos', () => {
  const engine = MANIFEST.engine(), rng = new Sfc32Rng(191930);
  for (let n = 0; n < 80; n++) {
    const round = engine.playBonus(rng, bet);
    let prior = round.base.mults!;
    assert.ok(round.totalWin <= 5000 * bet);
    for (const step of round.free) {
      const values = step.mults!;
      for (let i = 0; i < prior.length; i++) if (prior[i]! > 0) assert.equal(values[i], prior[i]);
      for (const i of step.hold!.fresh) { assert.equal(prior[i], 0); assert.ok(values[i]! > 0); }
      if (step.hold!.fresh.length && values.some(v => v === 0)) assert.equal(step.hold!.left, 3);
      prior = values;
    }
    if (round.free.length) assert.equal(round.free.at(-1)!.hold!.collect, round.featureWin);
    assert.equal(round.baseWin + round.featureWin, round.totalWin);
  }
});
