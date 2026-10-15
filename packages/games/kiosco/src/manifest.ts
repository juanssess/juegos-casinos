/**
 * Manifest de kiosco: lo que las herramientas y el cliente necesitan saber del
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
  id: 'kiosco',
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
    featureTint: 0xffc8e6,
    featureDetail: 'Las bombas multiplican cada caída que paga.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 86,
    tagline: '8 iguales en cualquier lado · bombas de hasta ×500 · tope 10.000×',
    nearMiss: 'un chupetín más',
    freeIntro: 'las bombas de caramelo multiplican',
    valueColor: theme.bombColor,
  },
  qa: QA,
  art: ART,
};
