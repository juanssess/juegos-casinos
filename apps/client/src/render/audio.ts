/**
 * Sonido procedural con WebAudio. Cero assets: cada efecto se sintetiza.
 *
 * Un slot sin sonido está muerto — es probablemente la mitad de la sensación
 * de "juego de verdad". Con osciladores y envolventes se cubre todo el set
 * básico: golpe de rodillo, campanita de scatter, riser de expectativa,
 * conteo de premio y fanfarrias. El día que haya diseño de sonido real, se
 * reemplaza este archivo por samples y nada más.
 *
 * Los navegadores exigen un gesto del usuario antes de arrancar audio, por
 * eso `unlock()` se llama desde el primer click/tecla.
 */

const MASTER = 0.5;

export class SlotAudio {
  #ctx: AudioContext | null = null;
  #master: GainNode | null = null;
  #muted = false;
  #spin: { gain: GainNode; src: AudioBufferSourceNode } | null = null;
  #riser: { gain: GainNode; osc: OscillatorNode } | null = null;

  constructor() {
    try {
      this.#muted = localStorage.getItem('maverick.muted') === '1';
    } catch {
      // sin storage, arrancamos con sonido
    }
  }

  get muted(): boolean {
    return this.#muted;
  }

  setMuted(v: boolean): void {
    this.#muted = v;
    try {
      localStorage.setItem('maverick.muted', v ? '1' : '0');
    } catch {
      // no pasa nada
    }
    if (this.#master) this.#master.gain.value = v ? 0 : MASTER;
  }

  /** Crear/reanudar el contexto. Llamar en el primer gesto del usuario. */
  unlock(): void {
    if (this.#ctx) {
      if (this.#ctx.state === 'suspended') void this.#ctx.resume();
      return;
    }
    try {
      this.#ctx = new AudioContext();
      this.#master = this.#ctx.createGain();
      this.#master.gain.value = this.#muted ? 0 : MASTER;
      this.#master.connect(this.#ctx.destination);
    } catch {
      this.#ctx = null;
    }
  }

  #ok(): boolean {
    return this.#ctx !== null && this.#master !== null && this.#ctx.state === 'running';
  }

  #now(): number {
    return this.#ctx!.currentTime;
  }

  /** Oscilador con envolvente. El ladrillo de todos los efectos. */
  #tone(
    type: OscillatorType,
    f0: number,
    f1: number,
    t0: number,
    dur: number,
    vol: number,
  ): void {
    const ctx = this.#ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(1, f0), t0);
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.#master!);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  click(): void {
    if (!this.#ok()) return;
    this.#tone('square', 1300, 900, this.#now(), 0.05, 0.1);
  }

  /** Ruido filtrado en loop mientras giran los rodillos. */
  spinStart(): void {
    if (!this.#ok() || this.#spin) return;
    const ctx = this.#ctx!;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, this.#now());
    gain.gain.linearRampToValueAtTime(0.045, this.#now() + 0.12);
    src.connect(filter).connect(gain).connect(this.#master!);
    src.start();
    this.#spin = { gain, src };
  }

  spinEnd(): void {
    if (!this.#spin) return;
    const { gain, src } = this.#spin;
    this.#spin = null;
    gain.gain.linearRampToValueAtTime(0, this.#now() + 0.1);
    src.stop(this.#now() + 0.15);
  }

  /** Golpe seco al frenar cada rodillo. */
  reelStop(): void {
    if (!this.#ok()) return;
    this.#tone('sine', 150, 55, this.#now(), 0.1, 0.45);
    this.#tone('triangle', 2400, 1800, this.#now(), 0.03, 0.06);
  }

  /** Campanita al caer un scatter; sube de tono con cada uno. */
  scatterHit(count: number): void {
    if (!this.#ok()) return;
    const base = 660 * Math.pow(1.25, count);
    this.#tone('sine', base, base, this.#now(), 0.35, 0.28);
    this.#tone('sine', base * 1.5, base * 1.5, this.#now() + 0.03, 0.4, 0.18);
  }

  /** Riser de expectativa: sube mientras el rodillo lento "duda". */
  anticipationStart(): void {
    if (!this.#ok() || this.#riser) return;
    const ctx = this.#ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.#now());
    osc.frequency.linearRampToValueAtTime(520, this.#now() + 1.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, this.#now());
    gain.gain.linearRampToValueAtTime(0.08, this.#now() + 0.25);
    osc.connect(filter).connect(gain).connect(this.#master!);
    osc.start();
    this.#riser = { gain, osc };
  }

  anticipationEnd(): void {
    if (!this.#riser) return;
    const { gain, osc } = this.#riser;
    this.#riser = null;
    gain.gain.linearRampToValueAtTime(0, this.#now() + 0.08);
    osc.stop(this.#now() + 0.12);
  }

  /** Ráfaga de ticks que acompaña el conteo del premio. */
  countTicks(durationMs: number): void {
    if (!this.#ok()) return;
    const n = Math.min(24, Math.floor(durationMs / 45));
    for (let i = 0; i < n; i++) {
      const f = 1500 + (i / n) * 900;
      this.#tone('square', f, f, this.#now() + i * 0.045, 0.03, 0.045);
    }
  }

  /** Acorde corto de premio; más largo si el premio es grande. */
  win(x: number): void {
    if (!this.#ok()) return;
    const notes = x >= 5 ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    notes.forEach((f, i) => this.#tone('triangle', f, f, this.#now() + i * 0.09, 0.3, 0.2));
  }

  /** Fanfarria de giros gratis. */
  freeSpins(): void {
    if (!this.#ok()) return;
    [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      this.#tone('triangle', f, f, this.#now() + i * 0.12, 0.45, 0.22);
      this.#tone('sine', f * 2, f * 2, this.#now() + i * 0.12, 0.3, 0.07);
    });
  }

  /** Tambor grave de suspenso, uno por escalón de la Escalinata. */
  drum(): void {
    if (!this.#ok()) return;
    this.#tone('sine', 90, 50, this.#now(), 0.22, 0.55);
    this.#tone('triangle', 180, 90, this.#now(), 0.1, 0.15);
  }

  /** Subió un escalón: nota que asciende con el nivel. */
  climbUp(tier: number): void {
    if (!this.#ok()) return;
    const f = 440 * Math.pow(1.19, tier);
    this.#tone('triangle', f, f, this.#now(), 0.3, 0.3);
    this.#tone('sine', f * 2, f * 2, this.#now() + 0.04, 0.25, 0.12);
  }

  /** Se plantó: golpe seco, sin drama — igual ganó algo. */
  climbStop(): void {
    if (!this.#ok()) return;
    this.#tone('sine', 200, 90, this.#now(), 0.28, 0.4);
  }

  /** Llegó a la cima: mini fanfarria brillante. */
  climbTop(): void {
    if (!this.#ok()) return;
    [880, 1108.7, 1318.5, 1760].forEach((f, i) => {
      this.#tone('triangle', f, f, this.#now() + i * 0.09, 0.4, 0.25);
    });
  }

  /** Celebración de premio grande; `tier` 1..3 alarga la escalera. */
  bigWin(tier: number): void {
    if (!this.#ok()) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5, 1568];
    const n = 6 + tier * 3;
    for (let i = 0; i < n; i++) {
      const f = scale[i % scale.length]! * (1 + Math.floor(i / scale.length));
      this.#tone('triangle', f, f, this.#now() + i * 0.08, 0.4, 0.18);
    }
    this.#tone('sine', 80, 45, this.#now(), 0.5, 0.45);
  }
}

export const audio = new SlotAudio();
