/**
 * Registro de juegos del cliente.
 *
 * El cliente es UNO solo y sirve cualquier juego: se elige con `?game=` en la
 * URL. Cada entrada trae lo único que cambia entre juegos — la definición
 * matemática, su motor, su tema, sus texturas y su precio de bonus. Todo lo
 * demás (rodillos, HUD, efectos, sonido, RGS) es compartido.
 *
 * Eso es exactamente lo que hace que sumar el juego #3 sea barato: una
 * entrada acá, un paquete de math y un archivo de símbolos.
 */

import type { Application, Graphics } from 'pixi.js';
import { createRoundEngine, type RoundEngine, type SlotGameDef } from '@casino/math';

import { GAME as CLASSIC20 } from '@casino/game-classic20';
import { BONUS_BUY_X as CLASSIC20_BUY } from '@casino/game-classic20/tuning';
import * as classic20Theme from '@casino/game-classic20/theme';
import { createSymbolTextures } from './render/symbols.ts';

import { GAME as SEBUSCA } from '@casino/game-sebusca';
import { createSebuscaEngine } from '@casino/game-sebusca/engine';
import { BONUS_BUY_X as SEBUSCA_BUY } from '@casino/game-sebusca/tuning';
import * as sebuscaTheme from '@casino/game-sebusca/theme';
import { createSebuscaTextures } from './render/symbols-sebusca.ts';

import type { Palette, Timing } from './render/theme.ts';
import type { SymbolTextures } from './render/symbols.ts';

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
  /** RTP declarado (verificado por simulación). */
  rtp: number;
  volatility: string;
  /** Tope de premio por ronda, si el juego tiene. */
  maxWinX?: number;
  /** Tamaño de celda en píxeles: la grilla 5×5 necesita celdas más chicas. */
  cellSize: number;
  /** Texto del pie. */
  tagline: string;
  /**
   * Escenografía del fondo. Se dibuja en un Graphics a pantalla completa,
   * fuera del contenedor escalado. Cada juego trae la suya: es lo que hace
   * que dos juegos con el mismo cliente no se sientan el mismo juego.
   */
  backdrop: (bg: Graphics, w: number, h: number) => void;
}

/**
 * Degradé vertical suave.
 *
 * Antes esto eran tres rectángulos con alpha, y en pantalla se veían como
 * franjas duras: el ojo detecta un salto de luminancia mucho antes de lo que
 * uno cree. Con bandas finas de un píxel el degradé es continuo y sigue
 * siendo procedural.
 */
function vGradient(
  bg: Graphics,
  w: number,
  h: number,
  stops: readonly (readonly [number, number])[],
): void {
  const BANDS = 96;
  for (let i = 0; i < BANDS; i++) {
    const t = i / (BANDS - 1);
    // Buscamos el tramo del degradé donde cae `t`.
    let a = stops[0]!;
    let b = stops[stops.length - 1]!;
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s]![0] && t <= stops[s + 1]![0]) {
        a = stops[s]!;
        b = stops[s + 1]!;
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const k = (t - a[0]) / span;
    const ca = a[1];
    const cb = b[1];
    const r = Math.round(((ca >> 16) & 255) * (1 - k) + ((cb >> 16) & 255) * k);
    const g = Math.round(((ca >> 8) & 255) * (1 - k) + ((cb >> 8) & 255) * k);
    const bl = Math.round((ca & 255) * (1 - k) + (cb & 255) * k);
    bg.rect(0, (h * i) / BANDS - 1, w, h / BANDS + 2)
      .fill((r << 16) | (g << 8) | bl);
  }
}

/** Fondo de Maverick: desierto azteca con pirámides en el horizonte. */
function aztecBackdrop(bg: Graphics, w: number, h: number): void {
  vGradient(bg, w, h, [
    [0, 0x2e1d0e],
    [0.45, 0x1a1108],
    [1, 0x0b0906],
  ]);
  const rings = 4;
  for (let i = rings; i > 0; i--) {
    bg.ellipse(w / 2, h * 0.46, (w * 0.42 * i) / rings, (h * 0.44 * i) / rings)
      .fill({ color: 0x3a2410, alpha: 0.14 });
  }
  const py = h * 0.98;
  for (const [cx, pw, ph] of [
    [w * 0.12, w * 0.3, h * 0.2],
    [w * 0.5, w * 0.42, h * 0.28],
    [w * 0.88, w * 0.32, h * 0.22],
  ] as const) {
    const tiers = 5;
    for (let t = 0; t < tiers; t++) {
      const k = 1 - t / tiers;
      bg.rect(cx - (pw * k) / 2, py - ph * ((t + 1) / tiers), pw * k, ph / tiers + 1)
        .fill({ color: 0x140d07, alpha: 0.85 });
    }
  }
  for (let i = 0; i < 14; i++) {
    const rx = ((i * 97) % 100) / 100;
    const ry = ((i * 53) % 100) / 100;
    bg.circle(rx * w, h * 0.15 + ry * h * 0.55, 1.5 + (i % 3))
      .fill({ color: 0xffd35c, alpha: 0.05 + (i % 4) * 0.02 });
  }
}

