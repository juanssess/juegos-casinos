/**
 * La presentación de base: la que usa el juego suelto, y sobre la que el
 * casino agrega lo suyo (MCCinema, la atmósfera de Maverick).
 *
 * Vive aparte de `presentation.ts` porque ese es el archivo que el casino
 * reemplaza: su versión importa esta y la extiende, en vez de copiarla.
 *
 * El fondo es la escena pintada del juego si la tiene (`art/scene.jpg`): se
 * recorta para cubrir la pantalla sin deformarse, queda un poco apagada para
 * que el tablero mande, y en la función se ilumina y vira al tinte del juego.
 * Un juego sin arte pintado usa su escenografía procedural.
 */

import { Assets, Sprite, Texture } from 'pixi.js';

import type { ClientGame } from './games.ts';
import type { Presentation, Scenery } from './presentation-types.ts';
import { PALETTE } from './render/theme.ts';

/** Cuánto se apaga la escena fuera de la función. */
const DIM = 0.83;

function proceduralScenery(profile: ClientGame): Scenery {
  return {
    layout(bg, w, h) {
      bg.rect(0, 0, w, h).fill(PALETTE.bgBottom);
      profile.backdrop(bg, w, h);
    },
    setFree() {},
  };
}

/** La escena pintada, como sprite debajo de todo. Expone el sprite para quien la extienda. */
export function paintedScenery(app: { stage: { addChild(s: Sprite): unknown } }, profile: ClientGame): Scenery & { sprite: Sprite } {
  const sprite = new Sprite(Texture.from(profile.art!.sceneUrl));
  sprite.alpha = DIM;
  app.stage.addChild(sprite);
  return {
    sprite,
    layout(_bg, w, h) {
      // Cubre la pantalla sin deformar: la escena se recorta, no se estira.
      const s = Math.max(w / sprite.texture.width, h / sprite.texture.height);
      sprite.scale.set(s);
      sprite.position.set((w - sprite.width) / 2, (h - sprite.height) / 2);
    },
    setFree(free) {
      // El fondo se ilumina en la función; el tablero conserva su contraste.
      sprite.alpha = free ? 1 : DIM;
      sprite.tint = free ? (profile.featureTint ?? 0xffffff) : 0xffffff;
    },
  };
}

export function createBasePresentation(profile: ClientGame): Presentation {
  return {
    antialias: profile.art !== null,
    async preload() {
      if (profile.art) await Assets.load([profile.art.sceneUrl, profile.art.symbolsUrl]);
    },
    scenery(app, p) {
      return p.art ? paintedScenery(app, p) : proceduralScenery(p);
    },
    async featureIntro() {
      return false;
    },
    featureStart() {},
    async featureSummary() {},
    featureEnd() {},
  };
}
