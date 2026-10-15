/**
 * Símbolos de El Kiosco, dibujados proceduralmente.
 *
 * Mismo oficio que en los otros tres —volumen, degradado y la MISMA luz para
 * todos— con una regla propia que sale de la mecánica: acá un premio son
 * ocho iguales desparramados por la grilla, y el jugador los cuenta con la
 * mirada. Cada símbolo tiene que ser reconocible SOLO, en una celda, sin el
 * grupo que en La Vendimia ayuda a leer la forma.
 *
 * Por eso, como en La Vendimia, los comunes van sin medallón (treinta celdas
 * con aro son una reja) y el aro queda para los dos especiales.
 *
 * Y una regla de MATERIAL que hace el trabajo de la jerarquía:
 *
 *   GOLOSINAS (altos)   envoltorio, chocolate, brillo duro y chico.
 *   FRUTAS (bajos)      piel mate: brillo grande y suave.
 *
 * Es la diferencia entre un papel metalizado y una manzana, y se lee de
 * lejos sin mirar la tabla.
 */

import { Container, Graphics, Rectangle, type Application, type Texture } from 'pixi.js';
import { U, contactShadow, medallion, vgrad, metal, makeLighting } from './material.ts';
import { SYM, type SymbolId } from '@casino/math';
import { SKIN } from '@casino/game-kiosco/theme';

/** Brillo duro de golosina: chico, neto, casi blanco. */
function hardShine(g: Graphics, x: number, y: number, w: number, h: number): void {
  g.ellipse(x, y, w, h).fill({ color: 0xffffff, alpha: 0.55 });
  g.ellipse(x - w * 0.25, y - h * 0.2, w * 0.4, h * 0.4).fill({ color: 0xffffff, alpha: 0.85 });
}

/** Brillo de fruta: grande y difuso, sin punto blanco. */
function softShine(g: Graphics, x: number, y: number, r: number): void {
  g.ellipse(x, y, r, r * 0.7).fill({ color: 0xffffff, alpha: 0.18 });
  g.ellipse(x, y, r * 0.55, r * 0.4).fill({ color: 0xffffff, alpha: 0.16 });
}

/* ============================================================
   LAS CUATRO GOLOSINAS
   ============================================================ */

/**
 * H1 — Alfajor. La silueta más ancha y baja del set: un disco de canto.
 *
 * Se dibuja en tres cuartos —la tapa de arriba como elipse y el canto
 * visible— porque visto de frente es un círculo marrón, y un círculo marrón
 * no es un alfajor: es una galletita. Lo que lo vuelve ALFAJOR es el canto
 * con las dos tapas y el dulce de leche asomando entre medio.
 */
function drawAlfajor(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const choco = vgrad([[0, 0x8a5230], [0.5, color], [1, 0x2a1408]]);

  // Canto de abajo: la tapa inferior.
  g.ellipse(0, 18, 38, 14).fill(0x24110a);
  g.rect(-38, 6, 76, 12).fill(vgrad([[0, 0x4a2814], [1, 0x24110a]]));

  // El dulce de leche asomando: la franja que lo dice todo.
  g.rect(-37, 0, 74, 8).fill(vgrad([[0, 0xe8b46a], [1, 0xa86a2a]]));
  for (const x of [-26, -10, 8, 24]) {
    g.ellipse(x, 7.5, 5, 2.6).fill({ color: 0xd99a4c, alpha: 0.9 });
  }

  // Canto de la tapa de arriba.
  g.rect(-38, -10, 76, 11).fill(vgrad([[0, 0x6b3a1c], [1, 0x3a1d0c]]));

  // La tapa, con el baño de chocolate.
  g.ellipse(0, -10, 38, 14).fill(choco);
  g.ellipse(0, -10, 38, 14).stroke({ width: 1.4, color: 0x1a0c05, alpha: 0.7 });

  // Hilos de chocolate cruzados: el baño hecho a mano.
  for (const k of [-1, 0, 1]) {
    g.moveTo(-24 + k * 10, -18).bezierCurveTo(-8 + k * 10, -6, 6 + k * 10, -16, 22 + k * 10, -4)
      .stroke({ width: 1.6, color: 0x2a1408, alpha: 0.5 });
  }

  // Sello dorado arriba: el detalle "de lujo" que lo separa de la galletita.
  g.ellipse(0, -11, 11, 4.6).fill(metal(0x7a5418, accent, 0xfff3c0));
  g.ellipse(0, -11, 11, 4.6).stroke({ width: 1, color: 0x5a3a0c, alpha: 0.8 });

  // Brillo duro sobre el chocolate.
  hardShine(g, -18, -16, 9, 3);

  c.addChild(g);
}

