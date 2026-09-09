/**
 * Motor de ronda para juegos de racimos con cascadas.
 *
 * Implementa la misma interfaz `RoundEngine` que el motor de líneas, así que
 * el RGS, el simulador y el cliente no se enteran de que adentro pasa otra
 * cosa. Es el mismo pago del contrato que ya cobró Se Busca con sus wilds
 * pegajosos: la mecánica es del juego, la forma es del sistema.
 *
 * ---------------------------------------------------------------------
 * UNA JUGADA
 * ---------------------------------------------------------------------
 *   1. Caen las seis columnas.            ← acá se sortea TODO
 *   2. Se buscan racimos. Si no hay, listo.
 *   3. Se cobran, con el multiplicador que corresponde a esta cascada.
 *   4. Los racimos se van, cae lo de arriba, entra lo nuevo desde la tira.
 *   5. Volver a 2, un escalón más arriba en el multiplicador.
 *
 * El paso 1 es el único con azar. Todo lo demás es consecuencia.
 *
 * ---------------------------------------------------------------------
 * LA ESCALERA EN LOS GIROS GRATIS
 * ---------------------------------------------------------------------
 * En el juego base el multiplicador vuelve a ×1 en cada jugada. En la
 * feature NO: la escalera se guarda entre giros y sigue subiendo. Eso hace
 * que la feature tenga forma de historia —empieza floja y se va calentando—
 * en vez de ser diez jugadas sueltas puestas una atrás de otra.
 *
 * Y es también lo que vuelve el precio de la compra imposible de calcular a
 * ojo: doce giros no valen 1,2 veces diez giros, valen bastante más, porque
 * los dos últimos se juegan con la escalera alta. Por eso se mide.
 *
 * ---------------------------------------------------------------------
 * ORDEN DE SORTEOS (contrato de reproducibilidad)
 * ---------------------------------------------------------------------
 *   caída base: `reels` paradas
 *   por cada giro gratis: `reels` paradas
 *
 * Nada más. `measure.ts` de cada juego de racimos consume exactamente esto,
 * y el test de consistencia compara ambos lados con la misma semilla.
 */

import type { BonusVariant, Grid, ReelStrips, SpinEval } from './types.ts';
import type { Rng } from './rng.ts';
import type { FastRound, RoundEngine, RoundResult, SpinRecord } from './round.ts';
import {
  createClusterEvaluator,
  clustersToEval,
  type ClusterGameDef,
  type TumbleRecord,
} from './cluster.ts';

