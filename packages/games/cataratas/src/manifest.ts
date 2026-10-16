/**
 * Manifest de cataratas: lo que las herramientas y el cliente necesitan saber del
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
  id: 'cataratas',
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
    featureTint: 0xa8fff0,
    featureDetail: 'Cada cascada suma uno al multiplicador, y el multiplicador no vuelve atrás en toda la función.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 78,
    tagline: 'hasta 117.649 caminos · cascadas · tope 10.000×',
    nearMiss: 'un medallón más',
    freeIntro: 'cada cascada suma uno al multiplicador',
  },
  qa: QA,
  art: ART,
};
