/**
 * La Vendimia — racimos y cascadas.
 *
 * Dos familias de pruebas y las dos hacen falta:
 *
 *  1. LAS REGLAS. Un racimo es un grupo CONECTADO, el wild pega grupos, y un
 *     grupo de puros wilds no paga. Son reglas que se verifican con grillas
 *     armadas a mano, porque un error acá no cambia el RTP lo suficiente
 *     como para que un promedio lo delate — cambia lo que el jugador ve.
 *
 *  2. LA CASCADA Y LA VALIDACIÓN CRUZADA. `playFast` (simulador), `play`
 *     (juego real) y `measureCluster` (tuner) son tres implementaciones de
 *     la misma matemática y tienen que dar exactamente lo mismo. Coinciden
 *     solo si consumen el RNG en el mismo orden: `reels` paradas por caída y
 *     NADA más en toda la jugada. Ese contrato se rompe fácil —basta agregar
 *     un sorteo en el relleno— y el síntoma sería un RTP declarado que el
 *     juego no entrega.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { simulate } from '../src/simulate.ts';
import { Sfc32Rng } from '../src/rng.ts';
import { SYM } from '../src/types.ts';
import {
  createClusterEvaluator,
  MIN_CLUSTER,
  type ClusterGameDef,
} from '../src/cluster.ts';
import { createClusterEngine } from '../src/cluster-round.ts';
import { measureCluster, clusterRtp } from '../src/cluster-tune.ts';
import { GAME } from '../../games/vendimia/src/index.ts';

const ROUNDS = 120_000;
const SEED = 4711;

/**
 * Copia sin tope de premio.
 *
 * `measureCluster` mide el juego SIN tope —el tope depende de la paytable,
 * que es justo lo que el tuner está por resolver— así que la comparación con
 * el simulador solo es exacta si al simulador también se le saca.
 */
const SIN_TOPE: ClusterGameDef = { ...GAME, maxWinX: Number.POSITIVE_INFINITY };

/* ============================================================
   1. LAS REGLAS DEL RACIMO
   ============================================================ */

/**
 * FONDO INERTE.
 *
 * Para probar una regla de racimos hace falta una grilla donde el ÚNICO
 * racimo sea el que uno planta. Dibujar la grilla "a ojo" no sirve: la
 * primera versión de estas pruebas usaba tableros escritos a mano y tenían
 * racimos de fondo sin querer —con seis columnas y cinco filas es facilísimo
 * que se junten cinco iguales sin que uno lo vea—, así que las pruebas
 * fallaban por el dibujo y no por el motor.
 *
 * `(columna + fila) % 3` resuelve el problema de raíz: dos celdas vecinas
 * (arriba, abajo o al costado) siempre difieren en uno módulo 3, o sea que
 * NUNCA son el mismo símbolo. El fondo no puede formar un racimo aunque uno
 * quiera. Y como usa solo tres de los seis, quedan otros para plantar figuras
 * que no se contagian con el fondo.
 */
const FONDO = [SYM.L1, SYM.L2, SYM.L3];

function tablero(): Int8Array {
  const g = new Int8Array(30);
  for (let r = 0; r < 6; r++) {
    for (let row = 0; row < 5; row++) g[r * 5 + row] = FONDO[(r + row) % 3]!;
  }
  return g;
}

/** Planta un símbolo en las celdas dadas, como [columna, fila]. */
function plantar(g: Int8Array, sym: number, celdas: readonly (readonly [number, number])[]): void {
  for (const [r, row] of celdas) g[r * 5 + row] = sym;
}

const C = SYM.H1;
const D = SYM.H2;
const W = SYM.WILD;

test('el fondo de las pruebas no forma ningún racimo', () => {
  // Si esta prueba falla, todas las de abajo mienten.
  assert.equal(createClusterEvaluator(GAME).clusters(tablero()).length, 0);
});

test('cinco pegados pagan; cinco sueltos no', () => {
  const ev = createClusterEvaluator(GAME);

  // Una L de cinco: conectada aunque no sea ni fila ni columna.
  const pegados = tablero();
  plantar(pegados, C, [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]);
  const racimos = ev.clusters(pegados);
  assert.equal(racimos.length, 1, 'tenía que haber un solo racimo');
  assert.equal(racimos[0]!.symbol, C);
  assert.equal(racimos[0]!.size, 5);

  // Los mismos cinco símbolos, repartidos sin tocarse.
  const sueltos = tablero();
  plantar(sueltos, C, [[0, 0], [2, 0], [4, 0], [0, 2], [2, 4]]);
  assert.equal(ev.clusters(sueltos).length, 0, 'cinco sin tocarse NO son un racimo');
});

test('cuatro pegados no alcanzan', () => {
  assert.equal(MIN_CLUSTER, 5);
  const g = tablero();
  plantar(g, C, [[0, 0], [1, 0], [0, 1], [1, 1]]);
  assert.equal(createClusterEvaluator(GAME).clusters(g).length, 0);
});