/**
 * H2 — Bombón con forma de corazón, envuelto en papel rojo metalizado.
 *
 * El corazón es la única silueta con punta abajo del set (la sandía tiene
 * punta, pero es una cuña plana con cáscara). El papel metalizado se hace
 * con FACETAS: bandas claras y oscuras alternadas, que es lo que hace el
 * papel arrugado bajo una lámpara.
 */
function drawBonbon(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const corazon = (k: number): void => {
    g.moveTo(0, 36 * k)
      .bezierCurveTo(-30 * k, 16 * k, -42 * k, -4 * k, -38 * k, -20 * k)
      .bezierCurveTo(-34 * k, -38 * k, -10 * k, -42 * k, 0, -24 * k)
      .bezierCurveTo(10 * k, -42 * k, 34 * k, -38 * k, 38 * k, -20 * k)
      .bezierCurveTo(42 * k, -4 * k, 30 * k, 16 * k, 0, 36 * k);
  };

  corazon(1);
  g.fill(vgrad([[0, accent], [0.35, color], [0.7, 0x8a0a1c], [1, 0x4a0510]]));

  // Facetas del papel: el metalizado.
  for (const [x0, y0, x1, y1, a] of [
    [-30, -24, -10, 20, 0.22], [-14, -32, 6, 26, 0.12], [8, -30, 26, 6, 0.2], [20, -22, 32, -2, 0.1],
  ] as const) {
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 4, color: 0xffffff, alpha: a, cap: 'round' });
  }
  for (const [x0, y0, x1, y1] of [[-22, -30, -2, 30], [2, -24, 18, 18]] as const) {
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 3, color: 0x3a0008, alpha: 0.25, cap: 'round' });
  }

  corazon(1);
  g.stroke({ width: 1.6, color: 0x3a0008, alpha: 0.8 });

  // Cinta dorada cruzada con moño: lo que lo vuelve regalo y no emoji.
  g.moveTo(-34, -10).lineTo(34, -10).stroke({ width: 4, color: 0xd9a441 });
  g.moveTo(-34, -11.5).lineTo(34, -11.5).stroke({ width: 1, color: 0xfff0bd, alpha: 0.6 });
  g.ellipse(-8, -12, 8, 5).fill(metal(0x7a5418, 0xd9a441, 0xfff0bd));
  g.ellipse(8, -12, 8, 5).fill(metal(0x7a5418, 0xd9a441, 0xfff0bd));
  g.circle(0, -11, 4).fill(metal(0x7a5418, 0xe8c264, 0xffffff));

  hardShine(g, -22, -24, 6, 4);

  c.addChild(g);
}

/**
 * H3 — Caramelo masticable envuelto: el "moño" con las puntas retorcidas.
 *
 * Es la silueta horizontal más reconocible que existe para "caramelo", y la
 * única del set con forma de moño. Las rayas del papel giran con el cuerpo:
 * sin eso se lee como un caramelo dibujado y no como uno envuelto.
 */
