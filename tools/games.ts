/**
 * Registro de juegos para las herramientas de línea de comandos.
 *
 * Cada entrada dice: la definición, cómo construir su motor (los juegos con
 * mecánica propia traen el suyo), cómo medir sus frecuencias y sus objetivos
 * de diseño. `tools/sim.ts --game sebusca` y compañía salen de acá.
 *
 * La entrada es una UNIÓN DISCRIMINADA por `kind` porque un juego de racimos
 * no se mide ni se resuelve igual que uno de líneas: las frecuencias se
 * cuentan por tramo de tamaño y no por cantidad en línea, y los premios se
 * pagan sobre la apuesta en fichas y no por línea. Fingir que es lo mismo
 * pedía un tipo con la mitad de los campos opcionales, que es la forma
 * educada de decir "acá adentro hay dos cosas distintas".
 */

import {
  createRoundEngine,
  createClusterEngine,
  measure,
  measureCluster,
  type ClusterFreqReport,
  type ClusterGameDef,
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

import { GAME as VENDIMIA } from '@casino/game-vendimia';
import * as vendimiaTuning from '@casino/game-vendimia/tuning';

interface CommonEntry {
  engine: () => RoundEngine;
  targetRtp: number;
  shares: Partial<Record<SymbolId, number>>;
  shape: Partial<Record<SymbolId, readonly number[]>>;
}

export interface LinesEntry extends CommonEntry {
  kind: 'lines';
  game: SlotGameDef;
  measure: (opts: { rounds: number; seed?: number }) => FreqReport;
}

export interface ClusterEntry extends CommonEntry {
  kind: 'cluster';
  game: ClusterGameDef;
  measure: (opts: { rounds: number; seed?: number }) => ClusterFreqReport;
}

export type GameEntry = LinesEntry | ClusterEntry;

export const GAMES: Record<string, GameEntry> = {
  classic20: {
    kind: 'lines',
    game: CLASSIC20,
    engine: () => createRoundEngine(CLASSIC20),
    measure: (opts) => measure(CLASSIC20, opts),
    targetRtp: classic20Tuning.TARGET_RTP,
    shares: classic20Tuning.SHARES,
    shape: classic20Tuning.SHAPE,
  },
  sebusca: {
    kind: 'lines',
    game: SEBUSCA,
    engine: () => createSebuscaEngine(SEBUSCA),
    measure: (opts) => measureSebusca(SEBUSCA, opts),
    targetRtp: sebuscaTuning.TARGET_RTP,
    shares: sebuscaTuning.SHARES,
    shape: sebuscaTuning.SHAPE,
  },
  vendimia: {
    kind: 'cluster',
    game: VENDIMIA,
    engine: () => createClusterEngine(VENDIMIA),
    measure: (opts) => measureCluster(VENDIMIA, opts),
    targetRtp: vendimiaTuning.TARGET_RTP,
    shares: vendimiaTuning.SHARES,
    shape: vendimiaTuning.SHAPE,
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
