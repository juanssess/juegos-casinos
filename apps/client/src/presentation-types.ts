/**
 * El contrato de la capa de presentación (ver presentation.ts).
 *
 * Vive aparte porque `presentation.ts` es el archivo que el casino REEMPLAZA
 * con su versión ilustrada: la implementación del casino importa estos tipos
 * desde acá, que no se toca, y así sigue atada al mismo contrato.
 */

import type { Application, Graphics } from 'pixi.js';

import type { ClientGame } from './games.ts';

export interface Scenery {
  /**
   * Dibuja el fondo para un tamaño de pantalla. `bg` llega limpio y queda
   * POR ENCIMA de lo que el escenario haya agregado al stage: el orquestador
   * le pinta la viñeta después.
   */
  layout(bg: Graphics, w: number, h: number): void;
  /** El juego entra o sale de los giros gratis. */
  setFree(free: boolean): void;
}

export interface Presentation {
  /** Suavizado del renderer. Con arte de mapa de bits conviene; con vectores, no. */
  antialias: boolean;
  /** Carga lo que haga falta ANTES de crear las texturas de los símbolos. */
  preload(): Promise<void>;
  /** Crea el fondo. Lo que agregue al stage queda debajo de todo. */
  scenery(app: Application, profile: ClientGame): Scenery;
  /**
   * Arranca la función (el primer giro gratis). Puede tapar la pantalla y
   * esperar. Devuelve `true` si mostró algo que el jugador tuvo que cerrar:
   * en ese caso el orquestador deja de saltear, porque el jugador ya volvió
   * a mirar.
   */
  featureIntro(profile: ClientGame, spins: number): Promise<boolean>;
  /** El estado de "estamos en la función", mientras duren los giros gratis. */
  featureStart(profile: ClientGame): void;
  /** Termina la función con premio y giros jugados. Puede tapar la pantalla y esperar. */
  featureSummary(profile: ClientGame, spins: number, total: number): Promise<void>;
  /** Vuelve todo al juego normal. Se llama también si la ronda falla: tiene que ser idempotente. */
  featureEnd(): void;
}
