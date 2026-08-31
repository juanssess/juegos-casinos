/**
 * Contrato del RGS (Remote Gaming Server).
 *
 * Esta es la bisagra de todo el proyecto. El cliente habla SOLO este
 * protocolo; nunca importa el motor matemático ni sabe cómo se resuelve una
 * ronda. Hoy del otro lado hay una implementación local corriendo en el mismo
 * navegador; mañana puede haber un servidor Node, un agregador o el RGS de un
 * operador ajeno, y el cliente no se entera.
 *
 * Por eso este paquete no tiene dependencias y no tiene lógica: son tipos.
 *
 * Tres invariantes que no se negocian:
 *
 *  1. El cliente NUNCA decide un resultado. Manda una intención (`spin`) y
 *     recibe una ronda ya resuelta. Todo lo que hace después es teatro.
 *  2. Toda ronda tiene un `roundId`. Si el jugador se cae en el giro gratis 4
 *     de 12, al volver `resume` devuelve la misma ronda en el mismo punto.
 *  3. El balance siempre lo dice el servidor. El cliente no lo calcula, lo
 *     muestra. Si difiere, gana el servidor.
 */

/** Créditos enteros. Nunca usar float para plata. */
export type Credits = number;

// ─── Sesión ──────────────────────────────────────────────────────────────

export interface AuthenticateRequest {
  /** Token de sesión emitido por el operador. En el RGS local es simbólico. */
  token: string;
  gameId: string;
}

export interface GameConfig {
  gameId: string;
  /** Nombre comercial del skin. La math puede tener varios. */
  title: string;
  reels: number;
  rows: number;
  lineCount: number;
  /** Filas que toca cada línea, por rodillo. */
  paylines: readonly (readonly number[])[];
  /** `paytable[symbolId][count]`, en múltiplos de la apuesta por línea. */
  paytable: readonly (readonly number[])[];
  /** Pagos de scatter en múltiplos de la apuesta total. */
  scatterPaytable: readonly number[];
  /** Apuestas totales disponibles, en créditos. */
  betLevels: readonly Credits[];
  rtp: number;
  freeSpinMultiplier: number;
  scattersToTrigger: number;
  /** Paquetes de la Escalinata, del nivel 1 a la cima. */
  climbTiers: readonly { spins: number; multiplier: number }[];
  /** Probabilidad de subir cada escalón, en milésimas (se muestra en la info). */
  climbAscendPerMil: readonly number[];
  /** Precio de la compra del bonus, en múltiplos de la apuesta. */
  bonusBuyX: number;
  /** Tope de premio por ronda, en múltiplos de apuesta (0 = sin tope). */
  maxWinX?: number;
}

/** La escalada ya resuelta, para que el cliente la reproduzca con suspenso. */
export interface ClimbDto {
  /** Una decisión por escalón intentado (true = subió). */
  ascents: boolean[];
  /** Nivel final, 1-based. */
  tier: number;
  spins: number;
  multiplier: number;
}

export interface AuthenticateResponse {
  playerId: string;
  balance: Credits;
  currency: string;
  config: GameConfig;
  /** Ronda sin terminar que hay que retomar antes de poder apostar de nuevo. */
  pendingRound?: RoundState;
}

// ─── Ronda ───────────────────────────────────────────────────────────────

export interface SpinRequest {
  bet: Credits;
}

/** Una línea ganadora, con todo lo necesario para dibujarla. */
export interface LineWinDto {
  line: number;
  symbol: number;
  count: number;
  amount: Credits;
  /** Índices planos de la ventana (`reel * rows + row`) que forman el premio. */
  cells: number[];
}

/**
 * Un giro dentro de la ronda: el base o uno de los gratis.
 * El cliente reproduce estos pasos en orden.
 */
export interface SpinStep {
  kind: 'base' | 'free';
  /** Ventana visible, plana: `grid[reel * rows + row]`. */
  grid: number[];
  /** Posiciones de parada de cada rodillo. Sirven para replay y auditoría. */
  stops: number[];
  /**
   * Multiplicador por celda (wilds ×N). Ausente en juegos sin multiplicadores.
   * En un juego con pegajosos, una celda mantiene su valor entre giros.
   */
  mults?: number[];
  lineWins: LineWinDto[];
  scatterCells: number[];
  scatterWin: Credits;
  /** Multiplicador aplicado a los premios de línea en este giro. */
  multiplier: number;
  /** Giros gratis que otorgó este giro (disparo o retrigger). */
  awarded: number;
  win: Credits;
  /** Índice del giro gratis y total, para el cartel "3 de 12". */
  freeIndex?: number;
  freeTotal?: number;
}

export interface RoundState {
  roundId: string;
  bet: Credits;
  steps: SpinStep[];
  /** Presente si la ronda disparó la feature y el juego tiene escalinata. */
  climb?: ClimbDto;
  /** La ronda fue una compra de bonus (para historial y stats). */
  bought?: boolean;
  totalWin: Credits;
  /** Índice del paso hasta el que el cliente ya mostró todo. */
  acknowledgedStep: number;
  complete: boolean;
}

export interface SpinResponse {
  round: RoundState;
  /** Balance después de descontar la apuesta y acreditar el premio. */
  balance: Credits;
}

export interface ResumeRequest {
  roundId: string;
}

// ─── Interfaz ────────────────────────────────────────────────────────────

/**
 * Lo único que el cliente conoce del mundo exterior.
 *
 * Todos los métodos son asincrónicos incluso en la implementación local, para
 * que el cliente ya esté escrito contra la latencia real desde el día uno.
 * Un cliente que asume respuesta instantánea se rompe el día que hay red.
 */
export interface RgsClient {
  authenticate(req: AuthenticateRequest): Promise<AuthenticateResponse>;
  spin(req: SpinRequest): Promise<SpinResponse>;
  /**
   * Compra del bonus: cuesta `bet × config.bonusBuyX` y devuelve una ronda
   * con la feature garantizada. La apuesta de referencia sigue siendo `bet`
   * (los premios pagan sobre ella, no sobre el precio).
   */
  buyBonus(req: SpinRequest): Promise<SpinResponse>;
  resume(req: ResumeRequest): Promise<SpinResponse>;
  /** Marca hasta qué paso el jugador ya vio, para poder retomar bien. */
  acknowledge(roundId: string, step: number): Promise<void>;
}

export class RgsError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'RgsError';
    this.code = code;
  }
}

export const RGS_ERRORS = {
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ROUND_IN_PROGRESS: 'ROUND_IN_PROGRESS',
  INVALID_BET: 'INVALID_BET',
  UNKNOWN_ROUND: 'UNKNOWN_ROUND',
} as const;