function drawCandy(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const papel = vgrad([[0, accent], [0.4, color], [1, 0x8a3a04]]);

  // Las dos puntas retorcidas, primero (van detrás del cuerpo).
  for (const s of [-1, 1] as const) {
    g.poly([
      s * 22, -8,
      s * 44, -22,
      s * 40, -6,
      s * 47, 2,
      s * 40, 8,
      s * 44, 22,
      s * 22, 8,
    ]).fill(papel);
    g.poly([s * 22, -8, s * 44, -22, s * 40, -6, s * 47, 2, s * 40, 8, s * 44, 22, s * 22, 8])
      .stroke({ width: 1.2, color: 0x6b2a02, alpha: 0.6 });
    // Pliegues del papel retorcido.
    g.moveTo(s * 25, -4).lineTo(s * 42, -14).stroke({ width: 1.2, color: 0x6b2a02, alpha: 0.4 });
    g.moveTo(s * 25, 4).lineTo(s * 42, 14).stroke({ width: 1.2, color: 0x6b2a02, alpha: 0.4 });
    // El nudo, donde el papel se aprieta.
    g.roundRect(s * 22 - 3, -9, 6, 18, 2).fill(metal(0x8a3a04, color, accent));
  }

  // Cuerpo: un óvalo gordo.
  g.ellipse(0, 0, 24, 20).fill(papel);

  // Rayas en espiral del envoltorio.
  for (const x of [-14, -2, 10]) {
    g.moveTo(x - 4, -19).bezierCurveTo(x + 6, -8, x - 4, 8, x + 6, 19)
      .stroke({ width: 4.2, color: 0xfff4dc, alpha: 0.55 });
  }
  g.ellipse(0, 0, 24, 20).stroke({ width: 1.6, color: 0x6b2a02, alpha: 0.75 });

  hardShine(g, -10, -10, 7, 4);

  c.addChild(g);
}

/**
 * H4 — Chicle globo: una bola celeste de máquina expendedora.
 *
 * La única esfera de color frío del set, y por eso la más fácil de contar
 * en una grilla llena de rojos y naranjas. Lleva el brillo más duro de
 * todos: es caramelo duro laqueado, no fruta.
 */
function drawGum(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  g.circle(0, 2, 34).fill(vgrad([[0, accent], [0.3, color], [0.8, 0x0e5a7a], [1, 0x06324a]]));
  g.circle(0, 2, 34).stroke({ width: 1.8, color: 0x042436, alpha: 0.85 });

  // Motitas de azúcar: textura sin perder la silueta.
  for (const [x, y] of [[-12, 14], [10, 18], [18, -4], [-20, -2], [2, 26], [22, 12], [-4, 8]] as const) {
    g.circle(x, y, 1.6).fill({ color: 0xffffff, alpha: 0.35 });
  }

  // Rebote de luz abajo a la derecha: lo que la vuelve esfera.
  g.arc(0, 2, 27, 0.35, 1.3).stroke({ width: 4.5, color: 0x7fe0ff, alpha: 0.35 });

  // El brillo de laca: grande y nítido.
  g.ellipse(-13, -14, 12, 8).fill({ color: 0xffffff, alpha: 0.5 });
  g.ellipse(-16, -17, 5, 3.4).fill({ color: 0xffffff, alpha: 0.9 });

  c.addChild(g);
}

/* ============================================================
   LAS CINCO FRUTAS
   ============================================================ */

/** L1 — Manzana verde. Redonda con el hundido de arriba y su cabito. */
function drawApple(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const piel = vgrad([[0, accent], [0.45, color], [1, 0x24500c]]);

  // Dos lóbulos que se juntan arriba: el hundido de la manzana.
  g.moveTo(0, -22)
    .bezierCurveTo(-14, -34, -38, -28, -36, 0)
    .bezierCurveTo(-34, 26, -14, 38, 0, 32)
    .bezierCurveTo(14, 38, 34, 26, 36, 0)
    .bezierCurveTo(38, -28, 14, -34, 0, -22)
    .fill(piel);
  g.moveTo(0, -22)
    .bezierCurveTo(-14, -34, -38, -28, -36, 0)
    .bezierCurveTo(-34, 26, -14, 38, 0, 32)
    .bezierCurveTo(14, 38, 34, 26, 36, 0)
    .bezierCurveTo(38, -28, 14, -34, 0, -22)
    .stroke({ width: 1.6, color: 0x1a3a08, alpha: 0.7 });

  // Pecas de la piel: mate, natural.
  for (const [x, y] of [[-16, 8], [12, 14], [20, -6], [-8, 20], [4, 2]] as const) {
    g.circle(x, y, 1.2).fill({ color: 0xe8f8c0, alpha: 0.4 });
  }

  // Cabito y hoja.
  g.moveTo(0, -22).quadraticCurveTo(2, -34, 6, -40)
    .stroke({ width: 3.4, color: 0x5a3818, cap: 'round' });
  g.moveTo(5, -32).bezierCurveTo(14, -44, 28, -40, 30, -34)
    .bezierCurveTo(22, -26, 10, -26, 5, -32).fill(0x3d8a2a);
  g.moveTo(7, -32).lineTo(26, -35).stroke({ width: 1, color: 0x1e5010, alpha: 0.6 });

  softShine(g, -16, -8, 12);

  c.addChild(g);
}

