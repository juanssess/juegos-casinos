/**
 * BridgeRgs — el juego embebido en un casino, con la billetera del casino.
 *
 * Implementa el MISMO contrato `RgsClient` que el RGS local. La diferencia es
 * de dónde sale la plata: acá el juego no tiene saldo propio, se lo pide al
 * casino que lo embebe por `postMessage`. Eso es exactamente lo que pasa en
 * la industria: el juego resuelve la ronda, el operador mueve las fichas.
 *
 * Que esto sea un archivo nuevo en vez de un parche adentro de `LocalRgs` es
 * el pago del contrato que definimos antes de dibujar el primer rodillo: ni
 * el motor, ni los rodillos, ni el HUD se enteran de que ahora la billetera
 * es de otro.
 *
 * REPARTO DE RESPONSABILIDADES
 *  - El juego: resuelve la ronda con su motor y su RNG, guarda el estado de
 *    la ronda para poder retomarla, y le pide al casino que debite y acredite.
 *  - El casino: es la ÚNICA autoridad sobre el saldo. Puede rechazar un
 *    débito, y su respuesta manda siempre.
 *
 * Modelo de confianza: la matemática corre en el navegador, igual que todos
 * los juegos del casino. Para fichas de práctica está bien; el día que haya
 * plata real, esta misma clase se reemplaza por una que hable con un servidor
 * y no cambia nada más.
 */

import { CryptoRng, type RoundEngine, type SlotGameDef } from '@casino/math';
import {
  RgsError,
  RGS_ERRORS,
  type AuthenticateRequest,
  type AuthenticateResponse,
  type GameConfig,
  type ResumeRequest,
  type RgsClient,
  type RoundState,
  type SpinRequest,
  type SpinResponse,
} from '@casino/protocol';
import { roundToSteps } from './local.ts';

/** Canal del puente. Todo mensaje que no lo traiga se ignora. */
const CHANNEL = 'bubba-rgs';
const VERSION = 1;

type Outgoing =
  | { type: 'hello'; gameId: string; title: string }
  | { type: 'balance' }
  | { type: 'debit'; amount: number }
  | { type: 'settle'; staked: number; returned: number; detail: string }
  | { type: 'busy'; value: boolean };

interface Reply {
  ok: boolean;
  balance: number;
  reason?: string;
}

export interface BridgeRgsOptions {
  game: SlotGameDef;
  engine: RoundEngine;
  title: string;
  betLevels: readonly number[];
  rtp: number;
  bonusBuyX: number;
  maxWinX?: number;
  /** Cuánto esperar una respuesta del casino antes de darla por perdida. */
  timeoutMs?: number;
}

const roundKey = (gameId: string) => `bridge.round.v1.${gameId}`;

export class BridgeRgs implements RgsClient {
  #o: BridgeRgsOptions;
  #rng = new CryptoRng();
  #seq = 0;
  #pending = new Map<number, { resolve: (r: Reply) => void; reject: (e: Error) => void }>();
  #balance = 0;
  #round: RoundState | null = null;
  #nextRoundId = 1;

  constructor(opts: BridgeRgsOptions) {
    this.#o = opts;
    window.addEventListener('message', this.#onMessage);
    this.#round = this.#loadRound();
  }

  #onMessage = (ev: MessageEvent): void => {
    // Mismo origen y mismo canal, o no es para nosotros. El juego y el casino
    // se sirven desde el mismo servidor, así que esto es una comparación
    // estricta y no un comodín.
    if (ev.origin !== window.location.origin) return;
    const d = ev.data as { ch?: string; v?: number; id?: number } & Reply;
    if (!d || d.ch !== CHANNEL || d.v !== VERSION || typeof d.id !== 'number') return;

    const waiter = this.#pending.get(d.id);
    if (!waiter) return;
    this.#pending.delete(d.id);
    waiter.resolve({ ok: d.ok, balance: d.balance, ...(d.reason ? { reason: d.reason } : {}) });
  };

  /** Manda un mensaje al casino y espera su respuesta. */
  #ask(msg: Outgoing): Promise<Reply> {
    const id = ++this.#seq;
    return new Promise<Reply>((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      window.parent.postMessage(
        { ch: CHANNEL, v: VERSION, id, ...msg },
        window.location.origin,
      );
      // Si el casino no contesta, es mejor fallar visible que dejar al
      // jugador mirando un botón que no responde para siempre.
      setTimeout(() => {
        if (this.#pending.delete(id)) {
          reject(new RgsError('BRIDGE_TIMEOUT', 'El casino no respondió'));
        }
      }, this.#o.timeoutMs ?? 8000);
    });
  }

  /** Avisa al casino si hay una ronda en curso (para bloquear la salida). */
  setBusy(value: boolean): void {
    void this.#ask({ type: 'busy', value }).catch(() => {});
  }

