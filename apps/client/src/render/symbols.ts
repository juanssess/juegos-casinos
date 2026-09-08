/**
 * Dibujo de los símbolos.
 *
 * Son placeholders procedurales, no arte final — pero placeholders con la
 * propiedad que importa: **siluetas distintas**. Podés reconocer cuál es cuál
 * a 90 px y en movimiento, que es la única prueba que cuenta. El día que
 * entren ilustraciones de verdad, se cambia este archivo y nada más.
 *
 * Cada símbolo se dibuja UNA vez a textura y después se instancia como Sprite.
 * Al girar hay ~40 símbolos en pantalla; con Graphics vivos el navegador
 * sufre, con Sprites es un solo draw call.
 */

import { Container, Graphics, Rectangle, Text, type Application, type Texture } from 'pixi.js';
import { SYM, type SymbolId } from '@casino/math';
import { SKIN } from '@casino/game-classic20/theme';
import { U, contactShadow, medallion, plaque, makeLighting, lit, metal } from './material.ts';

/**
 * SOPORTE POR JERARQUÍA
 *
 * Los altos apoyan en un medallón de metal; los naipes, en una placa de
 * piedra. No es adorno: es lo que hace que el ojo separe "esto paga mucho"
 * de "esto es relleno" antes de leer nada. Antes los once salían al mismo
 * plano y la grilla se leía toda igual.
 *
 * El wild y el scatter llevan el aro más brillante del juego, porque son
 * los dos que hay que encontrar de un vistazo mientras los rodillos giran.
 */
function backing(g: Graphics, id: SymbolId): void {
  contactShadow(g);

  if (id === SYM.WILD) {
    medallion(g, { ring: [0x7a4410, 0xd08a24, 0xffe6a0], well: [0x2a1608, 0x120903] });
    return;
  }
  if (id === SYM.SCATTER) {
    medallion(g, { ring: [0x0f4a44, 0x1f8f80, 0x8ff0e0], well: [0x082420, 0x03100e] });
    return;
  }
  if (id === SYM.L1 || id === SYM.L2 || id === SYM.L3 || id === SYM.L4 || id === SYM.L5) {
    // El filo toma el acento del propio naipe, asi la placa pertenece a la
    // letra en vez de ser un rectangulo generico debajo de cinco letras.
    plaque(g, { edge: SKIN[id]!.accent });
    return;
  }
  // Altos: medallón de bronce, un punto por debajo del wild.
  medallion(g, { ring: [0x5c3f18, 0x94702a, 0xdcb96c], well: [0x1a120a, 0x0b0805] });
}

/**
 * Serpiente emplumada.
 *
 * La primera versión salía leyéndose como un pato: cabeza triangular chata
 * sobre una línea curva. Lo que la vuelve serpiente es el CUERPO en S grueso
 * ocupando el ancho del cuadro, con la cabeza como continuación del mismo
 * trazo — no como una pieza aparte pegada arriba.
 */
function drawSerpent(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Penacho de plumas: abanico detrás del cuello.
  for (let i = 0; i < 6; i++) {
    const a = -2.5 + i * 0.34;
    const bx = -6;
    const by = -12;
    const len = 30 - Math.abs(i - 2.5) * 3;
    g.poly([
      bx, by,
      bx + Math.cos(a) * len, by + Math.sin(a) * len,
      bx + Math.cos(a + 0.2) * (len * 0.72), by + Math.sin(a + 0.2) * (len * 0.72),
    ]).fill({ color: accent, alpha: 0.92 });
  }

  // Cuerpo en S, de la cola abajo-derecha al cuello arriba-izquierda.
  g.moveTo(34, 34)
    .bezierCurveTo(6, 40, 22, 14, 2, 10)
    .bezierCurveTo(-14, 6, -10, -6, -6, -12)
    .stroke({ width: 14, color, cap: 'round', join: 'round' });

  // Vientre: escamas claras a lo largo de la curva.
  for (const [x, y] of [[26, 33], [14, 30], [8, 18], [-1, 10], [-7, 2]] as const) {
    g.circle(x, y, 3).fill({ color: accent, alpha: 0.55 });
  }

  // Cabeza: cuña alargada que continúa el trazo del cuello.
  g.poly([-2, -6, -14, -34, -30, -30, -26, -12, -12, -4]).fill(color);
  // Mandíbula abierta.
  g.poly([-30, -30, -19, -25, -27, -14]).fill(accent);
  g.poly([-28, -27, -25, -17, -23, -24]).fill(0xfff2d4);
  g.poly([-20, -27, -18, -20, -16, -26]).fill(0xfff2d4);
  // Lengua bífida.
  g.moveTo(-30, -30).lineTo(-42, -38).moveTo(-38, -33).lineTo(-42, -38)
    .stroke({ width: 2.5, color: 0xd23b2a, cap: 'round' });

  g.circle(-15, -20, 4).fill(0x150c05);
  g.circle(-14, -21, 1.4).fill(0xfff2d4);

  c.addChild(g);
}

