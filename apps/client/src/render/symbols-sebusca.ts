/**
 * Símbolos de Se Busca (western), dibujados proceduralmente.
 *
 * Misma disciplina que en Maverick: lo que importa no es el detalle sino que
 * las siluetas sean distinguibles. Acá el problema es más duro porque la
 * grilla es 5×5 y las celdas quedan chicas — por eso los altos tienen formas
 * netas y muy distintas entre sí (ala ancha horizontal, cuernos, cañón
 * horizontal, estrella) y los bajos son naipes planos que no compiten.
 */

import { Container, Graphics, Rectangle, Text, type Application, type Texture } from 'pixi.js';
import { U, contactShadow, medallion, vgrad, metal, makeLighting } from './material.ts';
import { SYM, type SymbolId } from '@casino/math';
import { SKIN } from '@casino/game-sebusca/theme';

const U = 50;

function shadow(g: Graphics): void {
  g.ellipse(0, 8, U * 0.7, U * 0.6).fill({ color: 0x000000, alpha: 0.3 });
}

/** El Forajido: sombrero de ala ancha con pañuelo. Silueta horizontal. */
function drawHat(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  // Ala: la forma más reconocible del set a tamaño chico.
  g.ellipse(0, 6, 46, 13).fill(color);
  g.ellipse(0, 3, 46, 12).fill({ color: 0x000000, alpha: 0.25 });
  // Copa.
  g.moveTo(-22, 4)
    .bezierCurveTo(-20, -26, -12, -34, 0, -34)
    .bezierCurveTo(12, -34, 20, -26, 22, 4)
    .fill(color);
  // Abolladura de la copa.
  g.moveTo(-9, -30).quadraticCurveTo(0, -22, 9, -30)
    .stroke({ width: 3, color: 0x000000, alpha: 0.3 });
  // Cinta roja.
  g.rect(-23, -4, 46, 8).fill(accent);
  g.rect(-23, -4, 46, 2).fill({ color: 0xffffff, alpha: 0.15 });
  // Pañuelo colgando bajo el ala.
  g.poly([-16, 14, 16, 14, 10, 34, 0, 26, -10, 34]).fill(accent);
  g.poly([-16, 14, 16, 14, 12, 21, -12, 21]).fill({ color: 0x000000, alpha: 0.2 });
  c.addChild(g);
}

/** Cráneo de toro: los cuernos le dan un ancho único en el set. */
function drawBullSkull(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  // Cuernos, de punta a punta.
  g.moveTo(-6, -14)
    .bezierCurveTo(-26, -22, -42, -16, -46, -2)
    .bezierCurveTo(-38, -10, -24, -10, -8, -4)
    .fill(color);
  g.moveTo(6, -14)
    .bezierCurveTo(26, -22, 42, -16, 46, -2)
    .bezierCurveTo(38, -10, 24, -10, 8, -4)
    .fill(color);
  // Cráneo.
  g.moveTo(-18, -16)
    .bezierCurveTo(-18, -26, 18, -26, 18, -16)
    .lineTo(14, 10)
    .bezierCurveTo(12, 26, -12, 26, -14, 10)
    .fill(color);
  // Cuencas y nariz.
  g.ellipse(-8, -6, 6, 7).fill(0x14100a);
  g.ellipse(8, -6, 6, 7).fill(0x14100a);
  g.poly([0, 4, 5, 16, -5, 16]).fill(0x14100a);
  // Grietas del hueso.
  g.moveTo(-4, -20).lineTo(-2, -14).moveTo(6, -20).lineTo(4, -15)
    .stroke({ width: 1.5, color: accent, alpha: 0.7 });
  c.addChild(g);
}

