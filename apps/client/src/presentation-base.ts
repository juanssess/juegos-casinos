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

import { Assets, Sprite, Texture, type Application } from 'pixi.js';
import { mountStoryScene, preloadStoryScene } from './scenes/noir-survival.ts';
import { mountWaterfalls } from './scenes/waterfalls.ts';
import { mountAmbient } from './scenes/ambient.ts';

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
export function paintedScenery(app: Application, profile: ClientGame): Scenery & { sprite: Sprite } {
  const sprite = new Sprite(Texture.from(profile.art!.sceneUrl));
  sprite.alpha = DIM;
  app.stage.addChild(sprite);
  const story = mountStoryScene(app, profile.id, sprite);
  // Agua que cae sobre la pintura (Las Cataratas); null en los demás juegos.
  const water = mountWaterfalls(app, profile.id, sprite);
  // Arena, polvo y motas en el aire (Las Dunas, El Gran Premio).
  const ambient = mountAmbient(app, profile.id, sprite);
  return {
    sprite,
    layout(_bg, w, h) {
      // Cubre la pantalla sin deformar: la escena se recorta, no se estira.
      const s = Math.max(w / sprite.texture.width, h / sprite.texture.height) * (story ? 1.025 : 1);
      sprite.scale.set(s);
      sprite.position.set((w - sprite.width) / 2, (h - sprite.height) / 2);
      story?.layout(w, h);
      water?.layout();
      ambient?.layout();
    },
    setFree(free) {
      // El fondo se ilumina en la función; el tablero conserva su contraste.
      sprite.alpha = free ? 1 : DIM;
      sprite.tint = free ? (profile.featureTint ?? 0xffffff) : 0xffffff;
      story?.setFree(free);
      water?.setFree(free);
      ambient?.setFree(free);
    },
  };
}

export function createBasePresentation(profile: ClientGame): Presentation {
  return {
    antialias: profile.art !== null,
    async preload() {
      if (profile.art) await Assets.load([profile.art.sceneUrl, profile.art.symbolsUrl]);
      await preloadStoryScene(profile.id);
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
