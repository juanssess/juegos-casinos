/**
 * Símbolos de La Vendimia, dibujados proceduralmente.
 *
 * Mismo oficio que en los otros dos —volumen, degradado, y la MISMA luz para
 * todos— pero con una decisión de composición que va al revés y conviene
 * explicar, porque parece un descuido y no lo es:
 *
 * ACÁ LOS SÍMBOLOS COMUNES NO LLEVAN MEDALLÓN.
 *
 * En Maverick y en Se Busca cada símbolo apoya sobre un disco tallado o una
 * placa de piedra. Funciona porque en un juego de líneas la grilla es un
 * mosaico: cada celda es una cosa distinta y el soporte le da lugar a cada
 * una. En un juego de racimos pasa lo contrario: lo normal es ver cinco,
 * ocho, doce celdas con el MISMO símbolo pegadas entre sí. Con medallón, ese
 * racimo se lee como doce marcos apilados —una reja— y justo lo que el
 * jugador tiene que ver de un vistazo, la FORMA del grupo, desaparece atrás
 * de la repetición del soporte.
 *
 * Sin medallón, doce racimos violetas juntos se leen como una mancha
 * violeta con forma. Que es exactamente lo que son.
 *
 * Lo que SÍ se conserva es la sombra de contacto y la capa de luz, que es lo
 * que hace que los tres juegos se lean como de la misma casa. Y el medallón
 * vuelve para los dos especiales —tijera y barrica—: ahí la reja no es un
 * riesgo (nunca hay cinco pegados) y el aro de metal es la señal más rápida
 * de "este no es un símbolo común".
 */

import { Container, Graphics, Rectangle, type Application, type Texture } from 'pixi.js';
import { U, contactShadow, medallion, vgrad, lit, metal, makeLighting } from './material.ts';
import { SYM, type SymbolId } from '@casino/math';
import { SKIN } from '@casino/game-vendimia/theme';

/* ============================================================
   LOS TRES ALTOS
   ============================================================ */

/** H1 — Copa de Malbec. La silueta más alta y angosta del set. */
function drawGlass(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Pie y tallo, primero: van detrás del cáliz.
  g.ellipse(0, 40, 20, 5.5).fill(vgrad([[0, 0xe9e2d4], [1, 0x9d9384]]));
  g.rect(-2.6, 8, 5.2, 32).fill(vgrad([[0, 0xf2ece0], [1, 0xa89e8e]]));

  // Cáliz: el cristal es un degradado frío que casi no tiene color propio.
  g.moveTo(-21, -34)
    .bezierCurveTo(-21, 2, -13, 12, 0, 12)
    .bezierCurveTo(13, 12, 21, 2, 21, -34)
    .fill(vgrad([[0, 0xd8d4cc], [0.5, 0xb3aea6], [1, 0xe6e2da]]));

  // El vino adentro. Es lo que le da el color al símbolo, y por eso ocupa
  // dos tercios de la copa: si fuera un dedito de vino, de lejos la copa
  // se leería gris y se perdería contra la botella.
  g.moveTo(-19, -14)
    .bezierCurveTo(-19, 1, -12, 10, 0, 10)
    .bezierCurveTo(12, 10, 19, 1, 19, -14)
    .fill(vgrad([[0, 0xc42346], [0.45, color], [1, 0x4c0a1c]]));

  // La elipse de la superficie: sin esto el vino es una mancha, no un líquido.
  g.ellipse(0, -14, 19, 4.6).fill(0xd4304f);
  g.ellipse(0, -14, 19, 4.6).stroke({ width: 1, color: 0xff7d92, alpha: 0.5 });

  // Reflejo vertical del cristal, a la izquierda: la luz de la casa.
  g.moveTo(-15, -30).bezierCurveTo(-16, -8, -11, 2, -7, 7)
    .stroke({ width: 3, color: 0xffffff, alpha: 0.35, cap: 'round' });
  // Y el filo del borde.
  g.ellipse(0, -34, 21, 5).stroke({ width: 1.6, color: accent, alpha: 0.7 });

  c.addChild(g);
}