/** Revólver: cañón horizontal largo, silueta inconfundible. */
function drawRevolver(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  // Cañón.
  g.roundRect(-40, -12, 52, 12, 3).fill(color);
  g.rect(-40, -12, 52, 3).fill({ color: 0xffffff, alpha: 0.25 });
  // Tambor.
  g.circle(6, -4, 13).fill(color);
  g.circle(6, -4, 13).stroke({ width: 2, color: 0x2a2420 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.circle(6 + Math.cos(a) * 7, -4 + Math.sin(a) * 7, 2.4).fill(0x14100a);
  }
  // Martillo.
  g.poly([18, -14, 26, -20, 28, -12, 20, -8]).fill(color);
  // Empuñadura de madera.
  g.moveTo(14, 4)
    .bezierCurveTo(26, 10, 30, 26, 24, 36)
    .lineTo(10, 32)
    .bezierCurveTo(12, 20, 10, 10, 6, 6)
    .fill(accent);
  // Guardamonte y gatillo.
  g.moveTo(2, 6).bezierCurveTo(-2, 18, 6, 22, 12, 18)
    .stroke({ width: 3, color });
  c.addChild(g);
}

/** Estrella de sheriff: la única forma radial del set. */
function drawStar(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  const pts: number[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 40 : 17;
    pts.push(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.poly(pts).fill(color);
  g.poly(pts).stroke({ width: 2, color: accent });
  // Bolitas en las puntas: el detalle que dice "placa de sheriff".
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    g.circle(Math.cos(a) * 38, Math.sin(a) * 38, 4).fill(accent);
  }
  g.circle(0, 0, 15).fill({ color: accent, alpha: 0.4 });
  g.circle(0, 0, 15).stroke({ width: 1.5, color: accent });
  c.addChild(g);

  const t = new Text({
    text: '★',
    style: { fontFamily: 'Georgia, serif', fontSize: 20, fill: accent },
  });
  t.anchor.set(0.5);
  c.addChild(t);
}

/** Wild: el cartel SE BUSCA, clavado y con las esquinas rotas. */
function drawPoster(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  // Papel con esquinas irregulares.
  g.poly([-32, -42, 30, -40, 34, 36, -28, 42, -34, 0]).fill(color);
  g.poly([-32, -42, 30, -40, 34, 36, -28, 42, -34, 0])
    .stroke({ width: 2, color: accent, alpha: 0.55 });
  // Manchas de café/polvo.
  g.circle(24, -28, 7).fill({ color: accent, alpha: 0.12 });
  g.circle(-24, 28, 9).fill({ color: accent, alpha: 0.1 });
  // Rostro sombreado del buscado.
  g.circle(0, -4, 15).fill({ color: accent, alpha: 0.35 });
  g.ellipse(0, -14, 16, 7).fill({ color: accent, alpha: 0.6 });
  g.circle(-5, -4, 2.2).fill(accent);
  g.circle(5, -4, 2.2).fill(accent);
  // Chinches.
  g.circle(-26, -36, 3).fill(0x8a7c63);
  g.circle(26, -34, 3).fill(0x8a7c63);
  c.addChild(g);

  const top = new Text({
    text: 'SE BUSCA',
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 13,
      fontWeight: '700',
      fill: accent,
      letterSpacing: 0.5,
    },
  });
  top.anchor.set(0.5);
  top.y = -30;
  c.addChild(top);

  const bottom = new Text({
    text: 'WILD',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 15,
      fontWeight: '700',
      fill: accent,
      letterSpacing: 1.5,
    },
  });
  bottom.anchor.set(0.5);
  bottom.y = 22;
  c.addChild(bottom);
}

/** Scatter: cartucho de dinamita con la mecha encendida. */
function drawDynamite(c: Container, color: number, accent: number): void {
  const g = new Graphics();
  // Tres cartuchos atados.
  for (const [x, y, h] of [[-13, 2, 34], [0, -2, 40], [13, 2, 34]] as const) {
    g.roundRect(x - 8, y - h / 2, 16, h, 5).fill(color);
    g.roundRect(x - 8, y - h / 2, 5, h, 3).fill({ color: 0xffffff, alpha: 0.18 });
  }
  // Cinta que los ata.
  g.rect(-24, -2, 48, 9).fill(0x5a3d22);
  g.rect(-24, -2, 48, 2).fill({ color: 0xffffff, alpha: 0.12 });
  // Mecha.
  g.moveTo(0, -22).bezierCurveTo(6, -32, 16, -32, 20, -40)
    .stroke({ width: 3, color: 0x6b5a3a, cap: 'round' });
  // Chispa.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.poly([
      20, -40,
      20 + Math.cos(a) * 13, -40 + Math.sin(a) * 13,
      20 + Math.cos(a + 0.4) * 9, -40 + Math.sin(a + 0.4) * 9,
    ]).fill({ color: accent, alpha: 0.9 });
  }
  g.circle(20, -40, 6).fill(0xfff3c4);
  c.addChild(g);
}

/** Bajos: naipes de saloon, planos y gastados. */
/**
 * Una carta de saloon, gastada.
 *
 * Antes era un rectangulo translucido con una letra encima: se leia como
 * "letra sobre fondo", no como carta. Una carta necesita tres cosas que
 * antes no estaban: papel claro —no oscuro—, un borde interior a un par de
 * milimetros del canto, y el palo en su color de siempre.
 *
 * Que el papel sea CLARO es lo que mas cambia. Cinco rectangulos oscuros en
 * una grilla oscura se leen como agujeros; cinco cartas claras se leen como
 * cartas, y ademas le dan a la grilla el respiro que necesita entre los
 * simbolos altos, que son todos oscuros y metalicos.
 */
