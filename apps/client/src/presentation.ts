/**
 * La capa de PRESENTACIÓN: lo que rodea al juego sin ser el juego.
 *
 * El fondo, la pantalla de entrada a la función, el resumen del bonus. Es lo
 * que más cambia según dónde corra el juego: suelto, dibuja la escenografía
 * procedural del skin; dentro del casino, usa el arte pintado y las pantallas
 * de MCCinema.
 *
 * Antes la versión del casino se aplicaba REESCRIBIENDO `main.ts` en trece
 * lugares por coincidencia de texto: cualquier cambio de una coma en el
 * orquestador rompía la compilación del casino. Ahora el contrato es este
 * archivo: el casino reemplaza el módulo entero por el suyo
 * (`Casino (PRUEBA)/tools/provider/presentation.ts`) y tiene que exportar
 * lo mismo: `createPresentation()`, que cumple `presentation-types.ts`. `main.ts` no sabe cuál de los dos le tocó.
 *
 * Reglas de la interfaz:
 *  - Nada acá decide un resultado, cobra o paga. Solo muestra.
 *  - Las esperas (`featureIntro`, `featureSummary`) son del jugador: el
 *    orquestador las espera y sigue.
 */

import { PALETTE } from './render/theme.ts';
import type { Presentation } from './presentation-types.ts';

export type { Presentation, Scenery } from './presentation-types.ts';

/** La presentación del juego suelto: escenografía procedural y nada más. */
export function createPresentation(): Presentation {
  return {
    antialias: false,
    async preload() {},
    scenery(_app, profile) {
      return {
        layout(bg, w, h) {
          bg.rect(0, 0, w, h).fill(PALETTE.bgBottom);
          profile.backdrop(bg, w, h);
        },
        setFree() {},
      };
    },
    async featureIntro() {
      return false;
    },
    featureStart() {},
    async featureSummary() {},
    featureEnd() {},
  };
}
