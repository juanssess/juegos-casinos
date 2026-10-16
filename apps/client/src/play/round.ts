/**
 * Reproduce una RONDA entera: el giro base, la Escalinata si la hay, los
 * giros gratis y la celebración. Cada paso lo anima la mecánica que le toca
 * (líneas o racimos); acá solo se encadenan y se avisa a la presentación
 * cuándo empieza y termina la función.
 */

import type { ClimbDto, RgsClient, SpinStep } from '@casino/protocol';

import { TIMING } from '../render/theme.ts';
import { audio } from '../render/audio.ts';
import type { PlayContext } from './context.ts';
import { playClusterStep } from './step-cluster.ts';
import { playLinesStep } from './step-lines.ts';
import { playHoldStep } from './step-hold.ts';

/** `prior` es lo ya ganado en la ronda antes de este paso (el cobro del Hold & Win cuenta desde ahí). */
export function playStep(ctx: PlayContext, step: SpinStep, roundBet: number, prior = 0): Promise<void> {
  if (ctx.profile.hold && step.hold) return playHoldStep(ctx, step, roundBet, prior);
  return ctx.profile.cluster ? playClusterStep(ctx, step, roundBet) : playLinesStep(ctx, step, roundBet);
}

export async function playRound(
  ctx: PlayContext,
  rgs: RgsClient,
  steps: SpinStep[],
  roundBet: number,
  roundId: string,
  from: number,
  climb?: ClimbDto,
): Promise<void> {
  const { cfg, hud, fx, multLayer, presentation, profile, session } = ctx;
  let running = 0;
  // Los pegajosos son estado de la FEATURE, no del giro: se limpian al
  // empezar la ronda y no antes de cada giro.
  multLayer.clear();
  session.accum = 0;
  /* El contador "GIROS GRATIS 3/15" muestra los giros CONOCIDOS hasta ese
     giro: los que dio el disparo más los retriggers que ya salieron. El total
     de la ronda los incluye a todos, y mostrarlo desde el primer giro es
     contar el final antes de jugarlo. */
  let known = 0;
  steps = steps.map((s) => {
    if (s.kind === 'base') {
      known = s.awarded;
      return s;
    }
    const shown = known > 0 ? { ...s, freeTotal: known } : s;
    known += s.awarded;
    return shown;
  });
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]!;
    const prior = running;
    running += step.win;
    if (i <= from) continue; // ya visto antes de recargar la página

    // El primer giro gratis que se ve abre la función.
    if (step.kind === 'free' && (i === 0 || steps[i - 1]!.kind !== 'free' || i === from + 1)) {
      /* Se anuncian los giros que OTORGÓ el disparo, no cuántos va a haber:
         el total de la ronda ya incluye los retriggers que todavía no
         salieron, y anunciarlo es contar el final antes de jugarlo. En Hold &
         Win, los re-giros de la regla. */
      const trigger = steps.slice(0, i).reverse().find((s) => s.kind === 'base');
      const spins = profile.hold ? profile.hold.respins : trigger?.awarded || step.freeTotal || 1;
      if (await presentation.featureIntro(profile, spins)) session.skipRequested = false;
      presentation.featureStart(profile);
    }

    await playStep(ctx, step, roundBet, prior);

    // Tras el giro que disparó viene la Escalinata: el bonus se gana dos
    // veces — primero el disparo, después la escalada.
    if (i === 0 && climb && steps.length > 1 && !session.skipRequested) {
      await ctx.climbScene.play(climb, cfg.climbTiers, ctx.wait, {
        drum: () => audio.drum(),
        up: (t) => audio.climbUp(t),
        stop: () => audio.climbStop(),
        top: () => audio.climbTop(),
      });
      const atTop = climb.tier === cfg.climbTiers.length;
      fx.announce(
        `${climb.spins} GIROS ×${climb.multiplier}`,
        atTop ? 'la Cámara del Sol' : `nivel ${climb.tier} de la Escalinata`,
        1100,
      );
      fx.burst(25 + climb.tier * 18);
      if (atTop) fx.shake(10);
      await ctx.wait(900 * ctx.tf());
    }

    hud.countTo(running, 400);
    if (i > 0) await ctx.wait(TIMING.freeSpinGap * ctx.tf());
    await rgs.acknowledge(roundId, i);
  }
  hud.hideBanner();

  const freeSteps = steps.filter((s) => s.kind === 'free');
  if (freeSteps.length && from < steps.length - 1) {
    await presentation.featureSummary(profile, freeSteps.length, freeSteps.reduce((sum, s) => sum + s.win, 0));
  }
  presentation.featureEnd();
  ctx.setFreeMode(false);
  multLayer.clear();
  ctx.holdBoard?.clear();
  ctx.layout();
}

/** Celebración proporcional al premio. Si todo se celebra igual, nada se celebra. */
export function celebrate(ctx: PlayContext, totalWin: number, roundBet: number): void {
  const { fx } = ctx;
  const x = totalWin / roundBet;
  if (x >= 100) {
    fx.announce('¡PREMIO ÉPICO!', `${x.toFixed(0)}× la apuesta`, 2000);
    fx.burst(120);
    fx.shake(14);
    audio.bigWin(3);
  } else if (x >= 40) {
    fx.announce('¡PREMIO GIGANTE!', `${x.toFixed(0)}× la apuesta`, 1600);
    fx.burst(80);
    fx.shake(10);
    audio.bigWin(2);
  } else if (x >= 15) {
    fx.announce('¡GRAN PREMIO!', `${x.toFixed(1)}× la apuesta`, 1300);
    fx.burst(50);
    fx.shake(7);
    audio.bigWin(1);
  }
}
