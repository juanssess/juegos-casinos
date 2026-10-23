/**
 * Manifest de aconcagua: lo que las herramientas y el cliente necesitan saber del
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
  id: 'aconcagua',
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
    featureTint: 0xffd8b8,
    featureDetail: 'El Ascenso: el campamento al que llegás decide los giros gratis y su multiplicador.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 116,
    tagline: '20 líneas · El Ascenso · el más parejo del salón',
    nearMiss: 'una bandera más',
    climbName: 'El Ascenso',
    climbTop: 'la Cumbre',
  },
  qa: QA,
  art: ART,
};
