/**
 * Las Cataratas — caminos con columnas de altura variable.
 *
 * Las reglas propias de la mecánica sobre rondas reales del motor (alturas,
 * celdas vacías, caminos), la validación cruzada de siempre (`play` contra
 * `playFast`) y que el modelo del solver y el motor den el mismo RTP.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SYM, VOID, Sfc32Rng, createClusterEngine, measureCluster, clusterRtp, simulate, type FastRound,
} from '../src/index.ts';
import { GAME } from '../../games/cataratas/src/index.ts';

const BET = 20;
const engine = createClusterEngine(GAME);
const ROWS = GAME.rows;

/** Altura de cada columna de una grilla: lo que no es VOID. */
const heightsOf = (grid: readonly number[]): number[] =>
  Array.from({ length: GAME.reels }, (_, r) => grid.slice(r * ROWS, r * ROWS + ROWS).filter((s) => s !== VOID).length);

test('play y playFast dan el mismo total con la misma semilla', () => {
  const a = new Sfc32Rng(1605);
  const b = new Sfc32Rng(1605);
  const out: FastRound = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  for (let i = 0; i < 5000; i++) {
    const r = engine.play(a, BET);
    engine.playFast(b, BET, out);
    assert.equal(Math.round(r.totalWin * 1e6), Math.round(out.totalWin * 1e6), `ronda ${i}`);
  }
});

test('cada columna muestra de 2 a 7 y lo vacío queda arriba; las cascadas no cambian la altura', () => {
  const rng = new Sfc32Rng(42);
  for (let i = 0; i < 3000; i++) {
    const r = engine.play(rng, BET);
    const h = heightsOf(r.base.grid);
    for (let c = 0; c < GAME.reels; c++) {
      assert.ok(h[c]! >= 2 && h[c]! <= 7, `altura ${h[c]}`);
      // Vacías arriba, llenas abajo.
      for (let row = 0; row < ROWS; row++) {
        const vacio = r.base.grid[c * ROWS + row] === VOID;
        assert.equal(vacio, row < ROWS - h[c]!, `columna ${c} fila ${row}`);
      }
    }
    for (const t of r.base.tumbles ?? []) assert.deepEqual(heightsOf(t.grid), h, 'una cascada cambió la altura');
  }
});

test('un premio cobra la tabla por la cantidad de caminos', () => {
  const rng = new Sfc32Rng(7);
  let vistos = 0;
  for (let i = 0; i < 20_000 && vistos < 300; i++) {
    const r = engine.play(rng, BET);
    for (const w of r.base.result.lineWins) {
      vistos++;
      // Caminos = producto, columna por columna, de las celdas premiadas.
      const porColumna = new Map<number, number>();
      for (const c of w.cells ?? []) porColumna.set(Math.floor(c / ROWS), (porColumna.get(Math.floor(c / ROWS)) ?? 0) + 1);
      assert.equal(porColumna.size, w.count, 'las celdas cubren exactamente las columnas del premio');
      let ways = 1;
      for (const n of porColumna.values()) ways *= n;
      const pay = GAME.paytable[w.symbol]![w.count - 3]!;
      assert.equal(w.amount, pay * ways * (BET / 20), `símbolo ${w.symbol} en ${w.count} columnas`);
      // Ningún premio arranca con wild ni lo paga el scatter.
      assert.notEqual(w.symbol, SYM.WILD);
      assert.notEqual(w.symbol, SYM.SCATTER);
    }
  }
  assert.ok(vistos > 100, 'tiene que haber premios para revisar');
});

test('en la función el multiplicador sube uno por cascada y no vuelve atrás', () => {
  const rng = new Sfc32Rng(11);
  for (let k = 0; k < 100; k++) {
    const r = engine.playBonus(rng, BET);
    let last = 1;
    for (const f of r.free) {
      const etapas = [{ m: f.multiplier, w: f.result.lineWins.length }, ...(f.tumbles ?? []).map((t) => ({ m: t.multiplier, w: t.result.lineWins.length }))];
      for (const e of etapas) {
        assert.ok(e.m >= last, `bajó de ×${last} a ×${e.m}`);
        if (e.w > 0) last = e.m;
      }
    }
  }
});

test('el modelo del solver y el motor dan el mismo RTP', () => {
  const rounds = 300_000;
  const model = clusterRtp(GAME, measureCluster(GAME, { rounds, seed: 33 })).total;
  const sim = simulate(GAME, { rounds, bet: BET, seed: 33, engine: createClusterEngine({ ...GAME, maxWinX: Number.POSITIVE_INFINITY }) });
  assert.ok(Math.abs(model - sim.rtpTotal) < 0.005, `modelo ${model} contra motor ${sim.rtpTotal}`);
});

test('la compra siempre dispara', () => {
  const rng = new Sfc32Rng(5);
  for (let i = 0; i < 200; i++) assert.ok(engine.playBonus(rng, BET).triggered);
});
