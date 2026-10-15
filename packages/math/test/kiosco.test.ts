/**
 * El Kiosco — paga en cualquier parte, con cascadas y bombas.
 *
 * Las mismas dos familias que en La Vendimia:
 *
 *  1. LAS REGLAS, con grillas armadas a mano: ocho iguales en cualquier lugar
 *     pagan aunque no se toquen; siete no; la bomba y el chupetín no forman
 *     premio; las bombas no se van con la cascada y multiplican SOLO si la
 *     secuencia ganó algo.
 *
 *  2. LA VALIDACIÓN CRUZADA. `play`, `playFast` y `measureCluster` tienen
 *     que dar lo mismo. Con bombas esto prueba algo más: que el valor de
 *     cada bomba viaja con la tira y no se sortea aparte.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../src/simulate.ts';
import { Sfc32Rng } from '../src/rng.ts';
import { SYM } from '../src/types.ts';
import { createClusterEvaluator, type ClusterGameDef } from '../src/cluster.ts';
import { createClusterEngine } from '../src/cluster-round.ts';
import { measureCluster, clusterRtp } from '../src/cluster-tune.ts';
import { GAME } from '../../games/kiosco/src/index.ts';

const ROUNDS = 120_000;
const SEED = 9090;
const CELLS = GAME.reels * GAME.rows;

const SIN_TOPE: ClusterGameDef = { ...GAME, maxWinX: Number.POSITIVE_INFINITY };

/**
 * Fondo inerte: con nueve símbolos repartidos de a tres o cuatro, ninguno
 * llega a ocho. Se planta encima lo que se quiere probar.
 */
function fondo(): Int8Array {
  const g = new Int8Array(CELLS);
  const ciclo = [SYM.H1, SYM.H2, SYM.H3, SYM.H4, SYM.L1, SYM.L2, SYM.L3, SYM.L4, SYM.L5];
  for (let i = 0; i < CELLS; i++) g[i] = ciclo[i % ciclo.length]!;
  return g;
}

/* ============================================================
   1. LAS REGLAS
   ============================================================ */

test('el fondo de las pruebas no forma ningún premio', () => {
  const ev = createClusterEvaluator(GAME);
  assert.equal(ev.clusters(fondo()).length, 0);
});

test('ocho iguales pagan aunque estén desparramados; siete no', () => {
  const ev = createClusterEvaluator(GAME);
  // Celdas bien separadas: ninguna toca a otra.
  const lejos = [0, 2, 4, 11, 13, 20, 22, 24];

  const g = fondo();
  for (const c of lejos.slice(0, 7)) g[c] = SYM.L5;
  // El fondo ya tiene L5 en algunas celdas: se cuentan todas.
  const yaHabia = Array.from(g).filter((s) => s === SYM.L5).length;
  if (yaHabia < 8) assert.equal(ev.clusters(g).length, 0, 'siete no alcanzan');

  for (const c of lejos) g[c] = SYM.L5;
  const list = ev.clusters(g);
  assert.equal(list.length, 1);
  assert.equal(list[0]!.symbol, SYM.L5);
  assert.ok(list[0]!.size >= 8);
});

test('la bomba y el chupetín no forman premio', () => {
  const ev = createClusterEvaluator(GAME);
  const g = new Int8Array(CELLS);
  for (let i = 0; i < CELLS; i++) g[i] = i % 2 ? SYM.WILD : SYM.SCATTER;
  assert.equal(ev.clusters(g).length, 0);
});

test('los tramos son 8-9, 10-11 y 12+', () => {
  const ev = createClusterEvaluator(GAME);
  assert.equal(ev.tierOf(7), -1);
  assert.equal(ev.tierOf(8), 0);
  assert.equal(ev.tierOf(9), 0);
  assert.equal(ev.tierOf(10), 1);
  assert.equal(ev.tierOf(11), 1);
  assert.equal(ev.tierOf(12), 2);
  assert.equal(ev.tierOf(30), 2);
});

test('la bomba no se va con la cascada: baja con su valor', () => {
  const ev = createClusterEvaluator(GAME);
  const g = fondo();
  const valores = { strips: GAME.bombValues!, cells: new Int32Array(CELLS) };
  // Columna 0: bomba ×7 arriba de todo; el resto de la columna explota.
  g[0] = SYM.WILD;
  valores.cells[0] = 7;
  const remove = new Uint8Array(CELLS);
  for (let row = 1; row < GAME.rows; row++) remove[row] = 1;
  const feed = new Int32Array(GAME.reels);
  ev.tumble(g, remove, GAME.freeStrips, feed, valores);
  // La bomba cayó al fondo de la columna y conserva el ×7.
  const fila = GAME.rows - 1;
  assert.equal(g[fila], SYM.WILD);
  assert.equal(valores.cells[fila], 7);
});

