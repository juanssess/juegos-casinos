/**
 * Manifest de Ruta 40, el Crash. Se descubre solo (ver `@casino/math` →
 * manifest.ts): herramientas, QA y cliente lo encuentran sin registro.
 */

import type { GameManifest } from '@casino/math';
import { DEF } from './index.ts';
import * as theme from './theme.ts';
import { QA } from './qa.ts';
import { ART } from './art.ts';

export const MANIFEST: GameManifest = {
  id: 'ruta40',
  kind: 'original',
  def: DEF,
  theme,
  targetRtp: DEF.rtp,
  client: {
    betLevels: [10, 20, 50, 100, 250, 500, 1000],
    tagline: 'retirate antes de que se funda el motor · hasta 10.000×',
    featureTint: 0xffc890,
    featureDetail: 'El multiplicador sube con cada kilómetro. Retirate antes de que se funda el motor.',
  },
  qa: QA,
  art: ART,
};
