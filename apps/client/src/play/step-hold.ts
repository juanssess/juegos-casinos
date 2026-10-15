/**
 * Reproduce un RE-GIRO del Hold & Win.
 *
 * Cada paso de la función es un re-giro ya resuelto: qué celdas recibieron
 * moneda (`hold.fresh`), cuántos re-giros quedan (`hold.left`) y, en el
 * último, lo cobrado. El ritmo es el del género: las celdas vacías giran, las
 * monedas nuevas caen con un golpe, el contador vuelve a tres; y al final el
 * cobro recorre moneda por moneda, con los jackpots anunciados por su nombre.
 */

import type { SpinStep } from '@casino/protocol';

import { audio } from '../render/audio.ts';
import type { PlayContext } from './context.ts';

export async function playHoldStep(ctx: PlayContext, step: SpinStep, roundBet: number, prior: number): Promise<void> {
  const board = ctx.holdBoard!;
  const rules = ctx.profile.hold!;
  const { hud, fx, freeCounter } = ctx;
  const hold = step.hold!;
  const values = step.mults ?? [];

  // El primer re-giro abre el tablero con las monedas que dispararon.
  if (step.freeIndex === 1) {
    ctx.setFreeMode(true);
    const fresh = new Set(hold.fresh);
    board.begin(values.map((v, i) => (fresh.has(i) ? 0 : v)), roundBet);
    board.left = rules.respins;
    freeCounter.text = `RE-GIROS ${board.left}`;
    await ctx.wait(500 * ctx.tf());
  }

  // Giran los huecos.
  freeCounter.text = `RE-GIROS ${board.left}`;
  audio.spinStart();
  board.spinEmpty(750 * ctx.tf());
  await ctx.wait(750 * ctx.tf());
  audio.spinEnd();

  // Caen las monedas nuevas, de a una, con un golpe cada una.
  if (hold.fresh.length) {
    for (const [k, cell] of hold.fresh.entries()) {
      board.land([cell], values, roundBet);
      audio.scatterHit(Math.min(6, k + 1));
      fx.shake(2 + Math.min(4, k));
      if (k < hold.fresh.length - 1) await ctx.wait(160 * ctx.tf());
    }
    // Volvieron a tres: es la buena noticia del re-giro y se tiene que ver.
    if (hold.left === rules.respins && !board.full) fx.announce(`${rules.respins}`, 're-giros otra vez', 500);
  } else {
    board.land([], values, roundBet);
    audio.reelStop();
  }
  board.left = hold.left;
  freeCounter.text = `RE-GIROS ${board.left}`;
  await ctx.wait(380 * ctx.tf());

  if (hold.collect === undefined) return;

  // ── El cobro ──
  freeCounter.text = board.full ? '¡PANTALLA LLENA!' : 'COBRANDO';
  await ctx.wait(400 * ctx.tf());
  const j = rules.jackpots;
  let acc = 0;
  for (const cell of board.coins) {
    const v = board.flash(cell);
    acc += v * roundBet;
    hud.countTo(prior + Math.min(acc, hold.collect), 140 * ctx.tf());
    audio.countTicks(120 * ctx.tf());
    if (v >= j.mini) {
      const name = v >= j.major ? 'MAJOR' : v >= j.minor ? 'MINOR' : 'MINI';
      fx.announce(name, `${(v * roundBet).toLocaleString('es-AR')} créditos`, 700);
      fx.burst(v >= j.major ? 60 : 25);
      audio.bigWin(v >= j.major ? 2 : 1);
      await ctx.wait(1000 * ctx.tf());
    } else {
      await ctx.wait(150 * ctx.tf());
    }
  }

  // Pantalla llena: el Grand, que es el tope del juego.
  if (hold.grand) {
    fx.announce('¡GRAND!', `${(hold.grand / roundBet).toLocaleString('es-AR')}× la apuesta`, 1800);
    fx.burst(140);
    fx.shake(12);
    audio.bigWin(3);
    await ctx.wait(2000 * ctx.tf());
  }
  hud.countTo(prior + hold.collect, 500 * ctx.tf());
  await ctx.wait(700 * ctx.tf());
  board.clear();
}