/** L2 — Ciruela. Óvalo azul casi negro con la "pruína" polvorienta. */
function drawPlum(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  g.ellipse(0, 4, 30, 35).fill(vgrad([[0, accent], [0.4, color], [1, 0x120a24]]));
  g.ellipse(0, 4, 30, 35).stroke({ width: 1.6, color: 0x0a0616, alpha: 0.8 });

  // La costura: el surco que separa a la ciruela de cualquier otra bola.
  g.moveTo(4, -30).bezierCurveTo(-10, -10, -8, 20, 2, 38)
    .stroke({ width: 2.2, color: 0x0e0820, alpha: 0.5 });

  // Pruína: el velo blanquecino que tiene la ciruela de verdad.
  g.ellipse(-8, -2, 18, 24).fill({ color: 0xc8c0f0, alpha: 0.1 });

  // Cabito corto.
  g.moveTo(3, -30).lineTo(6, -42).stroke({ width: 3, color: 0x5a3818, cap: 'round' });

  softShine(g, -12, -14, 10);

  c.addChild(g);
}

/**
 * L3 — Tajada de sandía. Una cuña: la única silueta triangular plana.
 * Roja con cáscara verde y semillas: se reconoce a cualquier tamaño.
 */
function drawMelon(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Cáscara: el arco grueso de abajo, verde con rayas.
  g.moveTo(-42, -6).arc(0, -6, 42, Math.PI, 0, true).closePath()
    .fill(vgrad([[0, 0x6fc04a], [0.5, accent], [1, 0x1a4a10]]));
  // La franja blanca entre cáscara y pulpa.
  g.moveTo(-37, -6).arc(0, -6, 37, Math.PI, 0, true).closePath().fill(0xf0f4d0);
  // La pulpa.
  g.moveTo(-34, -6).arc(0, -6, 34, Math.PI, 0, true).closePath()
    .fill(vgrad([[0, 0xff7a80], [0.4, color], [1, 0xa8182a]]));

  // Rayas de la cáscara.
  for (const a of [0.35, 0.8, 1.25, 1.7, 2.15, 2.6]) {
    const x0 = Math.cos(a) * 38;
    const y0 = -6 + Math.sin(a) * 38;
    const x1 = Math.cos(a) * 42;
    const y1 = -6 + Math.sin(a) * 42;
    g.moveTo(x0, y0).lineTo(x1, y1).stroke({ width: 3, color: 0x1a4a10, alpha: 0.6 });
  }

  // Semillas, en forma de gota.
  for (const [x, y] of [[-18, 4], [-6, 12], [8, 10], [20, 2], [-2, 22], [12, 20], [-14, 18]] as const) {
    g.ellipse(x, y, 2.2, 3.4).fill(0x1a0a08);
    g.circle(x - 0.6, y - 1.2, 0.7).fill({ color: 0xffffff, alpha: 0.5 });
  }

  // Borde de la pulpa: la luz pega en el corte.
  g.moveTo(-34, -6).lineTo(34, -6).stroke({ width: 2.4, color: 0xffb0b4, alpha: 0.7 });

  c.addChild(g);
}

/** L4 — Racimo de uvas. Magenta, para no confundirse con la ciruela. */
function drawGrapes(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  g.moveTo(0, -40).lineTo(1, -28).stroke({ width: 3.2, color: 0x5a3818, cap: 'round' });
  g.ellipse(12, -36, 11, 5.5).fill(0x3d8a2a);

  const uvas: readonly (readonly [number, number])[] = [
    [-16, -22], [0, -24], [16, -22],
    [-22, -8], [-8, -9], [8, -9], [22, -8],
    [-14, 6], [0, 5], [14, 6],
    [-7, 19], [7, 19],
    [0, 31],
  ];
  for (const [x, y] of uvas) {
    g.circle(x, y, 9.5).fill(vgrad([[0, accent], [0.45, color], [1, 0x420a34]]));
    g.circle(x, y, 9.5).stroke({ width: 0.9, color: 0x2a0420, alpha: 0.5 });
    g.ellipse(x - 3, y - 3.4, 3, 2.2).fill({ color: 0xffffff, alpha: 0.28 });
  }

  c.addChild(g);
}

