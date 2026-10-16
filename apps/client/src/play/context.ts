/**
 * Lo que comparten los módulos que REPRODUCEN una ronda.
 *
 * El orquestador (`main.ts`) arma la escena y le pasa esto a los pasos de
 * cada mecánica. Ellos no crean nada: animan lo que el servidor ya resolvió
 * sobre piezas que ya existen.
 *
 * `session` es estado mutable a propósito y por referencia: el turbo y el
 * pedido de saltear los cambia el jugador en cualquier momento, y el paso
 * que se está reproduciendo tiene que verlo en la próxima espera.
 */

import type { Text } from 'pixi.js';
import type { GameConfig } from '@casino/protocol';
import type { SlotGameDef } from '@casino/math';

import type { ClientGame } from '../games.ts';
import type { ReelSet } from '../render/reels.ts';
import type { ClusterBoard } from '../render/cluster-board.ts';
import type { WinPresenter } from '../render/winlines.ts';
import type { Hud } from '../render/hud.ts';
import type { Fx } from '../render/fx.ts';
import type { ClimbScene } from '../render/climb.ts';
import type { MultLayer } from '../render/mults.ts';
import type { Presentation } from '../presentation.ts';
import type { HoldBoard } from '../render/hold-board.ts';

export interface Session {
  turbo: boolean;
  /**
   * Cuando el jugador aprieta durante una ronda, esto se enciende: los
   * rodillos hacen slam stop y TODAS las esperas de presentación se resuelven
   * al instante hasta que termine la ronda.
   */
  skipRequested: boolean;
  /** Reloj del juego, en ms. Avanza con cada frame (o con `pump()` en QA). */
  simTime: number;
  /** Multiplicador acumulado de la función en curso (juegos que acumulan). */
  accum: number;
}

export interface TraceEntry {
  k: string;
  i: number;
  c: number;
  t: number;
}

export interface PlayContext {
  profile: ClientGame;
  cfg: GameConfig;
  game: SlotGameDef;
  reelSet: ReelSet | ClusterBoard;
  wins: WinPresenter;
  hud: Hud;
  fx: Fx;
  climbScene: ClimbScene;
  multLayer: MultLayer;
  /** Tablero de Hold & Win; `null` en los juegos que no lo son. */
  holdBoard: HoldBoard | null;
  freeCounter: Text;
  cascadaBadge: Text;
  /** Juegos de caminos: "117.649 CAMINOS" arriba a la izquierda. `null` en los demás. */
  waysLabel: Text | null;
  presentation: Presentation;
  session: Session;
  /** ¿Este juego tiene Escalinata? Si no, la feature son pegajosos o cascadas. */
  hasClimb: boolean;
  /** Espera interrumpible sobre el reloj del juego. */
  wait(ms: number): Promise<void>;
  /** Factor de tiempos de presentación (turbo acorta todo). */
  tf(): number;
  setFreeMode(free: boolean): void;
  /** Recalcula la escena para el tamaño de pantalla actual. */
  layout(): void;
  /** Traza de QA de los pasos reproducidos, acotada. */
  trace(e: TraceEntry): void;
}
