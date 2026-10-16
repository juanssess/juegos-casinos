/**
 * La billetera de los originales.
 *
 * Es el mismo reparto que en las tragamonedas (ver rgs/bridge.ts): el juego
 * resuelve la jugada con su matemática y su RNG, y el que tiene la plata es
 * otro. Embebido en el casino (`?wallet=parent`), la plata es la del casino
 * y se pide por `postMessage` en el mismo canal y con los mismos mensajes
 * (`hello`, `debit`, `settle`, `busy`): el casino no distingue un Crash de
 * una tragamonedas. Suelto, es una billetera de práctica en el navegador.
 *
 * Los originales no usan el contrato de rondas del RGS de las tragamonedas
 * porque una jugada de Mines o de Crash no es una ronda resuelta de una vez:
 * el jugador decide en el medio (cuándo cobrar). Lo que sí comparten es lo
 * que importa: el casino cobra antes de jugar y registra cada jugada al
 * liquidarla, con lo apostado y lo devuelto.
 */

const CHANNEL = 'bubba-rgs';
const VERSION = 1;

export interface Wallet {
  /** Saldo según quien tiene la plata. */
  readonly balance: number;
  /** Saluda y trae el saldo. */
  hello(gameId: string, title: string): Promise<number>;
  /** Cobra `amount`. `false` si no alcanza: no hay jugada. */
  debit(amount: number): Promise<boolean>;
  /** Acredita lo devuelto y registra la jugada. */
  settle(staked: number, returned: number, detail: string): Promise<void>;
  /** Hay una jugada en curso (el casino no deja salir). */
  busy(v: boolean): void;
}

interface Reply { ok: boolean; balance: number; reason?: string }

/** La billetera del casino que embebe el juego. */
class ParentWallet implements Wallet {
  balance = 0;
  #seq = 0;
  #pending = new Map<number, (r: Reply) => void>();

  constructor() {
    window.addEventListener('message', (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const d = ev.data as { ch?: string; v?: number; id?: number } & Reply;
      if (!d || d.ch !== CHANNEL || d.v !== VERSION || typeof d.id !== 'number') return;
      const done = this.#pending.get(d.id);
      if (!done) return;
      this.#pending.delete(d.id);
      done({ ok: d.ok, balance: d.balance, ...(d.reason ? { reason: d.reason } : {}) });
    });
  }

  #ask(msg: Record<string, unknown>): Promise<Reply> {
    const id = ++this.#seq;
    return new Promise<Reply>((resolve, reject) => {
      this.#pending.set(id, resolve);
      window.parent.postMessage({ ch: CHANNEL, v: VERSION, id, ...msg }, window.location.origin);
      setTimeout(() => {
        if (this.#pending.delete(id)) reject(new Error('El casino no respondió'));
      }, 8000);
    });
  }

  async hello(gameId: string, title: string): Promise<number> {
    const r = await this.#ask({ type: 'hello', gameId, title });
    this.balance = r.balance;
    return r.balance;
  }

  async debit(amount: number): Promise<boolean> {
    const r = await this.#ask({ type: 'debit', amount });
    this.balance = r.balance;
    return r.ok;
  }

  async settle(staked: number, returned: number, detail: string): Promise<void> {
    const r = await this.#ask({ type: 'settle', staked, returned, detail });
    this.balance = r.balance;
  }

  busy(v: boolean): void {
    void this.#ask({ type: 'busy', value: v }).catch(() => {});
  }
}

/** Fichas de práctica, guardadas en el navegador. */
class LocalWallet implements Wallet {
  balance = 100_000;
  #key = '';

  async hello(gameId: string): Promise<number> {
    this.#key = `orig.v1.${gameId}`;
    try {
      const raw = localStorage.getItem(this.#key);
      if (raw) this.balance = Number(JSON.parse(raw).balance) || this.balance;
    } catch { /* sin storage: arranca con el saldo de práctica */ }
    return this.balance;
  }

  #save(): void {
    try {
      localStorage.setItem(this.#key, JSON.stringify({ balance: this.balance }));
    } catch { /* sin storage */ }
  }

  async debit(amount: number): Promise<boolean> {
    if (this.balance < amount) return false;
    this.balance -= amount;
    this.#save();
    return true;
  }

  async settle(_staked: number, returned: number): Promise<void> {
    this.balance += returned;
    this.#save();
  }

  busy(): void {}
}

export function createWallet(): Wallet {
  const embedded = new URLSearchParams(location.search).get('wallet') === 'parent' && window.parent !== window;
  return embedded ? new ParentWallet() : new LocalWallet();
}

/**
 * Una jugada a medias, para retomarla si se recarga la página: lo que se
 * cobró ya se cobró, y la jugada tiene que terminar de liquidarse.
 */
export function savePending<T>(gameId: string, state: T | null): void {
  try {
    const key = `orig.pending.v1.${gameId}`;
    if (state) sessionStorage.setItem(key, JSON.stringify(state));
    else sessionStorage.removeItem(key);
  } catch { /* sin storage se pierde solo la recuperación */ }
}

export function loadPending<T>(gameId: string): T | null {
  try {
    const raw = sessionStorage.getItem(`orig.pending.v1.${gameId}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