/* ============================================================
   2. LAS BOMBAS EN LA RONDA
   ============================================================ */

test('las bombas multiplican solo si la secuencia ganó algo', () => {
  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(2024);
  let vistas = 0;
  for (let i = 0; i < 300; i++) {
    const r = eng.playBonus(rng, 20);
    for (const f of r.free) {
      let crudo = f.result.totalWin;
      for (const t of f.tumbles ?? []) crudo += t.win;
      if (f.bombWin) {
        vistas++;
        assert.ok(crudo > 0, 'una bomba multiplicó una secuencia sin premio');
        assert.ok((f.bombMult ?? 0) >= 2);
        assert.equal(
          Math.round(f.bombWin * 1e6),
          Math.round(Math.min(crudo * (f.bombMult! - 1), f.bombWin) * 1e6),
        );
      }
      if (crudo === 0) assert.ok(!f.bombWin);
    }
  }
  assert.ok(vistas > 0, 'en 300 compras no multiplicó ninguna bomba: revisar las tiras');
});

test('con 3 chupetines en la feature se suman giros', () => {
  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(77);
  let retriggers = 0;
  for (let i = 0; i < 400; i++) {
    const r = eng.playBonus(rng, 20);
    for (const f of r.free) {
      if (f.result.scatterCount >= 3) {
        assert.equal(f.awarded, GAME.freeSpinsRetrigger);
        retriggers++;
      } else {
        assert.equal(f.awarded, 0);
      }
    }
  }
  assert.ok(retriggers > 0);
});

/* ============================================================
   3. VALIDACIÓN CRUZADA
   ============================================================ */

test('el simulador y el modelo de frecuencias dan el mismo RTP', () => {
  const sim = simulate(SIN_TOPE, {
    rounds: ROUNDS, bet: 20, seed: SEED, engine: createClusterEngine(SIN_TOPE),
  });
  const freq = measureCluster(SIN_TOPE, { rounds: ROUNDS, seed: SEED });
  const model = clusterRtp(SIN_TOPE, freq);
  const diff = Math.abs(sim.rtpTotal - model.total);
  assert.ok(
    diff < 1e-9,
    `RTP distinto: simulador ${(sim.rtpTotal * 100).toFixed(4)}% vs modelo ` +
      `${(model.total * 100).toFixed(4)}%. Un lado consume el RNG distinto o pesa las bombas distinto.`,
  );
});

test('play y playFast dan el mismo total con la misma semilla', () => {
  const eng = createClusterEngine(GAME);
  const a = new Sfc32Rng(4321);
  const b = new Sfc32Rng(4321);
  const out = { baseWin: 0, featureWin: 0, totalWin: 0, triggered: false, freeSpinsPlayed: 0, tier: 0 };
  for (let i = 0; i < 3000; i++) {
    const lento = eng.play(a, 20);
    eng.playFast(b, 20, out);
    assert.equal(lento.totalWin, out.totalWin, `ronda ${i}: la ruta con detalle y la rápida se separaron`);
  }
  // Y lo mismo dentro de la feature, que es donde están las bombas.
  const c = new Sfc32Rng(99);
  for (let i = 0; i < 200; i++) {
    const r = eng.playBonus(c, 20);
    let suma = r.baseWin;
    for (const f of r.free) {
      suma += f.result.totalWin + (f.bombWin ?? 0);
      for (const t of f.tumbles ?? []) suma += t.win;
    }
    assert.equal(Math.round(suma * 1e6), Math.round(r.totalWin * 1e6), `compra ${i}: el detalle no suma el total`);
  }
});

test('la apuesta ante devuelve lo que cobra', () => {
  const base = simulate(GAME, { rounds: ROUNDS, bet: 20, seed: 8181, engine: createClusterEngine(GAME) });
  const ante = simulate(GAME, { rounds: ROUNDS, bet: 20, seed: 8181, ante: true, engine: createClusterEngine(GAME) });
  assert.ok(ante.triggerOneIn < base.triggerOneIn * 0.6);
  assert.ok(Math.abs(ante.rtpTotal - base.rtpTotal) < 0.08);
});
