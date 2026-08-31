/**
 * Generadores de números aleatorios.
 *
 * Hay DOS y no es lo mismo:
 *
 *  - `Sfc32Rng`: PRNG rápido y con semilla. Se usa SOLO para simulación,
 *    tests y replays deterministas. Nunca para jugar por plata.
 *  - `CryptoRng`: CSPRNG del sistema. Es el único que puede resolver
 *    una ronda real. Es lo que un laboratorio (GLI/BMM) va a auditar.
 *
 * El motor recibe un `Rng` inyectado y no sabe cuál le tocó. Eso permite
 * simular 10^8 giros deterministas y correr en producción con el mismo código.
 */

export interface Rng {
  /** Entero uniforme en [0, max). `max` debe ser > 0. */
  nextInt(max: number): number;
}

/**
 * sfc32 — pequeño, rápido y de buena calidad estadística.
 * Suficiente para estimar RTP; NO apto para dinero real.
 */
export class Sfc32Rng implements Rng {
  #a: number;
  #b: number;
  #c: number;
  #d: number;

  constructor(seed = 0x9e3779b9) {
    // Dispersamos la semilla para no arrancar en un estado degenerado.
    this.#a = seed >>> 0;
    this.#b = (seed ^ 0x85ebca6b) >>> 0;
    this.#c = (seed ^ 0xc2b2ae35) >>> 0;
    this.#d = (seed ^ 0x27d4eb2f) >>> 0;
    // Warm-up: descartamos los primeros valores, muy correlacionados.
    for (let i = 0; i < 20; i++) this.next();
  }

  /** Siguiente uint32. */
  next(): number {
    const a = this.#a;
    const b = this.#b;
    const c = this.#c;
    const d = this.#d;
    const t = (a + b) >>> 0;
    this.#a = b ^ (b >>> 9);
    this.#b = (c + (c << 3)) >>> 0;
    this.#c = ((c << 21) | (c >>> 11)) >>> 0;
    this.#d = (d + 1) >>> 0;
    const r = (t + this.#d) >>> 0;
    this.#c = (this.#c + r) >>> 0;
    return r;
  }

  nextInt(max: number): number {
    // Escalado directo. Introduce un sesgo de orden 2^-32, despreciable
    // para simulación (y por eso mismo prohibido en producción).
    return Math.floor((this.next() / 0x100000000) * max);
  }
}

/**
 * RNG criptográfico con rechazo de módulo (sin sesgo).
 * Este es el que va a producción.
 *
 * Usa `crypto.getRandomValues`, que existe igual en Node y en el navegador.
 * Eso hace que el motor corra sin cambios en el servidor y en el RGS local del
 * cliente — el mismo código resuelve la ronda en los dos lados.
 */
export class CryptoRng implements Rng {
  #buf = new Uint32Array(256);
  #pos = this.#buf.length;

  #nextUint32(): number {
    if (this.#pos >= this.#buf.length) {
      globalThis.crypto.getRandomValues(this.#buf);
      this.#pos = 0;
    }
    return this.#buf[this.#pos++]!;
  }

  nextInt(max: number): number {
    if (max <= 0) throw new RangeError('max debe ser > 0');
    // Rechazo de módulo: descartamos el tramo que sesgaría el reparto.
    const limit = Math.floor(0x100000000 / max) * max;
    let v: number;
    do {
      v = this.#nextUint32();
    } while (v >= limit);
    return v % max;
  }
}