/** Jaguar: cabeza felina de frente, ancha arriba y angosta en el mentón. */
function drawJaguar(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  g.poly([-14, -34, 14, -34, 30, -12, 24, 16, 0, 34, -24, 16, -30, -12]).fill(color);

  // Orejas.
  g.poly([-30, -20, -20, -40, -8, -26]).fill(color);
  g.poly([30, -20, 20, -40, 8, -26]).fill(color);
  g.poly([-26, -22, -20, -33, -13, -25]).fill({ color: accent, alpha: 0.55 });
  g.poly([26, -22, 20, -33, 13, -25]).fill({ color: accent, alpha: 0.55 });

  // Manchas.
  for (const [x, y, r] of [
    [-19, -8, 4],
    [19, -8, 4],
    [-14, 8, 3],
    [14, 8, 3],
    [0, -22, 3.5],
  ] as const) {
    g.circle(x, y, r).fill({ color: accent, alpha: 0.45 });
  }

  // Ojos: almendrados, la forma más reconocible de un felino.
  g.poly([-20, -4, -8, -9, -4, -2, -16, 2]).fill(0xfff2d4);
  g.poly([20, -4, 8, -9, 4, -2, 16, 2]).fill(0xfff2d4);
  g.circle(-12, -3, 3).fill(0x160b04);
  g.circle(12, -3, 3).fill(0x160b04);

  // Hocico y colmillos.
  g.poly([-8, 10, 8, 10, 0, 19]).fill(accent);
  g.poly([-6, 19, -2, 30, 1, 19]).fill(0xfff2d4);
  g.poly([6, 19, 2, 30, -1, 19]).fill(0xfff2d4);

  c.addChild(g);
}

/** Máscara de jade: óvalo con orejeras circulares — silueta muy distinta. */
function drawMask(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  // Orejeras: lo que hace única la silueta de una máscara azteca.
  g.circle(-32, 0, 11).fill(accent);
  g.circle(32, 0, 11).fill(accent);
  g.circle(-32, 0, 5).fill({ color, alpha: 0.8 });
  g.circle(32, 0, 5).fill({ color, alpha: 0.8 });

  g.ellipse(0, 0, 26, 34).fill(color);
  // Mosaico: las máscaras de jade son teselas pegadas.
  g.moveTo(-24, -12).lineTo(24, -12).moveTo(-25, 6).lineTo(25, 6).moveTo(0, -34).lineTo(0, -12)
    .stroke({ width: 1.5, color: accent, alpha: 0.5 });

  // Ceja continua, muy característica.
  g.roundRect(-21, -18, 42, 6, 3).fill(accent);

  g.ellipse(-11, -6, 7, 5).fill(0xf3f8f2);
  g.ellipse(11, -6, 7, 5).fill(0xf3f8f2);
  g.circle(-11, -6, 2.6).fill(0x0d2b20);
  g.circle(11, -6, 2.6).fill(0x0d2b20);

  g.poly([0, -4, 4, 8, -4, 8]).fill({ color: accent, alpha: 0.8 });

  // Boca chica y cerrada. Con una boca grande y tres dientes cuadrados esto
  // se leía como Frankenstein en vez de como una máscara ceremonial.
  g.roundRect(-9, 14, 18, 6, 3).fill(0x0d2b20);
  g.moveTo(-9, 17).lineTo(9, 17).stroke({ width: 1.2, color: 0xf3f8f2, alpha: 0.8 });

  // Tocado de tres puntas: separa la máscara de una cara cualquiera.
  g.poly([-26, -26, -18, -43, -10, -28]).fill(accent);
  g.poly([-9, -30, 0, -48, 9, -30]).fill(color);
  g.poly([10, -28, 18, -43, 26, -26]).fill(accent);
  g.circle(0, -38, 3.2).fill({ color: 0xf3f8f2, alpha: 0.85 });

  c.addChild(g);
}

