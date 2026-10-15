/**
 * Manifest de feria: lo que las herramientas y el cliente necesitan saber del
 * juego. Se descubre solo (ver `@casino/math` → manifest.ts).
 */

import { Sfc32Rng, createHoldWinEngine, holdWinFixedRtp, measure, type GameManifest } from '@casino/math';
import { GAME } from './index.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'feria',
  kind: 'lines',
  game: GAME,
  engine: () => createHoldWinEngine(GAME),
  /* El solver ve las líneas como en cualquier juego y la función como un
     pago FIJO: las monedas valen lo que valen, no se escalan con la tabla. */
  measure: (opts) => ({
    ...measure(GAME, opts),
    fixedRtp: holdWinFixedRtp(GAME, opts.rounds, new Sfc32Rng((opts.seed ?? 0xbeef) ^ 0x401d)),
  }),
  targetRtp: tuning.TARGET_RTP,
  bonusBuyX: tuning.BONUS_BUY_X,
  shares: tuning.SHARES,
  shape: tuning.SHAPE,
  theme,
  client: {
    featureTint: 0xffe2a8,
    featureDetail: 'Las monedas se quedan: cada una nueva vuelve los re-giros a tres.',
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    cellSize: 116,
    tagline: '20 líneas · Hold & Win · llenar la pantalla paga 5.000×',
    nearMiss: 'una moneda más',
    valueColor: theme.coinColor,
  },
  qa: QA,
  art: ART,
};