/** L5 — Banana. Media luna amarilla: la única curva abierta del set. */
function drawBanana(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const piel = vgrad([[0, accent], [0.45, color], [1, 0xa87a0a]]);

  // Cuerpo: dos curvas que se encuentran en las puntas.
  const cuerpo = (): void => {
    g.moveTo(-38, -18)
      .bezierCurveTo(-30, 24, 22, 38, 40, 4)
      .bezierCurveTo(28, 20, -18, 14, -30, -22)
      .closePath();
  };
  cuerpo();
  g.fill(piel);
  cuerpo();
  g.stroke({ width: 1.6, color: 0x6b4a04, alpha: 0.75 });

  // La arista del lomo: lo que la vuelve banana y no luna.
  g.moveTo(-34, -16).bezierCurveTo(-24, 16, 18, 28, 38, 6)
    .stroke({ width: 2, color: 0xc89a10, alpha: 0.6 });

  // Puntas oscuras.
  g.moveTo(-38, -18).lineTo(-34, -28).lineTo(-29, -23).closePath().fill(0x4a3208);
  g.circle(40, 4, 3).fill(0x3a2806);

  // Pintitas de madura.
  for (const [x, y] of [[-14, 12], [2, 20], [16, 18], [-22, 0]] as const) {
    g.circle(x, y, 1.4).fill({ color: 0x6b4a04, alpha: 0.55 });
  }

  softShine(g, -10, 12, 9);

  c.addChild(g);
}

/* ============================================================
   LOS DOS ESPECIALES
   ============================================================ */

/**
 * SCATTER — Chupetín de espiral.
 *
 * La espiral de colores es lo único multicolor de la grilla: se encuentra en
 * medio segundo aunque haya veintinueve cosas más. Va sobre medallón rosa,
 * el color del neón del kiosco.
 */
function drawLollipop(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // El palito.
  g.roundRect(-3, 8, 6, 40, 3).fill(vgrad([[0, 0xffffff], [1, 0xc8c0b8]]));

  // El disco y la espiral: arcos de colores que se enroscan.
  g.circle(0, -8, 30).fill(accent);
  const colores = [color, 0xffd35c, 0x2fb6e8, 0x67b82c, 0xf07f12];
  for (let i = 0; i < 22; i++) {
    const a0 = i * 0.9;
    const r = 3 + i * 1.2;
    g.arc(0, -8, r, a0, a0 + 2.4)
      .stroke({ width: 3.4, color: colores[i % colores.length]!, cap: 'round' });
  }
  g.circle(0, -8, 30).stroke({ width: 2, color: 0x7a1a48, alpha: 0.8 });

  // El celofán: un brillo grande, duro, encima de todo.
  g.ellipse(-12, -20, 11, 6).fill({ color: 0xffffff, alpha: 0.42 });
  g.ellipse(-14, -22, 4, 2.4).fill({ color: 0xffffff, alpha: 0.9 });

  // Moñito donde el palito entra al caramelo.
  g.poly([-10, 26, 0, 21, 10, 26, 10, 18, 0, 22, -10, 18]).fill(color);

  c.addChild(g);
}

/**
 * BOMBA — una bomba de caramelo: esfera laqueada con mecha.
 *
 * El valor NO va dibujado: lo pone la capa de bombas encima, porque cada
 * bomba vale distinto y la textura es una sola. Por eso el centro queda
 * limpio, sin brillos, para que el número se lea.
 */