/** Fondo de Se Busca: atardecer del desierto, mesetas y cactus. */
function westernBackdrop(bg: Graphics, w: number, h: number): void {
  // Cielo de atardecer: naranja quemado arriba, tierra oscura abajo.
  vGradient(bg, w, h, [
    [0, 0x8a4a1c],
    [0.3, 0x5e2f16],
    [0.6, 0x2a170c],
    [1, 0x120c08],
  ]);

  // Sol bajo, cerca del horizonte de las mesetas.
  const sunY = h * 0.3;
  for (let i = 6; i > 0; i--) {
    bg.circle(w * 0.5, sunY, (h * 0.26 * i) / 6)
      .fill({ color: 0xffb347, alpha: 0.05 });
  }
  bg.circle(w * 0.5, sunY, h * 0.055).fill({ color: 0xffd98a, alpha: 0.5 });
  bg.circle(w * 0.5, sunY, h * 0.04).fill({ color: 0xfff0c4, alpha: 0.65 });

  // Mesetas: la silueta del oeste. Planas arriba, a diferencia de las
  // pirámides escalonadas de Maverick.
  const gy = h * 0.99;
  for (const [cx, mw, mh, alpha] of [
    [w * 0.16, w * 0.34, h * 0.19, 0.55],
    [w * 0.82, w * 0.4, h * 0.24, 0.6],
    [w * 0.48, w * 0.26, h * 0.13, 0.45],
  ] as const) {
    bg.poly([
      cx - mw / 2, gy,
      cx - mw / 2 + mw * 0.1, gy - mh,
      cx + mw / 2 - mw * 0.12, gy - mh,
      cx + mw / 2, gy,
    ]).fill({ color: 0x1a0f08, alpha });
  }

  // Cactus saguaro a los costados: el detalle que dice "western" al instante.
  for (const [cx, s] of [[w * 0.07, 1], [w * 0.93, 0.85]] as const) {
    const ch = h * 0.16 * s;
    const cw = 11 * s;
    bg.roundRect(cx - cw / 2, gy - ch, cw, ch, cw / 2).fill({ color: 0x120a05, alpha: 0.8 });
    // Brazos.
    bg.roundRect(cx - cw * 2.2, gy - ch * 0.72, cw * 0.8, ch * 0.34, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx - cw * 2.2, gy - ch * 0.72, cw * 1.9, cw * 0.8, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx + cw * 1.4, gy - ch * 0.58, cw * 0.8, ch * 0.26, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
    bg.roundRect(cx - cw * 0.4, gy - ch * 0.58, cw * 2.2, cw * 0.8, cw / 3)
      .fill({ color: 0x120a05, alpha: 0.8 });
  }

  // Polvo en suspensión.
  for (let i = 0; i < 18; i++) {
    const rx = ((i * 61) % 100) / 100;
    const ry = ((i * 37) % 100) / 100;
    bg.circle(rx * w, h * 0.25 + ry * h * 0.5, 1 + (i % 3))
      .fill({ color: 0xe8d3a0, alpha: 0.04 + (i % 3) * 0.015 });
  }
}

function labelsOf(skin: Record<number, { label: string }>): Record<number, string> {
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(skin)) out[Number(k)] = v.label;
  return out;
}

export const CLIENT_GAMES: Record<string, ClientGame> = {
  classic20: {
    id: 'classic20',
    title: classic20Theme.TITLE,
    game: CLASSIC20,
    engine: () => createRoundEngine(CLASSIC20),
    palette: classic20Theme.PALETTE,
    timing: classic20Theme.TIMING,
    textures: createSymbolTextures,
    labels: labelsOf(classic20Theme.SKIN),
    bonusBuyX: CLASSIC20_BUY,
    betLevels: [20, 40, 100, 200, 400, 1000, 2000],
    rtp: 0.9666,
    volatility: 'media-alta',
    cellSize: 116,
    tagline: '20 líneas · La Escalinata',
    backdrop: aztecBackdrop,
  },
  sebusca: {
    id: 'sebusca',
    title: sebuscaTheme.TITLE,
    game: SEBUSCA,
    engine: () => createSebuscaEngine(SEBUSCA),
    palette: sebuscaTheme.PALETTE,
    timing: sebuscaTheme.TIMING,
    textures: createSebuscaTextures,
    labels: labelsOf(sebuscaTheme.SKIN),
    bonusBuyX: SEBUSCA_BUY,
    betLevels: [15, 30, 75, 150, 300, 750, 1500],
    rtp: 0.9644,
    volatility: 'muy alta',
    maxWinX: SEBUSCA.maxWinX,
    // 5 filas en la misma altura: la celda tiene que achicarse.
    cellSize: 92,
    tagline: '15 líneas · wilds pegajosos · tope 10.000×',
    backdrop: westernBackdrop,
  },
};

export function pickClientGame(): ClientGame {
  const id = new URLSearchParams(location.search).get('game') ?? 'classic20';
  return CLIENT_GAMES[id] ?? CLIENT_GAMES.classic20!;
}