/** H2 — Botella. Vertical y recta: se distingue de la copa por el hombro. */
function drawBottle(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const vidrio = vgrad([[0, 0x2f6b3e], [0.35, color], [1, 0x0e2614]]);

  // Cuerpo con hombro marcado.
  g.moveTo(-17, 44)
    .lineTo(-17, -4)
    .bezierCurveTo(-17, -18, -6, -22, -6, -30)
    .lineTo(-6, -44)
    .lineTo(6, -44)
    .lineTo(6, -30)
    .bezierCurveTo(6, -22, 17, -18, 17, -4)
    .lineTo(17, 44)
    .fill(vidrio);

  // Base más oscura: el vidrio es más grueso abajo.
  g.rect(-17, 34, 34, 10).fill({ color: 0x000000, alpha: 0.28 });

  // Cápsula del gollete.
  g.rect(-7, -46, 14, 13).fill(metal(0x5e1220, 0x8e1b30, 0xd4536b));
  g.rect(-7, -46, 14, 2.5).fill({ color: 0xffffff, alpha: 0.3 });

  // Etiqueta. Es el rasgo que la separa de cualquier otra silueta vertical.
  g.roundRect(-15, 2, 30, 26, 3).fill(vgrad([[0, 0xf2e7cd], [1, 0xcdbc99]]));
  g.roundRect(-15, 2, 30, 26, 3).stroke({ width: 1, color: accent, alpha: 0.8 });
  g.rect(-10, 8, 20, 2).fill({ color: 0x6b4a22, alpha: 0.55 });
  g.rect(-10, 13, 20, 1.6).fill({ color: 0x6b4a22, alpha: 0.4 });
  g.rect(-7, 19, 14, 4).fill({ color: 0x8e1330, alpha: 0.65 });

  // Reflejo largo del vidrio.
  g.moveTo(-11, -26).lineTo(-11, 38)
    .stroke({ width: 3.6, color: 0xffffff, alpha: 0.16, cap: 'round' });

  c.addChild(g);
}

/** H3 — Canasto de cosecha. Ancho y bajo: la única silueta horizontal. */
function drawBasket(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Uvas asomando por arriba, primero (van detrás del mimbre).
  for (const [x, y, r] of [
    [-16, -14, 8], [-4, -19, 9], [9, -15, 8], [18, -9, 7], [-24, -8, 7], [3, -8, 8],
  ] as const) {
    g.circle(x, y, r).fill(vgrad([[0, 0x8b52a3], [1, 0x3d1a4d]]));
    g.circle(x - r * 0.3, y - r * 0.35, r * 0.3).fill({ color: 0xd9b6e8, alpha: 0.5 });
  }

  // Cuerpo del canasto: trapecio invertido.
  g.moveTo(-34, -6).lineTo(34, -6).lineTo(25, 34).lineTo(-25, 34)
    .fill(vgrad([[0, accent], [0.4, color], [1, 0x6b4a22]]));

  // Trenzado: horizontales y verticales. Es lo que lo vuelve mimbre y no
  // un balde. Poco y regular — con más líneas, a este tamaño, se empasta.
  for (const y of [2, 12, 22]) {
    const k = 1 - (y + 6) / 60;
    g.moveTo(-34 * (0.55 + k * 0.45), y).lineTo(34 * (0.55 + k * 0.45), y)
      .stroke({ width: 2, color: 0x4a3116, alpha: 0.45 });
  }
  for (const x of [-18, -6, 6, 18]) {
    g.moveTo(x, -6).lineTo(x * 0.74, 34)
      .stroke({ width: 1.6, color: 0x4a3116, alpha: 0.3 });
  }

  // Borde superior redondeado y asa.
  g.roundRect(-36, -11, 72, 9, 4.5).fill(metal(0x6b4a22, color, 0xf0cf8a));
  g.arc(0, -8, 22, Math.PI * 1.15, Math.PI * 1.85)
    .stroke({ width: 3.4, color: 0x6b4a22 });

  c.addChild(g);
}

/* ============================================================
   LOS TRES BAJOS
   ============================================================ */

/** L1 — Racimo Malbec. Triangular, violeta profundo. */
function drawBunch(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Cabito y hojita arriba.
  g.moveTo(0, -40).lineTo(2, -28).stroke({ width: 3.4, color: 0x4e7d2c, cap: 'round' });
  g.ellipse(-11, -36, 11, 6).fill(0x4e7d2c);
  g.ellipse(-11, -36, 11, 6).stroke({ width: 1, color: 0x2f5119, alpha: 0.6 });

  /* El racimo se arma por FILAS que se angostan. Un montón de círculos al
     azar da una nube; lo que hace que se lea "racimo" es la punta abajo. */
  const filas: readonly (readonly [number, number, number])[] = [
    [-20, -24, 4], [-7, -27, 4], [7, -27, 4], [20, -24, 4],
    [-14, -14, 4], [0, -16, 4], [14, -14, 4],
    [-19, -4, 3], [-7, -5, 3], [7, -5, 3], [19, -4, 3],
    [-12, 6, 3], [1, 6, 3], [13, 6, 3],
    [-6, 17, 2], [7, 17, 2],
    [1, 28, 1],
  ];
  for (const [x, y] of filas) {
    g.circle(x, y, 10).fill(lit([[0, accent], [0.45, color], [1, 0x2a0f36]]));
    g.circle(x - 3.2, y - 3.6, 3).fill({ color: 0xe8cef5, alpha: 0.42 });
    g.circle(x, y, 10).stroke({ width: 0.9, color: 0x1e0a28, alpha: 0.45 });
  }

  c.addChild(g);
}