function drawBomb(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Cuerpo laqueado.
  g.circle(0, 6, 34).fill(vgrad([[0, 0xff9a7a], [0.35, color], [0.8, 0x7a0c0c], [1, 0x3a0404]]));
  g.circle(0, 6, 34).stroke({ width: 2, color: 0x2a0202, alpha: 0.9 });

  // Gajos de caramelo: arcos verticales, como un caramelo de colores.
  for (const x of [-18, 0, 18]) {
    g.moveTo(x, -26).bezierCurveTo(x * 1.5, -6, x * 1.5, 18, x, 38)
      .stroke({ width: 1.6, color: 0x3a0404, alpha: 0.3 });
  }

  // Boquilla metálica de la mecha.
  g.roundRect(-9, -34, 18, 10, 2).fill(metal(0x6b4a12, 0xb8842e, 0xffe9a8));

  // Mecha y chispa.
  g.moveTo(0, -34).bezierCurveTo(6, -42, 14, -40, 16, -46)
    .stroke({ width: 3, color: 0x3a2a1a, cap: 'round' });
  g.circle(17, -47, 6).fill({ color: accent, alpha: 0.45 });
  g.circle(17, -47, 3.2).fill(0xffffff);
  for (const a of [0, 1.2, 2.4, 3.6, 4.8]) {
    g.moveTo(17 + Math.cos(a) * 4, -47 + Math.sin(a) * 4)
      .lineTo(17 + Math.cos(a) * 9, -47 + Math.sin(a) * 9)
      .stroke({ width: 1.4, color: accent, alpha: 0.9, cap: 'round' });
  }

  // Brillo arriba a la izquierda, lejos del centro donde va el número.
  g.ellipse(-18, -12, 9, 5.5).fill({ color: 0xffffff, alpha: 0.4 });
  g.ellipse(-20, -14, 3.6, 2.2).fill({ color: 0xffffff, alpha: 0.85 });

  // Un plato apenas más oscuro en el centro: ahí va el número.
  g.circle(0, 8, 18).fill({ color: 0x000000, alpha: 0.18 });

  c.addChild(g);
}

/* ============================================================
   MONTAJE
   ============================================================ */

function buildSymbol(id: SymbolId): Container {
  const skin = SKIN[id]!;
  const c = new Container();

  const bg = new Graphics();
  contactShadow(bg, U * 0.62);
  if (id === SYM.SCATTER) {
    medallion(bg, { r: U * 0.9, ring: [0x7a1a48, 0xd94a8a, 0xffc8e0], well: [0x2a0a1c, 0x12040c] });
  }
  c.addChild(bg);

  switch (skin.shape) {
    case 'alfajor': drawAlfajor(c, skin.color, skin.accent); break;
    case 'bonbon': drawBonbon(c, skin.color, skin.accent); break;
    case 'candy': drawCandy(c, skin.color, skin.accent); break;
    case 'gum': drawGum(c, skin.color, skin.accent); break;
    case 'apple': drawApple(c, skin.color, skin.accent); break;
    case 'plum': drawPlum(c, skin.color, skin.accent); break;
    case 'melon': drawMelon(c, skin.color, skin.accent); break;
    case 'grapes': drawGrapes(c, skin.color, skin.accent); break;
    case 'banana': drawBanana(c, skin.color, skin.accent); break;
    case 'lollipop': drawLollipop(c, skin.color, skin.accent); break;
    case 'bomb': drawBomb(c, skin.color, skin.accent); break;
  }

  // La luz de la casa, igual que en los otros tres.
  const { glow, vignette } = makeLighting();
  c.addChild(glow);
  c.addChild(vignette);

  return c;
}

export type SymbolTextures = Map<SymbolId, Texture>;

export function createKioscoTextures(app: Application): SymbolTextures {
  const out: SymbolTextures = new Map();
  const ids: SymbolId[] = [
    SYM.WILD, SYM.SCATTER, SYM.H1, SYM.H2, SYM.H3, SYM.H4,
    SYM.L1, SYM.L2, SYM.L3, SYM.L4, SYM.L5,
  ];
  const frame = new Rectangle(-U, -U, U * 2, U * 2);
  for (const id of ids) {
    const c = buildSymbol(id);
    out.set(id, app.renderer.generateTexture({ target: c, frame, resolution: 3 }));
    c.destroy({ children: true });
  }
  return out;
}