test('la tijera pega dos grupos que solos no pagarían', () => {
  const ev = createClusterEvaluator(GAME);
  // Dos pares separados por una columna, con la tijera justo en el medio.
  const g = tablero();
  plantar(g, C, [[0, 0], [1, 0], [3, 0], [4, 0]]);
  plantar(g, W, [[2, 0]]);
  const racimos = ev.clusters(g).filter((x) => x.symbol === C);
  assert.equal(racimos.length, 1);
  assert.equal(racimos[0]!.size, 5, 'cuatro + la tijera = cinco');
});

test('una tijera puede cobrar en dos racimos a la vez', () => {
  const ev = createClusterEvaluator(GAME);
  /* Es la regla que más rompe la intuición del jugador —por eso está escrita
     en la tabla de pagos— y acá se verifica que el motor de verdad la
     implementa: la tijera NO se consume con el primer racimo. */
  const g = tablero();
  plantar(g, C, [[0, 0], [1, 0], [0, 1], [1, 1]]);
  plantar(g, W, [[2, 0]]);
  plantar(g, D, [[3, 0], [4, 0], [3, 1], [4, 1]]);

  const racimos = ev.clusters(g);
  const deC = racimos.find((x) => x.symbol === C);
  const deD = racimos.find((x) => x.symbol === D);
  assert.ok(deC, 'falta el racimo de H1');
  assert.ok(deD, 'falta el racimo de H2');
  assert.equal(deC.size, 5, 'cuatro H1 + la tijera');
  assert.equal(deD.size, 5, 'cuatro H2 + la MISMA tijera');
});

test('un tablero de puras tijeras y barricas no paga nada', () => {
  const ev = createClusterEvaluator(GAME);
  /* Un grupo de tijeras solas no tiene a quién sustituir.
     OJO con lo que esta prueba NO dice: si al lado de ese grupo hubiera UNA
     uva, la uva más las tijeras sí formarían racimo. Eso es correcto y es
     justamente lo que hace valioso al wild; por eso el tablero de prueba no
     tiene ningún símbolo pagador. */
  const g = new Int8Array(30);
  for (let i = 0; i < 30; i++) g[i] = i % 4 === 0 ? SYM.SCATTER : W;
  assert.equal(ev.clusters(g).length, 0);
  assert.ok(ev.countScatters(g) > 0);
});

/* ============================================================
   2. LA CASCADA
   ============================================================ */

test('la cascada baja lo que queda y rellena desde la tira, hacia atrás', () => {
  const ev = createClusterEvaluator(GAME);

  /* Una tira de juguete por columna: 0,1,2,...,9. Con la parada en 3, la
     ventana es 3,4,5,6,7 y lo que entra al caer es 2, después 1, después 0.
     Ese "hacia atrás" es lo que hace que toda la cadena de cascadas quede
     determinada por la posición de parada, sin un solo sorteo más. */
  const tira = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const strips = Array.from({ length: 6 }, () => tira);
  const grid = ev.newGrid();
  const stops = new Int32Array(6);
  const feed = new Int32Array(6);
  const rng = { nextInt: () => 3 };

  ev.drop(strips, rng, grid, stops, feed);
  assert.deepEqual(Array.from(grid.slice(0, 5)), [3, 4, 5, 6, 7], 'ventana desde la parada');
  assert.equal(feed[0], 2, 'lo próximo que cae es lo que estaba justo arriba');

  // Sacamos las dos de arriba y la del medio de la columna 0.
  const remove = new Uint8Array(30);
  remove[0] = 1;
  remove[1] = 1;
  remove[2] = 1;
  ev.tumble(grid, remove, strips, feed);

  assert.deepEqual(
    Array.from(grid.slice(0, 5)),
    [0, 1, 2, 6, 7],
    'los que sobreviven caen al fondo y arriba entra 2, 1, 0 en ese orden',
  );
  assert.equal(feed[0], 9, 'el puntero siguió hacia atrás y dio la vuelta');
});

test('el multiplicador sube un escalón por cascada', () => {
  // La escalera declarada es [1, 2, 3, 5, 8, 12, 20, 30, 50].
  assert.deepEqual(GAME.cascadeMults.slice(0, 4), [1, 2, 3, 5]);

  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(2024);
  for (let i = 0; i < 40_000; i++) {
    const r = eng.play(rng, 20);
    const casc = r.base.tumbles ?? [];
    if (casc.length < 2) continue;
    // La caída inicial va en ×1 y cada cascada que PAGA sube un escalón.
    assert.equal(r.base.multiplier, 1);
    assert.equal(casc[0]!.multiplier, 2);
    assert.equal(casc[1]!.multiplier, 3);
    return;
  }
  assert.fail('no salió ninguna jugada con dos cascadas en 40.000 rondas');
});

