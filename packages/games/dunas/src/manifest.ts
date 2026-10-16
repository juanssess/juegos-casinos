/**
 * Manifest de Las Dunas (modelo sebusca): lo que las herramientas y el cliente necesitan saber del
 * juego. Se descubre solo (ver `@casino/math` → manifest.ts); no hay registro
 * que tocar a mano.
 */

import type { GameManifest } from '@casino/math';
import { GAME } from './index.ts';
import { createSebuscaEngine } from './engine.ts';
import { measureSebusca } from './measure.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'dunas',
  kind: 'lines',
  game: GAME,
  engine: () => createSebuscaEngine(GAME),
  measure: (opts) => measureSebusca(GAME, opts),
  targetRtp: tuning.TARGET_RTP,
  bonusBuyX: tuning.BONUS_BUY_X,
  shares: tuning.SHARES,
  shape: tuning.SHAPE,
  theme,
  client: {
    featureTint: 0xffc89a,
    featureDetail: 'Los pilotos que caen se plantan hasta el final de la travesía.',
    betLevels: [15, 30, 75, 150, 300, 750, 1500],
    cellSize: 92,
    tagline: '15 líneas · pilotos pegajosos · tope 5.000×',
  },
  qa: QA,
  art: ART,
};
