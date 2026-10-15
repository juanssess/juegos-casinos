/**
 * El manifest de un juego: TODO lo que un juego es, en un solo lugar.
 *
 * Antes sumar un juego era tocar cuatro archivos a mano —el registro de las
 * herramientas, el del cliente, el tema y la ficha— y cada dato vivía en dos
 * lados: el RTP, por ejemplo, estaba medido en la ficha y escrito a mano en
 * el cliente. Dos copias de un número son dos números, y tarde o temprano no
 * coinciden.
 *
 * Ahora cada paquete de juego exporta un `MANIFEST` desde `src/manifest.ts`,
 * y las herramientas y el cliente lo DESCUBREN: no hay registro que
 * mantener. El RTP y la volatilidad que se publican salen de `qa.ts`, que
 * escribe `npm run qa` y nadie edita a mano.
 *
 * Es una unión discriminada por `kind` por el mismo motivo que antes lo era
 * el registro de herramientas: un juego de racimos no se mide ni se resuelve
 * igual que uno de líneas.
 */

import type { SlotGameDef, SymbolId } from './types.ts';
import type { ClusterGameDef } from './cluster.ts';
import type { RoundEngine } from './round.ts';
import type { FreqReport } from './tune.ts';
import type { ClusterFreqReport } from './cluster-tune.ts';

/** Colores del juego. El render los lee; la matemática no los usa. */
export interface Palette {
  bgTop: number;
  bgBottom: number;
  frame: number;
  frameLight: number;
  reelBg: number;
  reelBgAlt: number;
  text: number;
  textDim: number;
  win: number;
  bigWin: number;
  scatter: number;
  /** Solo en juegos con multiplicadores; cae al color de premio si falta. */
  mult?: number;
}

/** Tiempos de presentación, en milisegundos. */
export interface Timing {
  firstReelStop: number;
  reelStagger: number;
  anticipationExtra: number;
  spinSpeed: number;
  anticipationSpeed: number;
  bounce: number;
  winCycle: number;
  countUp: number;
  freeSpinGap: number;
  wildReveal?: number;
}

/** Lo que exporta el `theme.ts` de cada juego. */
export interface GameTheme {
  TITLE: string;
  SKIN: Partial<Record<SymbolId, { label: string }>>;
  PALETTE: Palette;
  TIMING: Timing;
}

/**
 * Lo que el cliente necesita del juego y NO es dibujo. Los símbolos y la
 * escenografía son código de Pixi y viven en `apps/client/src/skins/<id>.ts`.
 */
export interface ClientSettings {
  betLevels: readonly number[];
  /** Tamaño de celda en píxeles: más columnas o filas, celda más chica. */
  cellSize: number;
  /** Texto del pie, después del RTP. */
  tagline: string;
  /** Subtítulo del cartel de expectativa ("un chupetín más"). */
  nearMiss?: string;
  /** Subtítulo del cartel de giros gratis en un juego de racimos. */
  freeIntro?: string;
  /** Juegos con BOMBAS: color de la etiqueta según el valor. */
  valueColor?: (v: number) => number;
  /** Tinte del fondo pintado durante la función (se ilumina hacia este color). */
  featureTint?: number;
  /** Una frase sobre la función, para la pantalla de entrada del bonus. */
  featureDetail?: string;
}

/** Un control del QA. Los `error` frenan la publicación; los `warn` no. */
export interface QaCheck {
  id: string;
  level: 'error' | 'warn';
  ok: boolean;
  msg: string;
}

/**
 * El resultado de `npm run qa`, tal como queda en `src/qa.ts`.
 *
 * `sourceHash` es la huella de los archivos que definen la matemática. Si
 * alguien toca una tira o un precio después del QA, la huella ya no coincide
 * y el juego no se publica hasta volver a medirlo.
 */
export interface QaSummary {
  date: string;
  sourceHash: string;
  rounds: number;
  targetRtp: number;
  rtp: number;
  /** Medio ancho del intervalo de 95 %, en fracción (0,001 = 0,1 puntos). */
  rtpCi: number;
  rtpBase: number;
  rtpFeature: number;
  hitFrequency: number;
  triggerOneIn: number;
  freeSpinsPerTrigger: number;
  stdDev: number;
  volatilityIndex: number;
  volatilityLabel: string;
  /** Tope declarado por el juego, si tiene. */
  maxWinX: number | null;
  /** El mayor premio visto en toda la medición (rondas y compras). */
  maxObservedX: number;
  buy: { variant: string; label: string; priceX: number; ev: number; evCi: number; rtp: number; buys: number }[];
  ante: { costX: number; rtp: number; rtpCi: number; triggerOneIn: number; rounds: number } | null;
  checks: QaCheck[];
  passed: boolean;
}

interface ManifestBase {
  id: string;
  theme: GameTheme;
  client: ClientSettings;
  engine: () => RoundEngine;
  targetRtp: number;
  /** Precio de la compra simple, en veces la apuesta. Las variantes traen el suyo. */
  bonusBuyX: number;
  shares: Partial<Record<SymbolId, number>>;
  shape: Partial<Record<SymbolId, readonly number[]>>;
  /** `null` hasta que el juego pase por `npm run qa`. */
  qa: QaSummary | null;
  /** Dirección de arte (`src/art.ts`). Los archivos están en `art/`. */
  art: ArtDirection;
}

export interface LinesManifest extends ManifestBase {
  kind: 'lines';
  game: SlotGameDef;
  measure: (opts: { rounds: number; seed?: number }) => FreqReport;
}

export interface ClusterManifest extends ManifestBase {
  kind: 'cluster';
  game: ClusterGameDef;
  measure: (opts: { rounds: number; seed?: number }) => ClusterFreqReport;
}

export type GameManifest = LinesManifest | ClusterManifest;

/**
 * El arte pintado de un juego: lo que hay en `packages/games/<id>/art/`.
 *
 * `art.json` lo escribe `npm run art -- cut` y lo lee el cliente; la
 * dirección de arte (qué es cada símbolo, cómo es la escena) la escribe una
 * persona en `src/art.ts` y de ahí salen los pedidos para generar.
 */
export interface ArtFile {
  /** Atlas de símbolos: grilla regular, celdas cuadradas. */
  symbols: { file: string; cols: number; rows: number; cell: number; order: SymbolId[] };
  /** Escena de fondo, cuadrada; el centro queda oscuro para el tablero. */
  scene: string;
  /** De dónde salió: 'gamma', 'casino' (migrado del casino) o 'molde:<id>'. */
  source: string;
  /** Arte prestado (del molde de new-game): se juega, pero no se publica. */
  provisional: boolean;
  date: string;
  /**
   * Cómo se recortó la hoja de `art/source/`, para poder repetirlo
   * (`npm run art -- recut`): grilla de la hoja, celda → símbolo y las zonas
   * protegidas por celda (lo que es objeto aunque tenga el color del fondo).
   */
  cut?: { cols: number; rows: number; cells: SymbolId[]; protect: Record<number, [number, number][]> };
}

export interface ArtDirection {
  /** Qué es cada símbolo, en inglés (el generador entiende mejor). */
  symbols: Partial<Record<SymbolId, string>>;
  /** La escena de fondo. */
  scene: string;
}