test('la última cascada que manda el motor es la grilla ya asentada', () => {
  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(31);
  for (let i = 0; i < 40_000; i++) {
    const r = eng.play(rng, 20);
    const casc = r.base.tumbles ?? [];
    if (casc.length === 0) continue;
    /* Sin este paso final el cliente se queda con los últimos ganadores
       encendidos en pantalla: falta ver explotar lo último y caer lo que lo
       reemplaza. Es un paso que no paga y que igual hay que mandar. */
    assert.equal(casc[casc.length - 1]!.win, 0);
    assert.equal(casc[casc.length - 1]!.result.lineWins.length, 0);
    return;
  }
  assert.fail('no salió ninguna jugada con cascadas');
});

/* ============================================================
   3. VALIDACIÓN CRUZADA
   ============================================================ */

test('el simulador y el modelo de frecuencias dan el mismo RTP', () => {
  const sim = simulate(SIN_TOPE, {
    rounds: ROUNDS,
    bet: 20,
    seed: SEED,
    engine: createClusterEngine(SIN_TOPE),
  });
  const freq = measureCluster(SIN_TOPE, { rounds: ROUNDS, seed: SEED });
  const model = clusterRtp(SIN_TOPE, freq);

  const diff = Math.abs(sim.rtpTotal - model.total);
  assert.ok(
    diff < 1e-9,
    `RTP distinto: simulador ${(sim.rtpTotal * 100).toFixed(4)}% vs ` +
      `modelo ${(model.total * 100).toFixed(4)}% (diferencia ${(diff * 100).toFixed(4)} puntos). ` +
      'Casi siempre significa que un lado consume el RNG distinto del otro.',
  );
});

test('play y playFast dan el mismo total con la misma semilla', () => {
  const eng = createClusterEngine(GAME);
  const a = new Sfc32Rng(777);
  const b = new Sfc32Rng(777);
  const out = {
    baseWin: 0, featureWin: 0, totalWin: 0,
    triggered: false, freeSpinsPlayed: 0, tier: 0,
  };

  for (let i = 0; i < 3000; i++) {
    const lento = eng.play(a, 20);
    eng.playFast(b, 20, out);
    assert.equal(
      lento.totalWin, out.totalWin,
      `ronda ${i}: la ruta con detalle y la rápida se separaron`,
    );
    assert.equal(lento.triggered, out.triggered);
  }
});

test('el premio de un paso es la caída inicial más todas sus cascadas', () => {
  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(1234);
  for (let i = 0; i < 20_000; i++) {
    const r = eng.play(rng, 20);
    let suma = r.base.result.totalWin;
    for (const t of r.base.tumbles ?? []) suma += t.win;
    assert.equal(
      Math.round(suma * 1e6), Math.round(r.baseWin * 1e6),
      `ronda ${i}: el detalle de las cascadas no suma lo que dice baseWin`,
    );
  }
});

test('la compra siempre dispara, y la variante Reserva arranca en ×3', () => {
  const eng = createClusterEngine(GAME);
  const rng = new Sfc32Rng(55);
  const reserva = GAME.bonusVariants!.find((v) => v.id === 'reserva')!;

  for (let i = 0; i < 400; i++) {
    const simple = eng.playBonus(rng, 20);
    assert.ok(simple.triggered, 'una compra que no dispara es una compra rota');
    assert.equal(simple.free.length > 0, true);

    const r = eng.playBonus(rng, 20, reserva);
    assert.ok(r.triggered);
    // El primer giro gratis ya tiene que estar en el escalón ×3 o más arriba.
    assert.ok(
      r.free[0]!.multiplier >= 3,
      `la Reserva arrancó en ×${r.free[0]!.multiplier} y se paga para arrancar en ×3`,
    );
  }
});

test('la apuesta ante devuelve lo que cobra', () => {
  /* La regla que vuelve honesto el ante: si cobrás 1,63× tenés que devolver
     1,63× más premio. Acá se comprueba con pocas rondas —el intervalo es
     ancho— pero alcanza para detectar un desvío grosero, que es lo que pasa
     si alguien toca las tiras del ante y se olvida de re-medir el precio.
     El número fino sale de `node tools/sim.ts --game vendimia --ante`. */
  const base = simulate(GAME, {
    rounds: ROUNDS, bet: 20, seed: 8181, engine: createClusterEngine(GAME),
  });
  const ante = simulate(GAME, {
    rounds: ROUNDS, bet: 20, seed: 8181, ante: true, engine: createClusterEngine(GAME),
  });

  assert.ok(
    ante.triggerOneIn < base.triggerOneIn * 0.6,
    `el ante tiene que disparar bastante más seguido: ${ante.triggerOneIn.toFixed(0)} vs ${base.triggerOneIn.toFixed(0)}`,
  );
  const brecha = Math.abs(ante.rtpTotal - base.rtpTotal);
  assert.ok(
    brecha < 0.06,
    `el RTP con ante (${(ante.rtpTotal * 100).toFixed(2)}%) se fue lejos del base ` +
      `(${(base.rtpTotal * 100).toFixed(2)}%): revisar ANTE_COST_X contra las tiras.`,
  );
});
