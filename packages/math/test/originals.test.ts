/**
 * Los originales — Crash (Ruta 40), Mines (Famatina) y Plinko (La Kermés).
 *
 * La matemática es cerrada, así que se prueba contra la fórmula: cada
 * configuración devuelve el objetivo, el sorteo reparte lo que dice que
 * reparte y el redondeo de los pagos no le roba nada a nadie.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  Sfc32Rng, crashPoint, minesMaxReveals, minesMultiplier, originalConfigs, placeMines,
  plinkoDrop, plinkoOdds, plinkoRtp, roundPay,
} from '../src/index.ts';
import { DEF as CRASH } from '../../games/ruta40/src/index.ts';
import { DEF as MINES } from '../../games/famatina/src/index.ts';
import { DEF as PLINKO } from '../../games/kermes/src/index.ts';

test('cada configuración de los tres originales devuelve el 97 %', () => {
  for (const def of [CRASH, MINES, PLINKO]) {
    for (const c of originalConfigs(def)) {
      assert.ok(Math.abs(c.exact - 0.97) < 0.001, `${def.id} · ${c.label}: ${c.exact}`);
    }
  }
});

test('Crash: P(quiebre ≥ m) = rtp / m', () => {
  const rng = new Sfc32Rng(40);
  const n = 400_000;
  const pts = Array.from({ length: n }, () => crashPoint(CRASH, rng));
  for (const m of [1.01, 1.5, 2, 5, 20]) {
    const p = pts.filter((x) => x >= m).length / n;
    const want = 0.97 / m;
    const se = Math.sqrt((want * (1 - want)) / n);
    assert.ok(Math.abs(p - want) < 5 * se, `×${m}: ${p} contra ${want}`);
  }
  assert.ok(pts.every((x) => x >= 1 && x <= CRASH.maxMult), 'el quiebre queda entre ×1 y el tope');
});

test('Mines: el multiplicador es rtp sobre la chance de sobrevivir, y nunca pasa el tope', () => {
  assert.equal(Math.round(minesMultiplier(MINES, 1, 1) * 1e6) / 1e6, Math.round((0.97 * 25) / 24 * 1e6) / 1e6);
  assert.equal(Math.round(minesMultiplier(MINES, 24, 1) * 100) / 100, 24.25);
  for (let m = MINES.minMines; m <= MINES.maxMines; m++) {
    const top = minesMaxReveals(MINES, m);
    assert.ok(top >= 1, `${m} cargas: al menos una roca`);
    assert.ok(minesMultiplier(MINES, m, top) <= MINES.maxMult, `${m} cargas: se pasa del tope`);
  }
  const rng = new Sfc32Rng(9);
  for (let i = 0; i < 2000; i++) {
    const m = 1 + (i % 24);
    const mines = placeMines(MINES, m, rng);
    assert.equal(new Set(mines).size, m, 'cargas distintas');
    assert.ok(mines.every((c) => c >= 0 && c < 25));
  }
});

test('Plinko: la bolita cae con la binomial y cada tabla es simétrica', () => {
  for (const n of PLINKO.rows) {
    const odds = plinkoOdds(n);
    assert.ok(Math.abs(odds.reduce((a, b) => a + b, 0) - 1) < 1e-12);
    for (const r of PLINKO.risks) {
      const t = PLINKO.tables[`${n}-${r.id}`]!;
      assert.equal(t.length, n + 1, `${n}-${r.id}: un pago por casillero`);
      assert.deepEqual([...t].reverse(), [...t], `${n}-${r.id}: simétrica`);
      assert.ok(Math.abs(plinkoRtp(PLINKO, n, r.id) - 0.97) < 0.001);
    }
  }
  const rng = new Sfc32Rng(3);
  const counts = new Array(17).fill(0);
  const N = 200_000;
  for (let i = 0; i < N; i++) {
    const d = plinkoDrop(16, rng);
    assert.equal(d.path.length, 16);
    assert.equal(d.bucket, d.path.reduce((a, b) => a + b, 0));
    counts[d.bucket]++;
  }
  const odds = plinkoOdds(16);
  for (const k of [6, 7, 8, 9, 10]) {
    const se = Math.sqrt((odds[k]! * (1 - odds[k]!)) / N);
    assert.ok(Math.abs(counts[k] / N - odds[k]!) < 5 * se, `casillero ${k}`);
  }
});

test('el redondeo de los pagos no cambia el valor esperado', () => {
  const rng = new Sfc32Rng(77);
  const n = 200_000;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p = roundPay(20.6, rng);
    assert.ok(p === 20 || p === 21);
    sum += p;
  }
  assert.ok(Math.abs(sum / n - 20.6) < 0.01, `media ${sum / n}`);
  assert.equal(roundPay(15, rng), 15);
  assert.equal(roundPay(0, rng), 0);
});
