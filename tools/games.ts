/**
 * Registro de juegos para las herramientas de línea de comandos.
 *
 * Cada entrada dice: la definición, cómo construir su motor (los juegos con
 * mecánica propia traen el suyo), cómo medir sus frecuencias y sus objetivos
 * de diseño. `tools/sim.ts --game sebusca` y compañía salen de acá.
 */

import {
  createRoundEngine,
  measure,
  type FreqReport,
  type RoundEngine,
  type SlotGameDef,
  type SymbolId,
} from '@casino/math';

import { GAME as CLASSIC20 } from '@casino/game-classic20';
import * as classic20Tuning from '@casino/game-classic20/tuning';

import { GAME as SEBUSCA } from '@casino/game-sebusca';
import { createSebuscaEngine } from '@casino/game-sebusca/engine';
import { measureSebusca } from '@casino/game-sebusca/measure';
import * as sebuscaTuning from '@casino/game-sebusca/tuning';

export interface GameEntry {
  game: SlotGameDef;
  engine: () => RoundEngine;
  measure: (opts: { rounds: number; seed?: number }) => FreqReport;
  targetRtp: number;
  shares: Partial<Record<SymbolId, number>>;
  shape: Partial<Record<SymbolId, readonly number[]>>;
}

export const GAMES: Record<string, GameEntry> = {
  classic20: {
    game: CLASSIC20,
    engine: () => createRoundEngine(CLASSIC20),
    measure: (opts) => measure(CLASSIC20, opts),
    targetRtp: classic20Tuning.TARGET_RTP,
    shares: classic20Tuning.SHARES,
    shape: classic20Tuning.SHAPE,
  },
  sebusca: {
    game: SEBUSCA,
    engine: () => createSebuscaEngine(SEBUSCA),
    measure: (opts) => measureSebusca(SEBUSCA, opts),
    targetRtp: sebuscaTuning.TARGET_RTP,
    shares: sebuscaTuning.SHARES,
    shape: sebuscaTuning.SHAPE,
  },
};

export function pickGame(argv: readonly string[]): GameEntry {
  const i = argv.indexOf('--game');
  const id = i === -1 ? 'classic20' : (argv[i + 1] ?? 'classic20');
  const entry = GAMES[id];
  if (!entry) {
    throw new Error(`Juego desconocido: ${id}. Disponibles: ${Object.keys(GAMES).join(', ')}`);
  }
  return entry;
}
