/**
 * Arranque de un ORIGINAL (Crash, Mines, Plinko).
 *
 * Es otro cliente, no una rama del de tragamonedas: no hay rodillos, ni
 * rondas resueltas de una vez, ni giros gratis. Comparte lo que vale la pena
 * compartir —el arte pintado del juego, el sonido, la billetera del casino—
 * y cada original pone su escena y sus controles.
 */

import { Application, Assets, Container, Sprite, Texture } from 'pixi.js';
import { CryptoRng, type OriginalManifest, type Rng } from '@casino/math';

import { paintedArtFor, paintedTextures } from '../render/painted.ts';
import type { SymbolTextures } from '../render/symbols.ts';
import { audio } from '../render/audio.ts';
import { createShell, type Shell } from './ui.ts';
import { createWallet, type Wallet } from './wallet.ts';

export interface OriginalCtx {
  app: Application;
  m: OriginalManifest;
  shell: Shell;
  wallet: Wallet;
  /** Las piezas pintadas, por número (el atlas del juego). */
  pieces: SymbolTextures;
  /** Donde dibuja el juego, encima de la escena. */
  world: Container;
  /** El RNG que resuelve las jugadas: el criptográfico, como en las tragamonedas. */
  rng: Rng;
  /** Se llama con el tamaño del lienzo cada vez que cambia. */
  onResize(cb: (w: number, h: number) => void): void;
  /** Ilumina la escena en los momentos grandes y la vuelve a apagar. */
  glow(on: boolean): void;
}

/** Cuánto se apaga la escena: el juego manda. */
const DIM = 0.72;

export async function bootOriginal(m: OriginalManifest): Promise<void> {
  document.title = m.theme.TITLE;
  const qa = m.qa?.passed ? m.qa : null;
  const shell = createShell(m, `RTP ${(m.targetRtp * 100).toFixed(2)}%${qa ? ' para cualquier estrategia' : ' (sin QA)'}`);
  const wallet = createWallet();

  const app = new Application();
  await app.init({
    background: m.theme.PALETTE.bgBottom,
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 1.75),
    autoDensity: true,
    resizeTo: shell.stage,
  });
  shell.stage.appendChild(app.canvas);

  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // La escena pintada, cubriendo sin deformar; las piezas, del atlas.
  const art = paintedArtFor(m.id);
  let scene: Sprite | null = null;
  let pieces: SymbolTextures = new Map();
  if (art) {
    await Assets.load([art.sceneUrl, art.symbolsUrl]);
    scene = new Sprite(Texture.from(art.sceneUrl));
    scene.alpha = DIM;
    app.stage.addChild(scene);
    pieces = await paintedTextures(app, art, new Map());
  }
  const world = new Container();
  app.stage.addChild(world);

  const resizers: ((w: number, h: number) => void)[] = [];
  const layout = () => {
    const w = app.screen.width;
    const h = app.screen.height;
    if (scene) {
      const s = Math.max(w / scene.texture.width, h / scene.texture.height);
      scene.scale.set(s);
      scene.position.set((w - scene.width) / 2, (h - scene.height) / 2);
    }
    for (const cb of resizers) cb(w, h);
  };
  app.renderer.on('resize', layout);

  shell.setBalance(await wallet.hello(m.id, m.theme.TITLE));

  const ctx: OriginalCtx = {
    app, m, shell, wallet, pieces, world,
    rng: new CryptoRng(),
    onResize: (cb) => { resizers.push(cb); },
    glow(on) {
      if (!scene) return;
      scene.alpha = on ? 1 : DIM;
      scene.tint = on ? (m.client.featureTint ?? 0xffffff) : 0xffffff;
    },
  };

  const def = m.def;
  if (def.kind === 'crash') (await import('./crash.ts')).startCrash(ctx, def);
  else if (def.kind === 'mines') (await import('./mines.ts')).startMines(ctx, def);
  else (await import('./plinko.ts')).startPlinko(ctx, def);
  layout();

  // The controls can wrap after a window resize; resize again when the stage itself changes.
  new ResizeObserver(() => app.resize()).observe(shell.stage);

  // QA: con la pestaña oculta el navegador no da cuadros; esto los avanza a mano.
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __pump(ms: number) {
        for (let k = 0; k < ms; k += 16) app.ticker.update(app.ticker.lastTime + 16);
      },
    });
  }
}
