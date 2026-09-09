/**
 * RGS local: implementa el contrato del servidor dentro del navegador.
 *
 * Es un servidor de verdad en todo salvo dónde corre. Tiene wallet, ciclo de
 * ronda, persistencia y recuperación de ronda interrumpida. Usa el MISMO motor
 * matemático que va a usar el servidor Node y el mismo `CryptoRng`.
 *
 * Cuando exista el servidor real, se escribe un `HttpRgs` que implemente
 * `RgsClient` haciendo fetch, se cambia una línea en `main.ts`, y el resto del
 * cliente no se toca. Ese es todo el punto de haber definido el protocolo
 * antes de dibujar el primer rodillo.
 *
 * Lo que este RGS local NO tiene, y el real sí necesita: autenticación
 * verdadera, wallet del operador, idempotencia contra reintentos de red, y un
 * log de rondas append-only para auditoría.
 */

import {
  createRoundEngine,
  CryptoRng,
  SYM,
  type RoundEngine,
  type RoundResult,
  type SlotGameDef,
  type SpinRecord,
} from '@casino/math';
import {
  RgsError,
  RGS_ERRORS,
  type AuthenticateRequest,
  type AuthenticateResponse,
  type GameConfig,
  type LineWinDto,
  type ResumeRequest,
  type RgsClient,
  type RoundState,
  type SpinRequest,
  type SpinResponse,
  type SpinStep,
  type TumbleDto,
} from '@casino/protocol';

// Una billetera por juego: mezclar el estado de dos juegos distintos en la
// misma clave hace que una ronda pendiente de uno bloquee al otro.
const storageKey = (gameId: string) => `rgs.v1.${gameId}`;

/**
 * Traduce el resultado del motor a los pasos que entiende el cliente.
 *
 * Función pura y exportada a propósito: la usa el RGS para responder, y
 * también las herramientas de QA para fabricar una ronda concreta sin pasar
 * por el ciclo de apuesta. Si viviera adentro de la clase habría dos
 * conversiones distintas y tarde o temprano se separarían.
 */
export function roundToSteps(game: SlotGameDef, result: RoundResult): SpinStep[] {
  const { reels, rows, paylines } = game;

  /* Las celdas de un premio pueden venir DADAS o deducirse.
     En un juego de líneas se deducen: la línea y el conteo dicen exactamente
     qué celdas. En uno de racimos no hay nada que deducir —el grupo tiene
     forma libre— así que vienen con el premio. Un solo camino que acepta las
     dos formas evita tener dos conversiones que tarde o temprano se separan. */
  const celdasDe = (w: { line: number; count: number; cells?: readonly number[] }): number[] => {
    if (w.cells) return [...w.cells];
    const line = paylines[w.line]!;
    const out: number[] = [];
    for (let r = 0; r < w.count && r < reels; r++) out.push(r * rows + line[r]!);
    return out;
  };

  const premios = (rec: { lineWins: readonly { line: number; symbol: number; count: number; amount: number; cells?: readonly number[] }[] }): LineWinDto[] =>
    rec.lineWins.map((w) => ({
      line: w.line,
      symbol: w.symbol,
      count: w.count,
      amount: w.amount,
      cells: celdasDe(w),
    }));

  const toStep = (rec: SpinRecord, kind: 'base' | 'free'): SpinStep => {
    const scatterCells: number[] = [];
    for (let i = 0; i < rec.grid.length; i++) {
      if (rec.grid[i] === SYM.SCATTER) scatterCells.push(i);
    }

    const tumbles: TumbleDto[] = (rec.tumbles ?? []).map((t) => ({
      grid: t.grid,
      wins: premios(t.result),
      multiplier: t.multiplier,
      win: t.win,
    }));

    // El premio del paso es la caída inicial MÁS todas sus cascadas.
    let win = rec.result.totalWin;
    for (const t of tumbles) win += t.win;

    return {
      kind,
      grid: rec.grid,
      stops: rec.stops,
      ...(rec.mults ? { mults: rec.mults } : {}),
      lineWins: premios(rec.result),
      scatterCells,
      scatterWin: rec.result.scatterWin,
      multiplier: rec.multiplier,
      awarded: rec.awarded,
      win,
      ...(tumbles.length ? { tumbles } : {}),
    };
  };

  const steps: SpinStep[] = [toStep(result.base, 'base')];
  result.free.forEach((rec, i) => {
    const step = toStep(rec, 'free');
    step.freeIndex = i + 1;
    step.freeTotal = result.free.length;
    steps.push(step);
  });
  return steps;
}