  #loadRound(): RoundState | null {
    try {
      const raw = sessionStorage.getItem(roundKey(this.#o.game.id));
      return raw ? (JSON.parse(raw) as RoundState) : null;
    } catch {
      return null;
    }
  }

  #saveRound(): void {
    try {
      const key = roundKey(this.#o.game.id);
      if (this.#round) sessionStorage.setItem(key, JSON.stringify(this.#round));
      else sessionStorage.removeItem(key);
    } catch {
      // Sin storage se pierde solo la recuperación de ronda.
    }
  }

  #config(): GameConfig {
    const g = this.#o.game;
    return {
      gameId: g.id,
      title: this.#o.title,
      reels: g.reels,
      rows: g.rows,
      lineCount: g.paylines.length,
      paylines: g.paylines,
      paytable: g.paytable,
      scatterPaytable: g.scatterPaytable,
      betLevels: this.#o.betLevels,
      rtp: this.#o.rtp,
      freeSpinMultiplier: g.freeSpinMultiplier,
      scattersToTrigger: g.scattersToTrigger,
      climbTiers: g.climb?.tiers ?? [],
      climbAscendPerMil: g.climb?.ascendPerMil ?? [],
      bonusBuyX: this.#o.bonusBuyX,
      ...(this.#o.maxWinX ? { maxWinX: this.#o.maxWinX } : {}),
    };
  }

  async authenticate(_req: AuthenticateRequest): Promise<AuthenticateResponse> {
    const r = await this.#ask({
      type: 'hello',
      gameId: this.#o.game.id,
      title: this.#o.title,
    });
    this.#balance = r.balance;
    const pending = this.#round && !this.#round.complete ? this.#round : undefined;
    return {
      playerId: 'bubba',
      balance: this.#balance,
      currency: 'FICHAS',
      config: this.#config(),
      ...(pending ? { pendingRound: pending } : {}),
    };
  }

  /** Texto corto para el historial del casino. */
  #detail(bought: boolean, freeSpins: number, xWin: number): string {
    if (bought) return `compró el bonus · ${freeSpins} giros gratis`;
    if (freeSpins > 0) return `${freeSpins} giros gratis · ${xWin.toFixed(1)}× la apuesta`;
    if (xWin > 0) return `${xWin.toFixed(2)}× la apuesta`;
    return 'sin premio';
  }

  async #playRound(req: SpinRequest, cost: number, bought: boolean): Promise<SpinResponse> {
    if (this.#round && !this.#round.complete) {
      throw new RgsError(RGS_ERRORS.ROUND_IN_PROGRESS, 'Hay una ronda sin terminar');
    }
    if (!this.#o.betLevels.includes(req.bet)) {
      throw new RgsError(RGS_ERRORS.INVALID_BET, `Apuesta inválida: ${req.bet}`);
    }

    // 1. El casino cobra. Si dice que no, no hay ronda.
    const debit = await this.#ask({ type: 'debit', amount: cost });
    this.#balance = debit.balance;
    if (!debit.ok) {
      throw new RgsError(RGS_ERRORS.INSUFFICIENT_FUNDS, debit.reason ?? 'Saldo insuficiente');
    }

    // 2. El juego resuelve la ronda entera con su motor y su RNG.
    const result = bought
      ? this.#o.engine.playBonus(this.#rng, req.bet)
      : this.#o.engine.play(this.#rng, req.bet);
    const steps = roundToSteps(this.#o.game, result);

    // 3. El casino acredita y registra la ronda. Ese `settle` es lo que
    //    engancha el historial, las estadísticas, la XP y las misiones.
    const settle = await this.#ask({
      type: 'settle',
      staked: cost,
      returned: result.totalWin,
      detail: this.#detail(bought, result.free.length, result.totalWin / req.bet),
    });
    this.#balance = settle.balance;

    this.#round = {
      roundId: `b${this.#nextRoundId++}`,
      bet: req.bet,
      steps,
      ...(result.climb ? { climb: result.climb } : {}),
      ...(bought ? { bought: true } : {}),
      totalWin: result.totalWin,
      acknowledgedStep: -1,
      complete: false,
    };
    this.#saveRound();

    return { round: this.#round, balance: this.#balance };
  }

  async spin(req: SpinRequest): Promise<SpinResponse> {
    return this.#playRound(req, req.bet, false);
  }

  async buyBonus(req: SpinRequest): Promise<SpinResponse> {
    return this.#playRound(req, req.bet * this.#o.bonusBuyX, true);
  }

  async resume(req: ResumeRequest): Promise<SpinResponse> {
    if (!this.#round || this.#round.roundId !== req.roundId) {
      throw new RgsError(RGS_ERRORS.UNKNOWN_ROUND, 'Ronda desconocida');
    }
    return { round: this.#round, balance: this.#balance };
  }

  async acknowledge(roundId: string, step: number): Promise<void> {
    if (!this.#round || this.#round.roundId !== roundId) return;
    this.#round.acknowledgedStep = Math.max(this.#round.acknowledgedStep, step);
    if (this.#round.acknowledgedStep >= this.#round.steps.length - 1) {
      this.#round.complete = true;
    }
    this.#saveRound();
  }
}

/** ¿El juego está corriendo embebido con la billetera del casino? */
export function isEmbedded(): boolean {
  return (
    new URLSearchParams(location.search).get('wallet') === 'parent' &&
    window.parent !== window
  );
}
