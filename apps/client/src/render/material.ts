/**
 * Material: lo que separa un juego de casino de uno de arcade.
 *
 * Los símbolos estaban dibujados con rellenos planos. Una figura plana se
 * lee como una calcomanía pegada sobre el fondo, y una grilla de
 * calcomanías se lee como arcade. Un símbolo de tragamonedas de verdad se
 * lee como un OBJETO: tiene volumen, está hecho de algo, y lo ilumina la
 * misma luz que a todos los demás.
 *
 * ---------------------------------------------------------------------
 * LA RECETA
 * ---------------------------------------------------------------------
 * Tres capas, siempre en el mismo orden:
 *
 *   1. SOPORTE     un medallón o una placa tallada donde apoya la figura.
 *                  Es lo que le da un lugar en el mueble en vez de flotar.
 *   2. FIGURA      el dibujo de siempre, ahora con relleno degradado.
 *   3. LUZ         un velo claro arriba y viñeta abajo, IGUAL para todos.
 *
 * El punto tres es el que más rinde y el más fácil de saltear. Que la luz
 * venga siempre de arriba y a la izquierda, con la misma fuerza en los
 * once símbolos, es lo que hace que la grilla parezca un solo objeto
 * fotografiado y no once dibujos juntados. Un casino no se distingue por
 * dibujar mejor: se distingue por iluminar consistente.
 *
 * ---------------------------------------------------------------------
 * POR QUÉ ACÁ Y NO EN CADA JUEGO
 * ---------------------------------------------------------------------
 * Maverick y Se Busca tienen paletas y figuras distintas, pero el material
 * es el mismo oficio. Duplicarlo garantizaba que el día que se afinara la
 * luz en uno, el otro quedara distinto — y dos juegos de la misma casa que
 * iluminan distinto se notan enseguida.
 */

import { FillGradient, Graphics } from 'pixi.js';

/** Todos los símbolos viven en un cuadrado de 100×100 centrado en 0,0. */
export const U = 50;

/* ============================================================
   GRADIENTES
   ============================================================ */

/** Degradado vertical sobre el alto de la figura. */
export function vgrad(stops: readonly (readonly [number, number])[]): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  });
}

/**
 * Degradado diagonal: la luz entra por arriba a la izquierda.
 *
 * Es la dirección que usan todos los símbolos del juego. Tenerla en una
 * función y no suelta en cada dibujo es lo que garantiza que no se
 * contradigan entre sí.
 */
export function lit(stops: readonly (readonly [number, number])[]): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: 0.15, y: 0 },
    end: { x: 0.85, y: 1 },
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  });
}

/** Degradado radial, para brillos y viñetas. */
export function rgrad(stops: readonly (readonly [number, number])[]): FillGradient {
  return new FillGradient({
    type: 'radial',
    center: { x: 0.5, y: 0.5 },
    innerRadius: 0,
    outerCenter: { x: 0.5, y: 0.5 },
    outerRadius: 0.5,
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  });
}

/**
 * Metal: oscuro, claro, oscuro, con un destello arriba.
 *
 * Un degradado de dos paradas se lee como plástico. Lo que hace que algo
 * parezca metal es la banda clara ESTRECHA en el medio —el reflejo del
 * horizonte— con oscuro arriba y abajo.
 */
export function metal(dark: number, mid: number, light: number): FillGradient {
  return vgrad([
    [0, dark],
    [0.28, mid],
    [0.42, light],
    [0.52, mid],
    [1, dark],
  ]);
}

/* ============================================================
   PIEZAS
   ============================================================ */

/** Sombra de contacto: apoya la figura en el rodillo. */
export function contactShadow(g: Graphics, r = U * 0.72): void {
  g.ellipse(0, U * 0.16, r, r * 0.9).fill({ color: 0x000000, alpha: 0.3 });
  g.ellipse(0, U * 0.22, r * 0.6, r * 0.34).fill({ color: 0x000000, alpha: 0.26 });
}

export interface MedallionOpts {
  /** Radio exterior. */
  r?: number;
  /** Metal del aro. */
  ring?: readonly [number, number, number];
  /** Fondo del hueco donde apoya la figura. */
  well?: readonly [number, number];
}

/**
 * Medallón: el disco tallado donde apoyan los símbolos altos.
 *
 * El aro lleva metal de verdad y el hueco es más oscuro que el fondo del
 * rodillo. Ese contraste es lo que hace que la figura se lea DENTRO de
 * algo, que es la diferencia entre un objeto y una calcomanía.
 */
export function medallion(g: Graphics, o: MedallionOpts = {}): void {
  const r = o.r ?? U * 0.86;
  const ring = o.ring ?? [0x6b4a1c, 0xa87a2e, 0xf0cf7a];
  const well = o.well ?? [0x281c10, 0x120c07];

  // Aro exterior con metal.
  g.circle(0, 0, r).fill(metal(ring[0], ring[1], ring[2]));

  // Filo oscuro: sin esto el aro se funde con el fondo del rodillo.
  g.circle(0, 0, r).stroke({ width: 2, color: 0x120c06, alpha: 0.85 });

  // Hueco interior, más oscuro arriba que abajo: luz cenital.
  g.circle(0, 0, r * 0.82).fill(vgrad([[0, well[0]], [1, well[1]]]));

  // Filo interno claro abajo: la luz rebota en el fondo del hueco.
  g.arc(0, 0, r * 0.82, 0.25, Math.PI - 0.25)
    .stroke({ width: 1.6, color: ring[2], alpha: 0.32 });

  // Destello del aro arriba a la izquierda.
  g.arc(0, 0, r * 0.91, Math.PI * 1.08, Math.PI * 1.62)
    .stroke({ width: r * 0.1, color: 0xffffff, alpha: 0.16 });
}