interface PersistedState {
  balance: number;
  round: RoundState | null;
  nextRoundId: number;
}

export interface LocalRgsOptions {
  game: SlotGameDef;
  title: string;
  betLevels: readonly number[];
  rtp: number;
  /** Precio del bonus en múltiplos de apuesta (medido, no inventado). */
  bonusBuyX: number;
  /**
   * Motor de ronda. Los juegos con mecánica propia (wilds pegajosos,
   * cascadas) traen el suyo; si falta, se usa el genérico de líneas.
   */
  engine?: RoundEngine;
  /** Tope de premio por ronda, para mostrarlo en la info. */
  maxWinX?: number;
  startingBalance?: number;
  /** Latencia simulada, para no escribir un cliente que asume red instantánea. */
  latencyMs?: number;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class LocalRgs implements RgsClient {
  #game: SlotGameDef;
  #engine: RoundEngine;
  #rng = new CryptoRng();
  #opts: LocalRgsOptions;
  #state: PersistedState;

  constructor(opts: LocalRgsOptions) {
    this.#opts = opts;
    this.#game = opts.game;
    this.#engine = opts.engine ?? createRoundEngine(opts.game);
    this.#state = this.#load();
  }

  #load(): PersistedState {
    try {
      const raw = localStorage.getItem(storageKey(this.#game.id));
      if (raw) return JSON.parse(raw) as PersistedState;
    } catch {
      // Storage corrupto o bloqueado: arrancamos limpio en vez de romper.
    }
    return {
      balance: this.#opts.startingBalance ?? 100_000,
      round: null,
      nextRoundId: 1,
    };
  }

  #save(): void {
    try {
      localStorage.setItem(storageKey(this.#game.id), JSON.stringify(this.#state));
    } catch {
      // Sin storage el juego funciona igual; solo se pierde la recuperación.
    }
  }

  async #latency(): Promise<void> {
    await delay(this.#opts.latencyMs ?? 90);
  }

  #config(): GameConfig {
    const g = this.#game;
    return {
      gameId: g.id,
      title: this.#opts.title,
      reels: g.reels,
      rows: g.rows,
      lineCount: g.paylines.length,
      paylines: g.paylines,
      paytable: g.paytable,
      scatterPaytable: g.scatterPaytable,
      betLevels: this.#opts.betLevels,
      rtp: this.#opts.rtp,
      freeSpinMultiplier: g.freeSpinMultiplier,
      scattersToTrigger: g.scattersToTrigger,
      climbTiers: g.climb?.tiers ?? [],
      climbAscendPerMil: g.climb?.ascendPerMil ?? [],
      bonusBuyX: this.#opts.bonusBuyX,
      bonusVariants: this.#game.bonusVariants,
      anteCostX: this.#game.anteStrips ? this.#game.anteCostX : undefined,
      ...(this.#opts.maxWinX ? { maxWinX: this.#opts.maxWinX } : {}),
    };
  }

  async authenticate(_req: AuthenticateRequest): Promise<AuthenticateResponse> {
    await this.#latency();
    const pending = this.#state.round && !this.#state.round.complete ? this.#state.round : undefined;
    return {
      playerId: 'local-player',
      balance: this.#state.balance,
      currency: 'CRD',
      config: this.#config(),
      ...(pending ? { pendingRound: pending } : {}),
    };
  }

  /** Validaciones comunes de spin y compra. Devuelve el costo a debitar. */
  #validate(req: SpinRequest, cost: number): void {
    // Una ronda sin terminar bloquea la siguiente. Sin esto, un jugador que
    // recarga en medio de los giros gratis se los pierde — o los cobra dos veces.
    const open = this.#state.round;
    if (open && !open.complete) {
      throw new RgsError(RGS_ERRORS.ROUND_IN_PROGRESS, 'Hay una ronda sin terminar');
    }
    if (!this.#opts.betLevels.includes(req.bet)) {
      throw new RgsError(RGS_ERRORS.INVALID_BET, `Apuesta inválida: ${req.bet}`);
    }
    if (this.#state.balance < cost) {
      throw new RgsError(RGS_ERRORS.INSUFFICIENT_FUNDS, 'Saldo insuficiente');
    }
  }

  /** Liquida una ronda ya resuelta: debita, acredita, persiste. */
  #settle(result: RoundResult, req: SpinRequest, cost: number, bought: boolean): SpinResponse {
    // Se descuenta ANTES de acreditar. Si algo explota en el medio, el
    // jugador perdió el costo pero la ronda quedó guardada y se recupera.
    this.#state.balance -= cost;
    const roundId = `r${this.#state.nextRoundId++}`;
    const steps = roundToSteps(this.#game, result);

    this.#state.balance += result.totalWin;
    this.#state.round = {
      roundId,
      bet: req.bet,
      steps,
      ...(result.climb ? { climb: result.climb } : {}),
      ...(bought ? { bought: true } : {}),
      totalWin: result.totalWin,
      acknowledgedStep: -1,
      complete: false,
    };
    this.#save();
    return { round: this.#state.round, balance: this.#state.balance };
  }

  async spin(req: SpinRequest): Promise<SpinResponse> {
    await this.#latency();
    /* El costo se calcula ACA, del pedido, y no de un modo guardado en la
       sesion. Si el ante viviera como estado del lado del servidor, un
       desfasaje con el cliente cobraria una cosa y jugaria otra — y siempre
       en contra de alguien. Que viaje en el pedido hace imposible ese hueco. */
    const ante = req.ante === true && !!this.#game.anteStrips;
    const cost = Math.round(req.bet * (ante ? (this.#game.anteCostX ?? 1) : 1));
    this.#validate(req, cost);
    const result = this.#engine.play(this.#rng, req.bet, ante);
    return this.#settle(result, req, cost, false);
  }

  async buyBonus(req: SpinRequest): Promise<SpinResponse> {
    await this.#latency();

    /* La variante decide el precio. Si llega un id que no existe se cae a la
       compra simple en vez de tirar error: un cliente viejo pidiendo una
       variante que ya no esta tiene que poder seguir jugando. */
    const variantes = this.#game.bonusVariants ?? [];
    const v = req.variant ? variantes.find((x) => x.id === req.variant) : undefined;
    const priceX = v ? v.priceX : this.#opts.bonusBuyX;

    const cost = Math.round(req.bet * priceX);
    this.#validate(req, cost);
    const result = this.#engine.playBonus(this.#rng, req.bet, v);
    return this.#settle(result, req, cost, true);
  }

  async resume(req: ResumeRequest): Promise<SpinResponse> {
    await this.#latency();
    const round = this.#state.round;
    if (!round || round.roundId !== req.roundId) {
      throw new RgsError(RGS_ERRORS.UNKNOWN_ROUND, 'Ronda desconocida');
    }
    return { round, balance: this.#state.balance };
  }

  async acknowledge(roundId: string, step: number): Promise<void> {
    const round = this.#state.round;
    if (!round || round.roundId !== roundId) return;
    round.acknowledgedStep = Math.max(round.acknowledgedStep, step);
    if (round.acknowledgedStep >= round.steps.length - 1) round.complete = true;
    this.#save();
  }

  /** Solo para desarrollo: recarga el saldo. */
  topUp(amount: number): number {
    this.#state.balance += amount;
    this.#save();
    return this.#state.balance;
  }

  get bet0(): number {
    return this.#opts.betLevels[0] ?? 20;
  }
}

export { RgsError, RGS_ERRORS };
