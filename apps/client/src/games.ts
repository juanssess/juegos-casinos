/**
 * Registro de juegos del cliente.
 *
 * El cliente es UNO solo y sirve cualquier juego: se elige con `?game=` en la
 * URL. Ya no hay una lista escrita a mano: Vite junta en tiempo de build
 * todos los `manifest.ts` de `packages/games/*` y todos los `skins/*.ts` del
 * cliente, y un juego existe cuando tiene los dos.
 *
 * El RTP y la volatilidad que se muestran salen del QA (`qa.ts` del juego),
 * no de un número copiado acá: antes el cliente decía 96,50 % porque alguien
 * lo había escrito, no porque se hubiera medido.
 */

import type { Application, Graphics } from 'pixi.js';
import type { GameManifest, HoldWinDef, Jackpots, OriginalManifest, Palette, RoundEngine, SlotGameDef, SlotManifest, Timing } from '@casino/math';

import type { SymbolTextures } from './render/symbols.ts';
import { paintedArtFor, type PaintedArt } from './render/painted.ts';

/** Lo que cada juego aporta de dibujo: `apps/client/src/skins/<id>.ts`. */
export interface ClientSkin {
  textures: (app: Application) => SymbolTextures;
  /**
   * Escenografía del fondo. Se dibuja en un Graphics a pantalla completa,
   * fuera del contenedor escalado. Cada juego trae la suya: es lo que hace
   * que dos juegos con el mismo cliente no se sientan el mismo juego.
   */
  backdrop: (bg: Graphics, w: number, h: number) => void;
}

export interface ClientGame {
  id: string;
  title: string;
  game: SlotGameDef;
  engine: () => RoundEngine;
  palette: Palette;
  timing: Timing;
  textures: (app: Application) => SymbolTextures;
  /** Etiqueta visible de cada símbolo, para la tabla de pagos. */
  labels: Record<number, string>;
  bonusBuyX: number;
  betLevels: readonly number[];
  /** RTP publicado: el medido por el QA, o el objetivo si todavía no pasó. */
  rtp: number;
  volatility: string;
  /** ¿El RTP y la volatilidad salen de un QA aprobado? */
  verified: boolean;
  /** Tope de premio por ronda, si el juego tiene. */
  maxWinX?: number;
  /** Tamaño de celda en píxeles: la grilla 5×5 necesita celdas más chicas. */
  cellSize: number;
  /**
   * Juego de RACIMOS con cascadas.
   *
   * Es el único dato del perfil que cambia CÓMO se juega y no solo cómo se
   * ve. El orquestador lo mira en dos lugares —qué tablero construir y cómo
   * reproducir un paso— y en ningún otro: el HUD, el sonido, el autoplay, la
   * compra y la recuperación de ronda son los mismos.
   */
  cluster?: boolean;
  /**
   * CAMINOS con columnas de altura variable (Las Cataratas). Es un juego de
   * racimos para el orquestador; el tablero estira las celdas y el contador
   * de caminos se muestra arriba.
   */
  ways?: boolean;
  /** Texto del pie. */
  tagline: string;
  backdrop: (bg: Graphics, w: number, h: number) => void;
  /**
   * Juegos con BOMBAS: color de la etiqueta según el valor. Su presencia es
   * lo que enciende las etiquetas en el tablero y la multiplicación final.
   */
  valueColor?: (v: number) => number;
  /** Subtítulo del cartel de expectativa ("una barrica más"). */
  nearMiss?: string;
  /** Subtítulo del cartel de giros gratis en un juego de racimos. */
  freeIntro?: string;
  /**
   * Hold & Win: las reglas que el tablero y la tabla de pagos muestran. Su
   * presencia es lo que cambia el giro gratis por el tablero de re-giros.
   */
  hold?: { trigger: number; respins: number; jackpots: Jackpots };
  /** Arte pintado (`packages/games/<id>/art/`), o `null` si el juego no tiene. */
  art: PaintedArt | null;
  /** Tinte del fondo pintado durante la función. */
  featureTint?: number;
  /** Una frase sobre la función, para la pantalla de entrada del bonus. */
  featureDetail?: string;
  /** Nombre de la escalera de las cascadas ("MARCHA ×4"). */
  ladderLabel?: string;
}

const MANIFESTS = import.meta.glob<{ MANIFEST: GameManifest }>(
  '../../../packages/games/*/src/manifest.ts',
  { eager: true },
);
const SKINS = import.meta.glob<{ SKIN_ART: ClientSkin }>('./skins/*.ts', { eager: true });

