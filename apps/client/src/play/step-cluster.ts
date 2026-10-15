/**
 * Reproduce un paso de un juego de RACIMOS (La Vendimia, El Kiosco).
 *
 * La diferencia con un slot de líneas no es de animación: es de ESTRUCTURA.
 * Un giro de líneas tiene un resultado y se muestra. Una jugada de racimos
 * tiene una CADENA —caída, premio, explosión, caída, premio— y cada eslabón
 * puede valer más que el anterior porque la escalera del multiplicador subió.
 *
 * Todo eso ya vino resuelto del servidor: `step.grid` es la caída inicial y
 * `step.tumbles` son las cascadas, en orden. Acá no se decide nada, se
 * averigua qué celda va a dónde para poder animar el movimiento en vez de
 * reemplazar la grilla de golpe.
 */

import type { SpinStep } from '@casino/protocol';

import type { ClusterBoard } from '../render/cluster-board.ts';
import { TIMING } from '../render/theme.ts';
import { audio } from '../render/audio.ts';
import type { PlayContext } from './context.ts';
import { dropEvents } from './drop-events.ts';

export async function playClusterStep(ctx: PlayContext, step: SpinStep, roundBet: number): Promise<void> {
  const { cfg, hud, fx, wins, cascadaBadge, freeCounter, profile, session } = ctx;
  const tablero = ctx.reelSet as ClusterBoard;
  ctx.trace({ k: step.kind, i: step.freeIndex ?? 0, c: (step.tumbles ?? []).length, t: Math.round(session.simTime) });
  wins.clear();
  cascadaBadge.visible = false;

  if (step.kind === 'free' && step.freeIndex && step.freeTotal) {
    ctx.setFreeMode(true);
    freeCounter.text = `GIROS GRATIS ${step.freeIndex}/${step.freeTotal}`;
  }

  audio.spinStart();
  const caida = tablero.spinTo(step.grid, dropEvents(ctx, step), step.mults);
  if (session.skipRequested) tablero.stopNow();
  await caida;
  audio.spinEnd();
  audio.anticipationEnd();
  hud.hideBanner();

  if (step.scatterCells.length >= cfg.scattersToTrigger && step.kind === 'base') {
    audio.freeSpins();
    fx.shake(8);
    fx.announce('¡GIROS GRATIS!', `${step.awarded} giros · ${profile.freeIntro ?? 'la escalera no vuelve atrás'}`, 1100);
    fx.burst(45);
    await ctx.wait(1300 * ctx.tf());
  }

  /* La cadena completa: la caída inicial es la etapa 0 y cada cascada es
     una más. La última que manda el servidor no paga nada — es la grilla
     ya asentada— y está justamente para que la jugada termine de verse. */
  const etapas: { grid: number[]; wins: typeof step.lineWins; multiplier: number; mults?: number[] | undefined }[] = [
    { grid: step.grid, wins: step.lineWins, multiplier: step.multiplier, mults: step.mults },
    ...(step.tumbles ?? []).map((t) => ({ grid: t.grid, wins: t.wins, multiplier: t.multiplier, mults: t.mults })),
  ];

  let acumulado = step.scatterWin;
  if (step.scatterWin > 0) hud.countTo(acumulado, 260 * ctx.tf());

  for (let i = 0; i < etapas.length; i++) {
    const e = etapas[i]!;

    if (i > 0) {
      const anteriores = etapas[i - 1]!.wins;
      const celdas: number[] = [];
      for (const w of anteriores) for (const c of w.cells) celdas.push(c);
      // El golpe de la explosión sube de tono con cada cascada: es la
      // señal más barata de que la escalera está subiendo.
      audio.scatterHit(Math.min(6, i));
      if (i >= 4) fx.shake(Math.min(9, i));
      await tablero.tumbleTo(celdas, e.grid, e.mults);
    }

    if (e.wins.length === 0) {
      cascadaBadge.visible = false;
      continue;
    }

    cascadaBadge.text = `×${e.multiplier}`;
    cascadaBadge.visible = e.multiplier > 1;

    let sub = 0;
    for (const w of e.wins) sub += w.amount;
    acumulado += sub;

    wins.show(e.wins);
    /* Los tiempos de una cascada tienen que ser CORTOS. Una jugada puede
       tener seis eslabones, y lo que en un slot de líneas es una pausa
       cómoda, acá multiplicado por seis es una jugada eterna. Solo el
       premio que vale la pena (>2× la apuesta) se queda un rato más. */
    const x = sub / roundBet;
    const dur = Math.min(TIMING.countUp, 150 + x * 45) * ctx.tf();
    hud.countTo(acumulado, dur);
    audio.countTicks(dur);
    audio.win(x);
    const extra = x > 2 ? Math.min(2, x / 12) * 380 : 0;
    await ctx.wait((dur + 90 + extra) * (session.turbo ? 0.7 : 1));
    wins.clear();
  }

  /* LAS BOMBAS, al final de la secuencia.
     Es el momento del juego: la cadena ya terminó, el premio está a la
     vista, y ahora se suma lo que haya en la grilla. Va en tres tiempos
     —las bombas laten juntas, aparece la suma, el premio salta— porque
     mostrarlo de golpe es regalar el único suspenso que tiene la jugada. */
  if (step.bombWin && step.bombMult) {
    const m = step.bombMult;
    tablero.pulseValues(900 * ctx.tf());
    audio.climbUp(Math.min(6, Math.log2(m)));
    fx.shake(m >= 100 ? 12 : m >= 25 ? 8 : 4);
    fx.announce(`×${m}`, 'las bombas multiplican el premio', 1000);
    if (m >= 25) fx.burst(Math.min(110, 30 + m / 4));
    await ctx.wait(900 * ctx.tf());

    acumulado += step.bombWin;
    const x = acumulado / roundBet;
    const dur = Math.min(1600, 450 + x * 12) * ctx.tf();
    hud.countTo(acumulado, dur);
    audio.countTicks(dur);
    audio.win(x);
    await ctx.wait((dur + 300) * (session.turbo ? 0.7 : 1));
  }

  cascadaBadge.visible = false;
}