export interface PlaqueOpts {
  w?: number;
  h?: number;
  radius?: number;
  /** Piedra del cuerpo. */
  stone?: readonly [number, number];
  /** Filo tallado. */
  edge?: number;
}

/**
 * Placa de piedra: el soporte de los naipes (10, J, Q, K, A).
 *
 * Los naipes son el 60% de lo que aparece en pantalla. Si se leen como
 * letras sueltas, el juego entero se lee barato por mucho que los altos
 * estén bien. Acá son piedra tallada con bisel.
 */
export function plaque(g: Graphics, o: PlaqueOpts = {}): void {
  const w = o.w ?? U * 1.16;
  const h = o.h ?? U * 1.44;
  const rad = o.radius ?? 8;
  /* PIEDRA CLARA, NO OSCURA.
     La primera version era piedra oscura, y en una grilla oscura cinco
     placas oscuras se leen como agujeros: la mirada las saltea. Se vio
     comparando con Se Busca, donde los naipes salieron marfil y de golpe
     la grilla tuvo ritmo —claro contra metal oscuro— en vez de ser una
     mancha pareja.
     La misma leccion vale aca: los naipes son el respiro entre los altos,
     y para eso tienen que ser LO MAS CLARO de la pantalla. */
  const stone = o.stone ?? [0xcfbb96, 0x8c7550];
  const edge = o.edge ?? 0x5c4526;

  const x = -w / 2;
  const y = -h / 2;

  // Cuerpo de piedra.
  g.roundRect(x, y, w, h, rad).fill(vgrad([[0, stone[0]], [1, stone[1]]]));

  // Bisel: claro arriba, oscuro abajo. Dos trazos, no un borde parejo —
  // un borde del mismo color en los cuatro lados se lee plano.
  g.moveTo(x + rad, y + 1.2)
    .lineTo(x + w - rad, y + 1.2)
    .stroke({ width: 2.2, color: 0xfff4dc, alpha: 0.6 });
  g.moveTo(x + rad, y + h - 1.2)
    .lineTo(x + w - rad, y + h - 1.2)
    .stroke({ width: 2.2, color: 0x000000, alpha: 0.5 });
  g.roundRect(x, y, w, h, rad).stroke({ width: 1.6, color: edge, alpha: 0.4 });

  // Remaches en las esquinas: textura de piedra sin robar atención.
  for (const [rx, ry] of [
    [x + 7, y + 7], [x + w - 7, y + 7],
    [x + 7, y + h - 7], [x + w - 7, y + h - 7],
  ] as const) {
    g.circle(rx, ry, 2.1).fill({ color: edge, alpha: 0.4 });
    g.circle(rx - 0.5, ry - 0.5, 1).fill({ color: 0xffffff, alpha: 0.16 });
  }
}

/* ============================================================
   LA LUZ — la capa que unifica
   ============================================================ */

/**
 * Velo de luz arriba y viñeta abajo, idéntico en todos los símbolos.
 *
 * Va SIEMPRE al final, encima de todo. Es lo que hace que once dibujos
 * distintos parezcan once objetos bajo la misma lámpara.
 */
export function lighting(g: Graphics, r = U * 0.9): void {
  // Luz cenital.
  g.ellipse(-U * 0.16, -U * 0.42, r * 0.78, r * 0.5)
    .fill(rgrad([[0, 0xffffff], [1, 0x000000]]));
  g.alpha = 1;

  // Viñeta: oscurece los bordes para que el centro adelante.
  g.circle(0, 0, r * 1.12).fill(rgrad([[0.62, 0x000000], [1, 0x000000]]));
}

/**
 * La luz se aplica en dos capas con mezcla distinta, así que va en dos
 * Graphics separados y con su propio alpha. Devuelve ambos.
 */
export function makeLighting(r = U * 0.9): { glow: Graphics; vignette: Graphics } {
  const glow = new Graphics();
  glow.ellipse(-U * 0.14, -U * 0.4, r * 0.8, r * 0.52)
    .fill(rgrad([[0, 0xffffff], [0.55, 0x2e2e2e], [1, 0x000000]]));
  glow.blendMode = 'add';
  glow.alpha = 0.2;

  /* OJO CON EL SENTIDO. En modo multiply el NEGRO oscurece y el blanco deja
     pasar. La primera version tenia negro en el centro y blanco en el borde,
     o sea que apagaba el medio de cada simbolo —justo donde esta la figura—
     y dejaba los bordes intactos. Es la vinieta al reves, y de lejos parece
     nada mas que "esta oscuro". */
  const vignette = new Graphics();
  vignette.circle(0, 0, r * 1.15)
    .fill(rgrad([[0.5, 0xffffff], [1, 0x2a2a2a]]));
  /* Calibrado mirando la grilla, no eligiendo un numero lindo. A 0,55 la
     vinieta apagaba las figuras: el jaguar perdia el naranja y los naipes
     quedaban grises. La vinieta tiene que hundir los BORDES, no bajarle el
     volumen al simbolo. */
  vignette.blendMode = 'multiply';
  vignette.alpha = 0.3;

  return { glow, vignette };
}
