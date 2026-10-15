/**
 * La Feria — Hold & Win.
 *
 * Las reglas de la función, verificadas sobre rondas reales del motor, y la
 * validación cruzada de siempre: `play` (con detalle) y `playFast` (para
 * simular) tienen que dar lo mismo con la misma semilla.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SYM, Sfc32Rng, createHoldWinEngine, type FastRound, type HoldWinDef, type RoundResult } from '../src/index.ts';
import { GAME } from '../../games/feria/src/index.ts';

const BET = 20;
const engine = createHoldWinEngine(GAME);
const fast = (): FastRound => ({ baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 });

/** Rondas compradas, para tener funciones sin esperar el disparo. */
function bought(n: number, seed: number): RoundResult[] {
  const rng = new Sfc32Rng(seed);
  return Array.from({ length: n }, () => engine.playBonus(rng, BET));
}

test('play y playFast dan el mismo total con la misma semilla', () => {
  const a = new Sfc32Rng(4141);
  const b = new Sfc32Rng(4141);
  const out = fast();
  for (let i = 0; i < 20_000; i++) {
    const r = engine.play(a, BET);
    engine.playFast(b, BET, out);
    assert.equal(r.totalWin, out.totalWin, `ronda ${i}`);
    assert.equal(r.triggered, out.triggered, `ronda ${i}: disparo`);
  }
});

test('la compra siempre dispara, con seis monedas o más', () => {
  for (const r of bought(300, 7)) {
    assert.ok(r.triggered);
    assert.ok(r.base.grid.filter((s) => s === SYM.SCATTER).length >= GAME.holdWin.trigger);
    assert.ok(r.free.length >= 1, 'la función tiene al menos un re-giro');
  }
});

test('cada moneda nueva vuelve los re-giros a tres; sin monedas, se descuenta uno', () => {
  for (const r of bought(300, 11)) {
    let left = GAME.holdWin.respins;
    for (const rec of r.free) {
      const h = rec.hold!;
      const full = rec.grid.every((s) => s === SYM.SCATTER);
      const expected = full ? 0 : h.fresh.length ? GAME.holdWin.respins : left - 1;
      assert.equal(h.left, expected);
      left = h.left;
    }
    assert.ok(left === 0, 'la función termina sin re-giros o con la pantalla llena');
  }
});

test('las monedas fijas no se mueven ni cambian de valor', () => {
  for (const r of bought(200, 13)) {
    let prev = r.base.mults!;
    for (const rec of r.free) {
      for (let i = 0; i < prev.length; i++) if (prev[i]! > 0) assert.equal(rec.mults![i], prev[i], `celda ${i}`);
      prev = rec.mults!;
    }
  }
});

test('lo cobrado es la suma de las monedas, más el Grand si se llenó la pantalla', () => {
  const g: HoldWinDef = { ...GAME, holdWin: { ...GAME.holdWin, landPerMil: 1000 } };
  const full = createHoldWinEngine(g);
  // Con caída segura, la pantalla se llena en el primer re-giro.
  const r = full.playBonus(new Sfc32Rng(3), BET);
  const last = r.free[r.free.length - 1]!;
  assert.ok(last.grid.every((s) => s === SYM.SCATTER));
  assert.equal(last.hold!.grand, GAME.holdWin.jackpots.grand * BET);
  // Con el Grand igual al tope, una pantalla llena paga exactamente el tope.
  assert.equal(r.totalWin, GAME.maxWinX * BET);

  for (const r2 of bought(200, 17)) {
    const l = r2.free[r2.free.length - 1]!;
    const coins = l.mults!.reduce((a, v) => a + v, 0) * BET;
    const expected = Math.min(coins + (l.hold!.grand ?? 0), GAME.maxWinX * BET - r2.baseWin);
    assert.equal(l.hold!.collect, expected);
    assert.equal(r2.featureWin, expected);
  }
});
