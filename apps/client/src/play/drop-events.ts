/**
 * Los eventos de la caída o el giro: sonido de frenada por columna,
 * campanita de scatter subiendo de tono, y el cartel de expectativa. Son
 * idénticos en todas las mecánicas, así que viven en un solo lugar.
 */

import type { SpinStep } from '@casino/protocol';

import { audio } from '../render/audio.ts';
import type { PlayContext } from './context.ts';

export function dropEvents(ctx: PlayContext, step: SpinStep): {
  onReelStop: (r: number, ant: boolean) => void;
  onAnticipation: () => void;
} {
  const { cfg, hud, profile } = ctx;
  const conScatter: boolean[] = new Array(cfg.reels).fill(false);
  for (const cell of step.scatterCells) conScatter[Math.floor(cell / cfg.rows)] = true;
  let cayeron = 0;
  return {
    onReelStop: (r, anticipated) => {
      audio.reelStop();
      if (anticipated) {
        audio.anticipationEnd();
        hud.hideBanner();
      }
      if (conScatter[r]) {
        cayeron++;
        audio.scatterHit(cayeron);
      }
    },
    onAnticipation: () => {
      audio.anticipationStart();
      hud.showBanner('¡CASI!', profile.nearMiss ?? (ctx.hasClimb ? 'un templo más' : 'un cartucho más'));
    },
  };
}