/** Cráneo de obsidiana: cráneo redondo + mandíbula separada. */
function drawSkull(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  g.poly([-24, -6, -26, -22, -14, -33, 14, -33, 26, -22, 24, -6, 16, 6, -16, 6]).fill(color);

  // Mandíbula, separada del cráneo: eso lo hace leer como cráneo y no como cara.
  g.roundRect(-17, 8, 34, 16, 5).fill(color);
  g.moveTo(-10, 8).lineTo(-10, 20).moveTo(-3, 8).lineTo(-3, 20)
    .moveTo(4, 8).lineTo(4, 20).moveTo(11, 8).lineTo(11, 20)
    .stroke({ width: 2, color: accent });

  // Cuencas: profundas y grandes, la marca del símbolo.
  g.ellipse(-11, -14, 8.5, 9.5).fill(0x0a0710);
  g.ellipse(11, -14, 8.5, 9.5).fill(0x0a0710);
  g.circle(-9, -13, 2.4).fill({ color: 0xd8ccf0, alpha: 0.75 });
  g.circle(13, -13, 2.4).fill({ color: 0xd8ccf0, alpha: 0.75 });

  g.poly([0, -6, 5, 3, -5, 3]).fill(0x0a0710);

  // Brillo de obsidiana pulida.
  g.poly([-20, -24, -6, -30, -12, -18]).fill({ color: 0xffffff, alpha: 0.16 });

  c.addChild(g);
}

/** Piedra del Sol: disco con rayos. El wild tiene que gritar desde lejos. */
function drawSun(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const n = (i + 0.5) / 12 * Math.PI * 2;
    g.poly([
      Math.cos(a) * 46, Math.sin(a) * 46,
      Math.cos(a - 0.13) * 30, Math.sin(a - 0.13) * 30,
      Math.cos(a + 0.13) * 30, Math.sin(a + 0.13) * 30,
    ]).fill({ color: i % 2 === 0 ? color : accent, alpha: 0.95 });
    g.circle(Math.cos(n) * 34, Math.sin(n) * 34, 2.2).fill({ color: accent, alpha: 0.8 });
  }

  g.circle(0, 0, 31).fill(accent);
  g.circle(0, 0, 26).fill(color);
  g.circle(0, 0, 26).stroke({ width: 2, color: accent, alpha: 0.6 });

  // Cara central de la Piedra del Sol.
  g.ellipse(-10, -6, 6, 5).fill(0x2a1405);
  g.ellipse(10, -6, 6, 5).fill(0x2a1405);
  g.roundRect(-11, 6, 22, 8, 4).fill(0x2a1405);
  // La lengua de pedernal, el detalle que la identifica.
  g.poly([-5, 12, 5, 12, 0, 24]).fill(0xfff0d0);

  c.addChild(g);
}

/** Templo: pirámide escalonada. Silueta triangular, única en el set. */
function drawTemple(c: Container, color: number, accent: number): void {
  const g = new Graphics();

  const tiers = [
    [-40, 30, 80, 12],
    [-32, 18, 64, 12],
    [-24, 6, 48, 12],
    [-16, -6, 32, 12],
  ] as const;

  tiers.forEach(([x, y, w, h], i) => {
    g.rect(x, y, w, h).fill({ color, alpha: 0.92 - i * 0.04 });
    g.rect(x, y, w, 2.5).fill({ color: 0xffffff, alpha: 0.22 });
  });

  // Santuario arriba.
  g.rect(-11, -22, 22, 16).fill(accent);
  g.poly([-14, -22, 14, -22, 0, -34]).fill(color);
  g.rect(-4, -16, 8, 10).fill(0x03201f);

  // Escalinata central: el eje vertical que lo hace leer como pirámide.
  g.rect(-7, -6, 14, 48).fill({ color: accent, alpha: 0.85 });
  for (let i = 0; i < 8; i++) {
    g.rect(-7, -4 + i * 6, 14, 2).fill({ color: 0x03201f, alpha: 0.55 });
  }

  c.addChild(g);
}

