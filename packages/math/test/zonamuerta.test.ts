/**
 * Zona Muerta — pruebas de consistencia del motor (generadas por new-game).
 *
 * Valen para cualquier juego: la ruta con detalle (`play`) y la rápida
 * (`playFast`) tienen que dar exactamente lo mismo con la misma semilla, y la
 * compra del bonus tiene que disparar siempre. Las reglas propias del juego
 * se agregan abajo cuando la mecánica cambie respecto del molde (vendimia).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Sfc32Rng, type FastRound } from '../src/index.ts';
import { MANIFEST } from '../../games/zonamuerta/src/manifest.ts';

const bet = MANIFEST.game.paylines.length || MANIFEST.game.betDivisor || 20;

test('play y playFast dan el mismo total con la misma semilla', () => {
  const eng = MANIFEST.engine();
  const a = new Sfc32Rng(1970);
  const b = new Sfc32Rng(1970);
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

test('los tres refugios conservan su escalera y respetan el tope', () => {
  const engine = MANIFEST.engine();
  const rng = new Sfc32Rng(20261016);
  assert.equal(MANIFEST.game.bonusVariants?.length, 3);
  for (const variant of MANIFEST.game.bonusVariants ?? []) for (let n = 0; n < 40; n++) {
    const round = engine.playBonus(rng, bet, variant);
    assert.ok(round.triggered);
    assert.ok(round.totalWin <= 5000 * bet);
    const multipliers = round.free.map(step => step.multiplier);
    for (let i = 1; i < multipliers.length; i++) assert.ok(multipliers[i]! >= multipliers[i - 1]!);
    if (variant.minMultiplier && round.free.length) assert.ok(round.free[0]!.multiplier >= variant.minMultiplier);
  }
});