function drawCard(c: Container, color: number, accent: number, glyph: string): void {
  const w = 54, h = 72;
  const g = new Graphics();

  // Sombra propia: la carta esta apoyada, no pegada.
  g.roundRect(-w / 2 + 1.5, -h / 2 + 3, w, h, 6).fill({ color: 0x000000, alpha: 0.45 });

  // El papel: marfil arriba, mas tostado abajo. El desgaste va en el tono,
  // no en manchas: una mancha dibujada se repite identica en las 30 cartas
  // que hay en pantalla y se nota enseguida que es la misma textura.
  g.roundRect(-w / 2, -h / 2, w, h, 6).fill(vgrad([
    [0, 0xf4ead2],
    [0.55, 0xdfd0ac],
    [1, 0xbfa87f],
  ]));

  // Canto oscuro y borde interior: es lo que la vuelve carta y no rectangulo.
  g.roundRect(-w / 2, -h / 2, w, h, 6).stroke({ width: 1.4, color: 0x6b5734, alpha: 0.8 });
  g.roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 4)
    .stroke({ width: 1, color: accent, alpha: 0.45 });

  // La esquina gastada, ahora doblada de verdad: el triangulo de atras
  // oscuro y el del frente claro.
  g.poly([w / 2 - 12, -h / 2, w / 2, -h / 2, w / 2, -h / 2 + 12])
    .fill({ color: 0x8a7550, alpha: 0.55 });
  g.poly([w / 2 - 12, -h / 2, w / 2, -h / 2 + 12, w / 2 - 11, -h / 2 + 11])
    .fill({ color: 0xfff6e2, alpha: 0.5 });

  c.addChild(g);

  // El palo, en su color de siempre. Alternar rojo y negro por valor le da
  // al ojo una segunda pista de jerarquia sin agregar nada nuevo a la pantalla.
  const rojo = glyph === 'K' || glyph === 'J';
  const tinta = rojo ? 0xa8202c : 0x1b1710;

  const t = new Text({
    text: glyph,
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: glyph.length > 1 ? 34 : 44,
      fontWeight: '700',
      fill: tinta,
    },
  });
  t.anchor.set(0.5);
  t.position.set(0, -2);
  c.addChild(t);

  // Y el indice chico abajo, como en una carta de verdad.
  const chico = new Text({
    text: glyph,
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: 13,
      fontWeight: '700',
      fill: tinta,
    },
  });
  chico.anchor.set(0.5);
  chico.position.set(-w / 2 + 9, h / 2 - 10);
  chico.alpha = 0.75;
  c.addChild(chico);
}

/**
 * SOPORTE POR JERARQUIA — la version del oeste.
 *
 * Misma receta que Maverick, distinto material: aca el metal es hierro
 * viejo y laton, no oro de templo. Copiarle la piedra azteca al saloon
 * habria sido aplicar el oficio sin mirar el tema, que es exactamente
 * como se nota que dos juegos salieron de la misma plantilla.
 *
 * Y los naipes no llevan placa: llevan CARTA. Es lo que corresponde a un
 * juego de saloon, y ademas es mas fuerte que una piedra con una letra.
 */
function backing(g: Graphics, id: SymbolId): void {
  contactShadow(g);

  if (id === SYM.WILD) {
    medallion(g, { ring: [0x6a2a14, 0xb8552a, 0xffb877], well: [0x2c1408, 0x140803] });
    return;
  }
  if (id === SYM.SCATTER) {
    medallion(g, { ring: [0x14403f, 0x2a8481, 0x8ee8e4], well: [0x0a2422, 0x04100f] });
    return;
  }
  if (id === SYM.L1 || id === SYM.L2 || id === SYM.L3 || id === SYM.L4 || id === SYM.L5) {
    return;   // la carta se dibuja entera en drawCard
  }
  // Altos: hierro viejo con laton.
  medallion(g, { ring: [0x3a2c1e, 0x6e5638, 0xb99a63], well: [0x241a10, 0x0f0906] });
}

function buildSymbol(id: SymbolId): Container {
  const skin = SKIN[id]!;
  const c = new Container();

  // 1. El soporte.
  const bg = new Graphics();
  backing(bg, id);
  c.addChild(bg);

  switch (skin.shape) {
    case 'hat': drawHat(c, skin.color, skin.accent); break;
    case 'skull': drawBullSkull(c, skin.color, skin.accent); break;
    case 'revolver': drawRevolver(c, skin.color, skin.accent); break;
    case 'star': drawStar(c, skin.color, skin.accent); break;
    case 'poster': drawPoster(c, skin.color, skin.accent); break;
    case 'dynamite': drawDynamite(c, skin.color, skin.accent); break;
    case 'card': drawCard(c, skin.color, skin.accent, skin.glyph ?? '?'); break;
  }

  // 2. La luz, igual que en Maverick: es lo que hace que los dos juegos
  //    se lean como salidos de la misma casa.
  const { glow, vignette } = makeLighting();
  c.addChild(glow);
  c.addChild(vignette);

  return c;
}

export type SymbolTextures = Map<SymbolId, Texture>;

export function createSebuscaTextures(app: Application): SymbolTextures {
  const out: SymbolTextures = new Map();
  const ids: SymbolId[] = [
    SYM.WILD, SYM.SCATTER, SYM.H1, SYM.H2, SYM.H3, SYM.H4,
    SYM.L1, SYM.L2, SYM.L3, SYM.L4, SYM.L5,
  ];
  // Marco fijo: sin esto cada símbolo se estira distinto en la celda.
  const frame = new Rectangle(-U, -U, U * 2, U * 2);
  for (const id of ids) {
    const c = buildSymbol(id);
    out.set(id, app.renderer.generateTexture({ target: c, frame, resolution: 3 }));
    c.destroy({ children: true });
  }
  return out;
}