/** Bajos: naipe tallado en piedra. Planos a propósito, no compiten con los altos. */
/**
 * Los naipes, tallados.
 *
 * Antes eran una letra plana con un contorno. Una letra tallada en piedra
 * necesita TRES pasadas y no una: la sombra hundida abajo, el cuerpo con
 * degradado, y el filo claro arriba. Con una sola pasada el ojo ve tipografía;
 * con tres ve un objeto con espesor.
 *
 * Los naipes son casi dos tercios de lo que aparece en pantalla, así que si
 * se leen baratos, el juego entero se lee barato por bien que estén los altos.
 */
function drawGlyph(c: Container, color: number, accent: number, glyph: string): void {
  const size = glyph.length > 1 ? 42 : 56;
  const base = {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: size,
    fontWeight: '700' as const,
  };

  // 1. Hundido: la letra cae dentro de la piedra.
  const bajo = new Text({ text: glyph, style: { ...base, fill: 0x000000 } });
  bajo.anchor.set(0.5);
  bajo.position.set(0, 2.4);
  bajo.alpha = 0.55;
  c.addChild(bajo);

  // 2. Filo iluminado, un pelo arriba. Sobre piedra clara pesa menos que
  //    sobre oscura: si no, la letra se lava.
  const alto = new Text({ text: glyph, style: { ...base, fill: 0xffffff } });
  alto.anchor.set(0.5);
  alto.position.set(-0.6, -1.8);
  alto.alpha = 0.18;
  c.addChild(alto);

  // 3. El cuerpo, con el metal de la casa.
  const cuerpo = new Text({
    text: glyph,
    style: {
      ...base,
      fill: metal(mix(color, 0x000000, 0.45), color, mix(color, 0xffffff, 0.6)),
      stroke: { color: 0x160f08, width: 3.5, join: 'round' },
    },
  });
  cuerpo.anchor.set(0.5);
  c.addChild(cuerpo);
}

/** Mezcla dos colores. Sirve para derivar el metal del color del naipe. */
function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (
    (Math.round(ar + (br - ar) * t) << 16) |
    (Math.round(ag + (bg - ag) * t) << 8) |
    Math.round(ab + (bb - ab) * t)
  );
}

function buildSymbol(id: SymbolId): Container {
  const skin = SKIN[id]!;
  const c = new Container();

  // 1. El soporte donde apoya la figura.
  const bg = new Graphics();
  backing(bg, id);
  c.addChild(bg);

  // 2. La figura.
  switch (skin.shape) {
    case 'serpent': drawSerpent(c, skin.color, skin.accent); break;
    case 'jaguar': drawJaguar(c, skin.color, skin.accent); break;
    case 'mask': drawMask(c, skin.color, skin.accent); break;
    case 'skull': drawSkull(c, skin.color, skin.accent); break;
    case 'sun': drawSun(c, skin.color, skin.accent); break;
    case 'temple': drawTemple(c, skin.color, skin.accent); break;
    case 'glyph': drawGlyph(c, skin.color, skin.accent, skin.glyph ?? '?'); break;
  }

  // 3. La luz. Va al final y es idéntica en los once: es lo que hace que
  //    la grilla parezca un solo objeto iluminado y no once dibujos juntos.
  const { glow, vignette } = makeLighting();
  c.addChild(glow);
  c.addChild(vignette);

  return c;
}

export type SymbolTextures = Map<SymbolId, Texture>;

/**
 * Genera una textura por símbolo.
 *
 * `resolution` alto porque las texturas se escalan al tamaño de celda, que
 * depende de la pantalla: generar a baja resolución y agrandar se ve borroso
 * justo en los celulares que más importan.
 */
export function createSymbolTextures(app: Application): SymbolTextures {
  const out: SymbolTextures = new Map();
  const ids: SymbolId[] = [
    SYM.WILD, SYM.SCATTER, SYM.H1, SYM.H2, SYM.H3, SYM.H4,
    SYM.L1, SYM.L2, SYM.L3, SYM.L4, SYM.L5,
  ];
  // Marco FIJO para todos. Sin esto cada textura sale con los bounds de su
  // propio dibujo —la serpiente es ancha, el naipe es alto— y como en la
  // grilla los sprites se fuerzan a una celda cuadrada, cada símbolo terminaba
  // estirado en una proporción distinta.
  const frame = new Rectangle(-U, -U, U * 2, U * 2);

  for (const id of ids) {
    const c = buildSymbol(id);
    const tex = app.renderer.generateTexture({ target: c, frame, resolution: 3 });
    out.set(id, tex);
    c.destroy({ children: true });
  }
  return out;
}