/** El id es el nombre del archivo o de la carpeta: `skins/kiosco.ts`, `games/kiosco/`. */
const idOf = (path: string, re: RegExp): string => path.match(re)?.[1] ?? '';

function labelsOf(skin: GameManifest['theme']['SKIN']): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(skin)) if (v) out[Number(k)] = v.label;
  return out;
}

/** Tope por ronda: solo algunos juegos lo declaran (los de líneas sin tope no). */
function capOf(m: SlotManifest): number | undefined {
  const cap = (m.game as { maxWinX?: number }).maxWinX;
  return cap !== undefined && Number.isFinite(cap) ? cap : undefined;
}

function holdOf(m: SlotManifest): Pick<ClientGame, 'hold'> {
  const h = (m.game as Partial<HoldWinDef>).holdWin;
  return h ? { hold: { trigger: h.trigger, respins: h.respins, jackpots: h.jackpots } } : {};
}

function toClientGame(m: SlotManifest, art: ClientSkin): ClientGame {
  const qa = m.qa?.passed ? m.qa : null;
  const c = m.client;
  return {
    id: m.id,
    title: m.theme.TITLE,
    game: m.game,
    engine: m.engine,
    palette: m.theme.PALETTE,
    timing: m.theme.TIMING,
    textures: art.textures,
    labels: labelsOf(m.theme.SKIN),
    bonusBuyX: m.bonusBuyX,
    betLevels: c.betLevels,
    rtp: qa ? qa.rtp : m.targetRtp,
    volatility: qa ? qa.volatilityLabel : 'sin medir',
    verified: qa !== null,
    ...(capOf(m) !== undefined ? { maxWinX: capOf(m)! } : {}),
    cellSize: c.cellSize,
    ...(m.kind === 'cluster' ? { cluster: true } : {}),
    ...(m.kind === 'cluster' && m.game.payMode === 'ways' ? { ways: true } : {}),
    tagline: c.tagline,
    backdrop: art.backdrop,
    ...(c.valueColor ? { valueColor: c.valueColor } : {}),
    ...(c.nearMiss ? { nearMiss: c.nearMiss } : {}),
    ...(c.freeIntro ? { freeIntro: c.freeIntro } : {}),
    art: paintedArtFor(m.id),
    ...holdOf(m),
    ...(c.featureTint !== undefined ? { featureTint: c.featureTint } : {}),
    ...(c.featureDetail ? { featureDetail: c.featureDetail } : {}),
    ...('ladderLabel' in c && c.ladderLabel ? { ladderLabel: c.ladderLabel } : {}),
  };
}

export const CLIENT_GAMES: Record<string, ClientGame> = (() => {
  const arts: Record<string, ClientSkin> = {};
  for (const [path, mod] of Object.entries(SKINS)) {
    if (mod.SKIN_ART) arts[idOf(path, /skins\/([^/]+)\.ts$/)] = mod.SKIN_ART;
  }
  const out: Record<string, ClientGame> = {};
  for (const [path, mod] of Object.entries(MANIFESTS)) {
    const id = idOf(path, /games\/([^/]+)\/src\/manifest\.ts$/);
    // Los originales tienen su propio cliente (originals/).
    if (mod.MANIFEST.kind === 'original') continue;
    const art = arts[id];
    // Un juego sin arte de cliente no se puede mostrar: se avisa y se saltea.
    if (!art) {
      console.warn(`El juego ${id} no tiene skins/${id}.ts: no se carga en el cliente.`);
      continue;
    }
    out[id] = toClientGame(mod.MANIFEST, art);
  }
  return out;
})();

/** Los ORIGINALES (Crash, Mines, Plinko), por id. No pasan por el cliente de tragamonedas. */
export const ORIGINALS: Record<string, OriginalManifest> = (() => {
  const out: Record<string, OriginalManifest> = {};
  for (const mod of Object.values(MANIFESTS)) if (mod.MANIFEST.kind === 'original') out[mod.MANIFEST.id] = mod.MANIFEST;
  return out;
})();

/** El original que pide la URL, o `null` si es una tragamonedas. */
export function pickOriginal(): OriginalManifest | null {
  return ORIGINALS[new URLSearchParams(location.search).get('game') ?? ''] ?? null;
}

export function pickClientGame(): ClientGame {
  const id = new URLSearchParams(location.search).get('game') ?? 'classic20';
  return CLIENT_GAMES[id] ?? CLIENT_GAMES.classic20!;
}
