/**
 * Manifest de classic20: lo que las herramientas y el cliente necesitan saber del
 * juego. Se descubre solo (ver `@casino/math` → manifest.ts); no hay registro
 * que tocar a mano.
 */

import { createRoundEngine, measure, type GameManifest } from '@casino/math';
import { GAME } from './index.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'classic20',
  kind: 'lines',
  game: GAME,
  engine: () => createRoundEngine(GAME),
  measure: (opts) => measure(GAME, opts),
  targetRtp: tuning.TARGET_RTP,
  bonusBuyX: tuning.BONUS_BUY_X,
  shares: tuning.SHARES,
  shape: tuning.SHAPE,
  theme,
  client: {
    featureTint: 0xa9ffe0,
    featureDetail: 'La Escalinata decidió tu bonus.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 116,
    tagline: '20 líneas · La Escalinata',
  },
  qa: QA,
  art: ART,
};
