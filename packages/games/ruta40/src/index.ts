/**
 * ruta40 — "Ruta 40", el Crash de la casa.
 *
 * Un camión de rally sale por la Ruta 40 y el multiplicador sube con cada
 * kilómetro, hasta que el motor se funde. El jugador se retira cuando
 * quiere —o deja un retiro automático— y cobra el multiplicador de ese
 * momento. Si el motor se funde antes, pierde la apuesta.
 *
 * La matemática está en `@casino/math` → originals.ts: el punto de quiebre
 * sale de un solo sorteo y el retorno es el 97 % para CUALQUIER retiro.
 */

import type { CrashDef } from '@casino/math';

export const DEF: CrashDef = {
  kind: 'crash',
  id: 'ruta40',
  rtp: 0.97,
  // El kilómetro más lejano posible: 10.000×. Es también el retiro más alto.
  maxMult: 10_000,
  minCashout: 1.01,
};
