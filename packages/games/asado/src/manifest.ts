/**
 * Manifest de asado: lo que las herramientas y el cliente necesitan saber del
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
  id: 'asado',
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
    featureTint: 0xffc8a0,
    featureDetail: 'Las brasas multiplican cada caída que paga: suman su valor al final.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 86,
    tagline: '8 iguales en cualquier lado · brasas de hasta ×50 · tope 2.500×',
    nearMiss: 'una parrilla más',
    freeIntro: 'las brasas multiplican',
    valueColor: theme.bombColor,
  },
  qa: QA,
  art: ART,
};
