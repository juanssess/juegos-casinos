/**
 * Manifest de El Gran Premio: lo que las herramientas y el cliente necesitan saber del
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
  id: 'granpremio',
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
    featureTint: 0xffc98a,
    featureDetail: 'Cada cascada sube la marcha: suma uno al multiplicador, y el multiplicador no vuelve atrás en toda la función.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 78,
    tagline: 'hasta 117.649 caminos · cascadas · tope 5.000×',
    nearMiss: 'una medalla más',
    freeIntro: 'cada cascada sube la marcha (+1)',
  },
  qa: QA,
  art: ART,
};
