/**
 * Medición de frecuencias de Se Busca, para el solver de la paytable.
 *
 * La gracia: aunque los wilds multipliquen, el RTP sigue siendo lineal en
 * los premios — el producto de multiplicadores de cada línea entra como PESO
 * del conteo (`tallyLineWins(..., weight, mults)`), no como premio. Así el
 * mismo `solveByTargets` de siempre resuelve la paytable sin enterarse de
 * que existen wilds ×100.
 *
 * ORDEN DE SORTEOS: idéntico a engine.ts. La validación cruzada del test
 * compara esta medición contra el simulador con la misma semilla; si alguien
 * toca un lado y no el otro, el test lo delata.
 */

import { SYM, Sfc32Rng, createEvaluator, type FreqReport, type Rng } from '@casino/math';
import type { SebuscaDef } from './index.ts';

export function measureSebusca(
  game: SebuscaDef,
  opts: { rounds: number; seed?: number; rng?: Rng },
): FreqReport {
  const rng = opts.rng ?? new Sfc32Rng(opts.seed ?? 0xbeef);
  const ev = createEvaluator(game);
  const cells = game.reels * game.rows;
  const grid = ev.newGrid();
  const mults = new Float64Array(cells);
  const sticky = new Float64Array(cells);
  const stride = ev.tallyStride;

  // Tabla acumulada del sorteo, igual que en el motor.
  const multCum: { upTo: number; mult: number }[] = [];
  {
    let acc = 0;
    for (const w of game.wildMultsFree) {
      acc += w.perMil;
      multCum.push({ upTo: acc, mult: w.mult });
    }
  }
  function drawMult(): number {
    const r = rng.nextInt(1000);
    for (const e of multCum) if (r < e.upTo) return e.mult;
    return multCum[multCum.length - 1]!.mult;
  }

  const base = new Float64Array(16 * stride);
  const free = new Float64Array(16 * stride);
  const scatter = new Float64Array(cells + 1);

  let triggers = 0;
  let freeSpinsPlayed = 0;
  const t0 = performance.now();

  for (let i = 0; i < opts.rounds; i++) {
    ev.spin(game.baseStrips, rng, grid);
    ev.tallyLineWins(grid, base);
    const sc = ev.countScatters(grid);
    scatter[sc] = (scatter[sc] ?? 0) + 1;

    if (sc >= game.scattersToTrigger) {
      triggers++;
      sticky.fill(0);
      let remaining = game.freeSpinsAwarded;
      let played = 0;

      // OJO: la medición ignora el tope de 10.000× a propósito. El tope
      // depende de la PAYTABLE (que es justo lo que estamos por resolver),
      // así que acá se mide el juego sin tope y el simulador final reporta
      // cuánto RTP recorta. Con tope en 10.000× el recorte es ínfimo.
      while (remaining > 0 && played < game.maxFreeSpins) {
        remaining--;
        played++;
        ev.spin(game.freeStrips, rng, grid);
        mults.fill(1);
        for (let c = 0; c < cells; c++) {
          if (sticky[c]! > 0) {
            grid[c] = SYM.WILD;
            mults[c] = sticky[c]!;
          } else if (grid[c] === SYM.WILD) {
            const m = drawMult();
            sticky[c] = m;
            mults[c] = m;
          }
        }
        ev.tallyLineWins(grid, free, 1, mults);
        if (ev.countScatters(grid) >= game.scattersToTrigger) {
          remaining += game.freeSpinsRetrigger;
        }
      }
      freeSpinsPlayed += played;
    }
  }

  return {
    gameId: game.id,
    rounds: opts.rounds,
    lineCount: game.paylines.length,
    stride,
    base,
    free,
    scatter,
    triggers,
    freeSpinsPlayed,
    elapsedMs: performance.now() - t0,
  };
}