/** L2 — Hoja de parra. Lobulada: no se parece a nada más del set. */
function drawLeaf(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const verde = lit([[0, accent], [0.5, color], [1, 0x2b4a17]]);

  // Cinco lóbulos alrededor de un centro, con muescas entre medio.
  const pts: number[] = [];
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    // Cinco lóbulos = un coseno de 5 ciclos; el dentado fino es uno de 30.
    const lob = 1 + 0.34 * Math.cos(5 * a);
    const dent = 1 + 0.045 * Math.cos(30 * a);
    const r = 33 * lob * dent;
    pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.98 - 3);
  }
  g.poly(pts).fill(verde);
  g.poly(pts).stroke({ width: 1.2, color: 0x24400f, alpha: 0.55 });

  // Nervaduras: cinco desde el pecíolo. Es lo que la vuelve hoja de VID.
  for (const a of [-Math.PI / 2, -Math.PI / 2 - 1.1, -Math.PI / 2 + 1.1, -Math.PI / 2 - 2.2, -Math.PI / 2 + 2.2]) {
    g.moveTo(0, 20)
      .lineTo(Math.cos(a) * 30, Math.sin(a) * 30 + 6)
      .stroke({ width: 1.8, color: 0xdff0b8, alpha: 0.35 });
  }

  // Pecíolo.
  g.moveTo(0, 20).quadraticCurveTo(4, 34, 1, 42)
    .stroke({ width: 3.2, color: 0x6b4a22, cap: 'round' });

  c.addChild(g);
}

/** L3 — Uva Torrontés. Una sola, redonda y dorada: la forma más simple. */
function drawGrape(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  /* ORO DE VERDAD, no crema.
     La primera version ponia el reflejo especular al 55% sobre un degradado
     que ya arrancaba claro, y encima venia la capa de luz de la casa: entre
     las tres, la uva quedaba blanca. En una grilla donde la mitad de las
     celdas son verdes y violetas, la unica cosa clara se vuelve lo que mas
     tira del ojo —y era justo el simbolo que menos paga—.
     El degradado ahora arranca en el acento y CIERRA muy oscuro, el reflejo
     es chico y el borde lleva un aro de sombra propia. */
  g.circle(0, 2, 33).fill(vgrad([[0, accent], [0.3, color], [0.75, 0x8a6410], [1, 0x4a3406]]));
  g.circle(0, 2, 33).stroke({ width: 2, color: 0x3d2a04, alpha: 0.85 });
  // Aro interior de sombra: hunde el borde y deja el centro adelante.
  g.circle(0, 2, 30).stroke({ width: 5, color: 0x6b4c0a, alpha: 0.35 });

  // Brillo especular chico y neto, arriba a la izquierda como en todo el set.
  g.ellipse(-11, -10, 8, 6).fill({ color: 0xfff3c0, alpha: 0.6 });
  g.ellipse(-13, -13, 3.4, 2.6).fill({ color: 0xffffff, alpha: 0.8 });
  // Rebote de luz abajo a la derecha: es lo que la vuelve esfera y no disco.
  g.arc(0, 2, 25, 0.45, 1.25).stroke({ width: 4.5, color: 0xffd964, alpha: 0.3 });

  // Cabito con hoja, para que no sea "un circulo".
  g.moveTo(0, -30).quadraticCurveTo(3, -38, 9, -42)
    .stroke({ width: 3.2, color: 0x6b4a22, cap: 'round' });
  g.ellipse(-6, -37, 9, 5).fill(0x4e7d2c);

  c.addChild(g);
}

/* ============================================================
   LOS DOS ESPECIALES
   ============================================================ */

