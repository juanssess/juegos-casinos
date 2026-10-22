/**
 * Manifest de milonga: lo que las herramientas y el cliente necesitan saber del
 * juego. Se descubre solo (ver `@casino/math` → manifest.ts); no hay registro
 * que tocar a mano.
 */

import { createClusterEngine, measureCluster, type GameManifest } from '@casino/math';
import { GAME } from './index.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'milonga',
  kind: 'cluster',
  game: GAME,
  engine: () => createClusterEngine(GAME),
  measure: (opts) => measureCluster(GAME, opts),
  targetRtp: tuning.TARGET_RTP,
  bonusBuyX: tuning.BONUS_BUY_X,
  shares: tuning.SHARES,
  shape: tuning.SHAPE,
  theme,
  client: {
    featureTint: 0xffc2b0,
    featureDetail: 'Cada cascada sube la escalera, de ×1 a ×100, y en la función no vuelve atrás.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 86,
    tagline: 'racimos de 5 · cascadas · escalera hasta ×100 · tope 10.000×',
    nearMiss: 'un disco más',
    freeIntro: 'la escalera no vuelve atrás',
  },
  qa: QA,
  art: ART,
};
