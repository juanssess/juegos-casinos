/**
 * Reproduce un paso de un juego de LÍNEAS (Maverick, Se Busca): gira, frena,
 * revela los wilds pegajosos si los hay, y muestra los premios.
 */

import type { SpinStep } from '@casino/protocol';

import type { ReelSet } from '../render/reels.ts';
import { TIMING } from '../render/theme.ts';
import { audio } from '../render/audio.ts';
import type { PlayContext } from './context.ts';
import { dropEvents } from './drop-events.ts';

export async function playLinesStep(ctx: PlayContext, step: SpinStep, roundBet: number): Promise<void> {
  const { cfg, hud, fx, wins, freeCounter, multLayer, session } = ctx;
  const reelSet = ctx.reelSet as ReelSet;
  wins.clear();
  ctx.holdBoard?.clear();

  if (step.kind === 'free' && step.freeIndex && step.freeTotal) {
    ctx.setFreeMode(true);
    // En un juego con pegajosos el multiplicador no es global: se muestra
    // cuántos hay en el tablero, que es lo que el jugador está mirando.
    freeCounter.text = step.mults
      ? `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ${multLayer.count} wilds`
      : `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ×${step.multiplier}`;
  }

  audio.spinStart();
  const spun = reelSet.spinTo(step.grid, dropEvents(ctx, step));
  // Si venimos salteando (fast-forward de la ronda), frenamos ya.
  if (session.skipRequested) reelSet.stopNow();
  await spun;
  audio.spinEnd();
  audio.anticipationEnd();
  hud.hideBanner();

  // Hold & Win: las monedas reciben su valor encima (no son multiplicadores).
  if (ctx.holdBoard && step.mults) ctx.holdBoard.showBaseValues(step.mults, roundBet);
  // Wilds pegajosos: los nuevos se revelan DESPUÉS de que frenan los
  // rodillos, uno por uno. Es el momento del juego — ver qué multiplicador
  // te tocó — y merece su propio tiempo, no compartirlo con el giro.
  else if (step.mults) {
    const fresh = multLayer.sync(step.mults);
    if (fresh.length > 0) {
      // El más alto manda la intensidad del golpe.
      const best = Math.max(...fresh.map((c) => step.mults![c]!));
      audio.climbUp(Math.min(6, Math.log2(best)));
      fx.shake(best >= 25 ? 9 : best >= 10 ? 6 : 3);
      if (best >= 25) fx.burst(20 + fresh.length * 8);
      await ctx.wait((TIMING.wildReveal ?? 500) * ctx.tf());
    }
  }

  // El disparo en sí es un golpe corto: la celebración de verdad viene
  // después (la Escalinata, o los pegajosos llenando el tablero).
  if (step.scatterCells.length >= cfg.scattersToTrigger && step.kind === 'base') {
    audio.freeSpins();
    fx.shake(8);
    if (ctx.profile.hold) {
      fx.announce('¡HOLD & WIN!', `${step.scatterCells.length} monedas · ${step.awarded} re-giros`, 1300);
      fx.burst(45);
      await ctx.wait(1500 * ctx.tf());
    } else if (!ctx.hasClimb) {
      fx.announce(ctx.profile.id==='lafamilia'?'¡GUERRA DE FAMILIAS!':'¡GIROS GRATIS!', ctx.profile.id==='lafamilia'?`${step.awarded} giros · balas, bandas y la bóveda`:`${step.awarded} giros · los wilds se quedan`, 1200);
      fx.burst(45);
      await ctx.wait(1500 * ctx.tf());
    } else {
      await ctx.wait(600 * ctx.tf());
    }
  }

  if (step.win > 0) {
    wins.show(step.lineWins);
    const countDur = TIMING.countUp * ctx.tf();
    hud.countTo(step.win, countDur);
    audio.countTicks(countDur);
    audio.win(step.win / roundBet);
    // El premio queda lo justo para leerse; solo los premios que valen la
    // pena (>2x) retienen la pantalla un poco más.
    const x = step.win / roundBet;
    const extra = x > 2 ? Math.min(3, x / 10) * 550 : 0;
    await ctx.wait((countDur + 220 + extra) * (session.turbo ? 0.7 : 1));
    wins.clear();
  } else {
    await ctx.wait(110);
  }
}
