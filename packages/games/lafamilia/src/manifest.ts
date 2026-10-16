import { createWarEngine } from './engine.ts';
import { type LinesManifest } from '@casino/math';
import { GAME } from './index.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';
export const MANIFEST: LinesManifest = {
    id: 'lafamilia',
    kind: 'lines',
    game: GAME,
    engine: () => createWarEngine(),
    measure: () => { throw new Error('Este bonus tiene estado propio: medir con tools/qa.ts; el solver genérico no lo representa.'); },
    targetRtp: tuning.TARGET_RTP,
    bonusBuyX: tuning.BONUS_BUY_X,
    shares: tuning.SHARES,
    shape: tuning.SHAPE,
    theme,
    client: {
        featureTint: 0xffd496,
        featureDetail: 'Guerra de familias: juntá balas, vencé cuatro bandas y ascendé sus símbolos a jefes. Cada victoria da giros extra; al vencer al Don, los jefes cobran cajas fuertes por fila.',
        betLevels: [20, 40, 100, 200, 400, 1000, 2000],
        cellSize: 116,
        tagline: '20 líneas · cuatro bandas · asalto a la bóveda',
        nearMiss: 'una bolsa más para iniciar la guerra',
    },
    qa: QA,
    art: ART,
};
