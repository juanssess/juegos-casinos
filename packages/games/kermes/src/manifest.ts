/**
 * Manifest de La Kermés, el Plinko. Se descubre solo (ver `@casino/math` →
 * manifest.ts): herramientas, QA y cliente lo encuentran sin registro.
 */

import type { GameManifest } from '@casino/math';
import { DEF } from './index.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'kermes',
  kind: 'original',
  def: DEF,
  theme,
  targetRtp: DEF.rtp,
  client: {
    betLevels: [10, 20, 50, 100, 250, 500, 1000],
    tagline: '8, 12 o 16 filas · tres riesgos · hasta 1.000×',
    featureTint: 0xfff0b0,
    featureDetail: 'La bolita cae entre los clavos. Con riesgo alto, las puntas pagan hasta 1.000×.',
  },
  qa: QA,
  art: ART,
};