export function createClusterEngine(game: ClusterGameDef): RoundEngine {
  const ev = createClusterEvaluator(game);
  const cells = game.reels * game.rows;
  const divisor = game.betDivisor ?? 20;
  const ladder = game.cascadeMults;

  /** Multiplicador del escalón `i`, aplanado en el último. */
  const multAt = (i: number): number =>
    ladder[i < ladder.length ? i : ladder.length - 1] ?? 1;

  /** Primer escalón cuyo multiplicador llega a `m`. Para las variantes de compra. */
  function rungFor(m: number): number {
    for (let i = 0; i < ladder.length; i++) if (ladder[i]! >= m) return i;
    return ladder.length - 1;
  }

  // Buffers de playFast: una jugada no asigna nada.
  const fastGrid = ev.newGrid();
  const fastStops = new Int32Array(game.reels);
  const fastFeed = new Int32Array(game.reels);
  const fastRemove = new Uint8Array(cells);

  /**
   * Corre la cadena de cascadas sobre una grilla ya caída.
   *
   * `detail` decide si se arma el registro para el cliente o solo se suma.
   * Es la misma división que en el motor de líneas: el simulador corre esto
   * 10^8 veces y no puede asignar un objeto por cascada.
   */
  function cascade(
    grid: Grid,
    strips: ReelStrips,
    feed: Int32Array,
    coin: number,
    rung: number,
    room: number,
    detail: TumbleRecord[] | null,
    firstEval: { value: SpinEval | null; multiplier: number },
  ): { win: number; rung: number; capped: boolean } {
    let win = 0;
    let capped = false;
    let n = 0;
    const remove = detail ? new Uint8Array(cells) : fastRemove;

    for (;;) {
      const list = ev.clusters(grid);
      const mult = multAt(rung);

      if (list.length === 0) {
        if (n === 0 && detail) {
          // La primera evaluación siempre se registra, gane o no: es la que
          // lleva los scatters y la grilla que el jugador ve al caer.
          firstEval.value = null;
          firstEval.multiplier = mult;
        } else if (detail) {
          /* LA GRILLA FINAL, la que ya no gana nada, TAMBIÉN se manda.
             Sin ella el cliente se queda con los últimos ganadores encendidos
             en pantalla y la cadena termina a mitad de camino: falta ver
             explotar lo último y caer lo que lo reemplaza. Es un paso que no
             paga y que igual hay que contar, porque es el que cierra la
             jugada. */
          detail.push({
            grid: Array.from(grid),
            result: { lineWins: [], scatterCount: 0, scatterWin: 0, totalWin: 0 },
            multiplier: mult,
            win: 0,
          });
        }
        break;
      }

      let step = 0;
      for (const c of list) step += ev.payOf(c.symbol, c.size) * coin * mult;
      if (step > 0 && win + step >= room) {
        step = room - win;
        capped = true;
      }
      win += step;

      if (detail) {
        const spinEval = clustersToEval(ev, list, coin, mult, 0, 0);
        // El tope recorta el total de la cascada; el detalle de cada racimo
        // se deja como salió para que el cliente muestre lo que pasó.
        spinEval.totalWin = step;
        if (n === 0) {
          firstEval.value = spinEval;
          firstEval.multiplier = mult;
        } else {
          detail.push({ grid: Array.from(grid), result: spinEval, multiplier: mult, win: step });
        }
      }

      n++;
      rung++;
      if (capped) break;

      remove.fill(0);
      for (const c of list) for (const cell of c.cells) remove[cell] = 1;
      ev.tumble(grid, remove, strips, feed);

      if (detail && n > 200) break; // guarda contra una tira patológica
    }

    return { win, rung, capped };
  }

  function play(rng: Rng, bet: number, ante = false): RoundResult {
    const grid = ev.newGrid();
    const stops = new Int32Array(game.reels);
    const feed = new Int32Array(game.reels);
    const strips = ante && game.anteStrips ? game.anteStrips : game.baseStrips;
    ev.drop(strips, rng, grid, stops, feed);
    return playFrom(rng, bet, grid, stops, feed, strips);
  }

  /** Completa la ronda desde una caída base ya hecha (lo usa la compra). */
  function playFrom(
    rng: Rng,
    bet: number,
    grid: Grid,
    stops: Int32Array,
    feed: Int32Array,
    /* Las tiras del giro base. Van como parámetro y no se toman de `game`
       porque con apuesta ante la caída inicial salió de `anteStrips`, y lo
       que rellena las cascadas TIENE que ser la misma tira: si no, el
       jugador paga por una tira con más scatters y las cascadas le devuelven
       la otra. */
    strips: ReelStrips,
    variant?: BonusVariant,
  ): RoundResult {
    const coin = bet / divisor;
    const cap = game.maxWinX * bet;

    const scatterCount = ev.countScatters(grid);
    const scatterWin =
      scatterCount < game.scatterPaytable.length
        ? (game.scatterPaytable[scatterCount] ?? 0) * bet
        : 0;
    const triggered = scatterCount >= game.scattersToTrigger;

    const gridSnapshot = Array.from(grid);
    const tumbles: TumbleRecord[] = [];
    const first: { value: SpinEval | null; multiplier: number } = { value: null, multiplier: 1 };
    const run = cascade(grid, strips, feed, coin, 0, cap - scatterWin, tumbles, first);

    const baseEval =
      first.value ?? clustersToEval(ev, [], coin, first.multiplier, scatterCount, scatterWin);
    baseEval.scatterCount = scatterCount;
    baseEval.scatterWin = scatterWin;
    if (first.value) baseEval.totalWin += scatterWin;

    let spinsAwarded = game.freeSpinsAwarded + (variant?.extraSpins ?? 0);

    const base: SpinRecord = {
      grid: gridSnapshot,
      stops: Array.from(stops),
      multiplier: first.multiplier,
      awarded: triggered ? spinsAwarded : 0,
      result: baseEval,
      ...(tumbles.length ? { tumbles } : {}),
    };

    const baseWin = scatterWin + run.win;
    const free: SpinRecord[] = [];
    let featureWin = 0;
    let capped = run.capped;

    if (triggered && !capped) {
      // La escalera arranca donde diga la variante comprada, y de ahí en más
      // NO vuelve atrás en toda la feature.
      let rung = variant?.minMultiplier ? rungFor(variant.minMultiplier) : 0;
      let remaining = spinsAwarded;
      let played = 0;

      while (remaining > 0 && played < game.maxFreeSpins && !capped) {
        remaining--;
        played++;

        const fStops = new Int32Array(game.reels);
        const fFeed = new Int32Array(game.reels);
        ev.drop(game.freeStrips, rng, grid, fStops, fFeed);

        const sc = ev.countScatters(grid);
        let awarded = 0;
        if (sc >= game.scattersToTrigger) {
          awarded = game.freeSpinsRetrigger;
          remaining += awarded;
        }

        const snap = Array.from(grid);
        const tt: TumbleRecord[] = [];
        const f0: { value: SpinEval | null; multiplier: number } = { value: null, multiplier: 1 };
        const r = cascade(
          grid, game.freeStrips, fFeed, coin, rung,
          cap - baseWin - featureWin, tt, f0,
        );
        if (game.freeCarriesLadder) rung = r.rung;
        featureWin += r.win;
        capped = r.capped;

        const evalOf = f0.value ?? clustersToEval(ev, [], coin, f0.multiplier, sc, 0);
        evalOf.scatterCount = sc;

        free.push({
          grid: snap,
          stops: Array.from(fStops),
          multiplier: f0.multiplier,
          awarded,
          result: evalOf,
          ...(tt.length ? { tumbles: tt } : {}),
        });
      }
    }

    return {
      bet,
      base,
      free,
      baseWin,
      featureWin,
      totalWin: baseWin + featureWin,
      triggered,
    };
  }

  function playFast(rng: Rng, bet: number, out: FastRound, ante = false): void {
    const coin = bet / divisor;
    const cap = game.maxWinX * bet;
    const strips = ante && game.anteStrips ? game.anteStrips : game.baseStrips;

    ev.drop(strips, rng, fastGrid, fastStops, fastFeed);
    const sc = ev.countScatters(fastGrid);
    const scatterWin =
      sc < game.scatterPaytable.length ? (game.scatterPaytable[sc] ?? 0) * bet : 0;
    const triggered = sc >= game.scattersToTrigger;

    const nada = { value: null as SpinEval | null, multiplier: 1 };
    const run = cascade(fastGrid, strips, fastFeed, coin, 0, cap - scatterWin, null, nada);
    const baseWin = scatterWin + run.win;

    let featureWin = 0;
    let played = 0;
    let capped = run.capped;

    if (triggered && !capped) {
      let rung = 0;
      let remaining = game.freeSpinsAwarded;
      while (remaining > 0 && played < game.maxFreeSpins && !capped) {
        remaining--;
        played++;
        ev.drop(game.freeStrips, rng, fastGrid, fastStops, fastFeed);
        if (ev.countScatters(fastGrid) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }
        const r = cascade(
          fastGrid, game.freeStrips, fastFeed, coin, rung,
          cap - baseWin - featureWin, null, nada,
        );
        if (game.freeCarriesLadder) rung = r.rung;
        featureWin += r.win;
        capped = r.capped;
      }
    }

    out.baseWin = baseWin;
    out.featureWin = featureWin;
    out.totalWin = baseWin + featureWin;
    out.triggered = triggered;
    out.freeSpinsPlayed = played;
    out.tier = 0;
  }

  function playBonus(rng: Rng, bet: number, variant?: BonusVariant): RoundResult {
    const grid = ev.newGrid();
    const stops = new Int32Array(game.reels);
    const feed = new Int32Array(game.reels);
    // Rechazo sobre la caída base, igual que en los otros dos motores: es la
    // distribución condicional exacta y no asigna nada por intento fallido.
    for (let i = 0; i < 10_000_000; i++) {
      ev.drop(game.baseStrips, rng, grid, stops, feed);
      if (ev.countScatters(grid) >= game.scattersToTrigger) {
        return playFrom(rng, bet, grid, stops, feed, game.baseStrips, variant);
      }
    }
    throw new Error('playBonus: no salió un disparo en 10^7 intentos — revisar las tiras');
  }

  // El evaluador de líneas no existe en este juego. La interfaz lo pide para
  // los de líneas; acá se devuelve uno vacío y nadie lo mira.
  // `evaluator` es del motor de líneas y acá no existe: este juego no tiene
  // líneas que evaluar. Por eso el contrato lo declara opcional.
  return { game, play, playFast, playBonus };
}