/** WILD — Tijera de podar. */
function drawShears(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const acero = metal(0x3f4048, 0x9aa0aa, 0xf2f5f8);

  /* LA SILUETA DE UNA TIJERA ES UNA X ARRIBA Y DOS ANILLOS ABAJO.
     La primera version dibujaba hojas curvas y mangos de madera "realistas",
     y a 86 pixeles de celda el resultado era una manchita con forma de mono:
     nadie leia una tijera. Los anillos son la parte que hace el trabajo —son
     lo unico que ningun otro objeto del set tiene— y por eso ahora son
     grandes, dorados y del ancho de la celda. */

  // Hojas: dos cunias que se cruzan, mas anchas en la base.
  g.poly([-3, -2, -22, -40, -13, -45, 2, -6]).fill(acero);
  g.poly([3, -2, 22, -40, 13, -45, -2, -6]).fill(acero);
  // Filo brillante sobre el canto de cada hoja.
  g.moveTo(-13, -44).lineTo(2, -7).stroke({ width: 1.8, color: 0xffffff, alpha: 0.55 });
  g.moveTo(13, -44).lineTo(-2, -7).stroke({ width: 1.4, color: 0xffffff, alpha: 0.3 });

  // Brazos hasta los anillos.
  g.moveTo(-2, 2).lineTo(-15, 20).stroke({ width: 7, color: accent, cap: 'round' });
  g.moveTo(2, 2).lineTo(15, 20).stroke({ width: 7, color: accent, cap: 'round' });

  // Los anillos, en el dorado del wild.
  for (const x of [-19, 19] as const) {
    g.ellipse(x, 30, 13, 11).stroke({ width: 8, color: 0x6b4a12 });
    g.ellipse(x, 30, 13, 11).stroke({ width: 5.5, color });
    g.arc(x, 30, 12, Math.PI * 1.1, Math.PI * 1.7)
      .stroke({ width: 2, color: 0xfff0bd, alpha: 0.55 });
  }

  // Remache del centro, que es donde la X se cierra.
  g.circle(0, 0, 7).fill(metal(0x2f2f36, 0xb8842e, 0xffe9a8));
  g.circle(-1.6, -1.6, 2.2).fill({ color: 0xffffff, alpha: 0.65 });

  c.addChild(g);
}

/** SCATTER — Barrica de roble con aros de hierro. */
function drawBarrel(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Cuerpo abombado.
  g.moveTo(-24, -34)
    .bezierCurveTo(-38, -18, -38, 18, -24, 34)
    .lineTo(24, 34)
    .bezierCurveTo(38, 18, 38, -18, 24, -34)
    .fill(vgrad([[0, 0xc98f4c], [0.35, color], [1, 0x5e3a18]]));

  // Duelas: verticales curvadas. Cuatro alcanzan; con ocho se empasta.
  for (const x of [-16, -5, 6, 17]) {
    g.moveTo(x, -34)
      .bezierCurveTo(x * 1.42, -14, x * 1.42, 14, x, 34)
      .stroke({ width: 1.4, color: 0x3e2410, alpha: 0.45 });
  }

  // Aros de hierro: arriba, abajo y el ancho del medio.
  for (const [y, h, w] of [[-27, 7, 30], [0, 9, 36], [27, 7, 30]] as const) {
    g.roundRect(-w, y - h / 2, w * 2, h, 2)
      .fill(metal(0x2e2a26, 0x6e675e, 0xb9b2a4));
    g.rect(-w, y - h / 2, w * 2, 1.6).fill({ color: 0xffffff, alpha: 0.2 });
  }

  // Tapones y el brillo del roble encerado.
  g.circle(0, -12, 4).fill(0x3e2410);
  g.ellipse(-14, -6, 6, 20).fill({ color: 0xffe0a8, alpha: 0.14 });

  // Chorrito de vino en el aro del medio: el detalle que la vuelve barrica
  // de bodega y no un barril de dibujito.
  g.circle(9, 4, 2.6).fill({ color: 0x8e1330, alpha: 0.85 });
  g.moveTo(9, 6).lineTo(9, 16).stroke({ width: 2, color: 0x8e1330, alpha: 0.6, cap: 'round' });

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
  // Medallón SOLO para los especiales. Ver el comentario de arriba: en un
  // juego de racimos el soporte repetido doce veces se lee como una reja.
  if (id === SYM.WILD) {
    medallion(bg, { r: U * 0.9, ring: [0x6b4a12, 0xb8842e, 0xffe9a8], well: [0x2a1a06, 0x120a02] });
  } else if (id === SYM.SCATTER) {
    medallion(bg, { r: U * 0.9, ring: [0x1e4020, 0x3f7a34, 0x9ee06a], well: [0x0f2410, 0x061005] });
  }
  c.addChild(bg);

  switch (skin.shape) {
    case 'glass': drawGlass(c, skin.color, skin.accent); break;
    case 'bottle': drawBottle(c, skin.color, skin.accent); break;
    case 'basket': drawBasket(c, skin.color, skin.accent); break;
    case 'bunch': drawBunch(c, skin.color, skin.accent); break;
    case 'leaf': drawLeaf(c, skin.color, skin.accent); break;
    case 'grape': drawGrape(c, skin.color, skin.accent); break;
    case 'shears': drawShears(c, skin.color, skin.accent); break;
    case 'barrel': drawBarrel(c, skin.color, skin.accent); break;
  }

  // La luz de la casa, igual que en los otros dos.
  const { glow, vignette } = makeLighting();
  c.addChild(glow);
  c.addChild(vignette);

  return c;
}

export type SymbolTextures = Map<SymbolId, Texture>;

export function createVendimiaTextures(app: Application): SymbolTextures {
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
