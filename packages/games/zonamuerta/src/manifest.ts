import { createHuntEngine } from './engine.ts';
import { type ClusterManifest } from '@casino/math';
import { GAME } from './index.ts';
import * as tuning from './tuning.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';
export const MANIFEST: ClusterManifest = {
    id: 'zonamuerta',
    kind: 'cluster',
    game: GAME,
    engine: () => createHuntEngine(),
    measure: () => { throw new Error('Este bonus tiene estado propio: medir con tools/qa.ts; el solver genérico no lo representa.'); },
    targetRtp: tuning.TARGET_RTP,
    bonusBuyX: tuning.BONUS_BUY_X,
    shares: tuning.SHARES,
    shape: tuning.SHAPE,
    theme,
    client: {
        valueColor: (v) => v >= 10 ? 0xffdf96 : 0xff7770,
        featureTint: 0xff5266,
        featureDetail: 'La cacería: dos wilds infectados persiguen radios, se mueven y aumentan su potencia. En el bonus cada grupo paga una vez; potencia ×3.',
        betLevels: [20, 40, 100, 200, 400, 1000, 2000],
        cellSize: 86,
        tagline: '5 conectados · cascadas base · la cacería',
        nearMiss: 'una radio más para pedir rescate',
        freeIntro: 'dos infectados persistentes · las radios aumentan su potencia',
    },
    qa: QA,
    art: ART,
};
