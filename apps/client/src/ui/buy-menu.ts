/**
 * MENÚ DE COMPRA DEL BONUS.
 *
 * Comprar 80× tu apuesta no es un click cualquiera: se confirma siempre.
 * Cuando el juego tiene varias variantes y cada una vale distinto, el menú
 * muestra la ESCALERA completa: qué te llevás y cuánto cuesta, una al lado de
 * la otra.
 *
 * Mostrarlas juntas no es solo comodidad. Un precio suelto no se puede
 * juzgar; tres precios con lo que dan al lado sí. Y como todas están
 * cotizadas al mismo RTP (el QA lo controla), la elección es de gusto y de
 * bolsillo, no una trampa donde una opción es peor negocio que las otras.
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { GameConfig } from '@casino/protocol';

import { PALETTE } from '../render/theme.ts';
import { vgrad } from '../render/material.ts';
import { audio } from '../render/audio.ts';
import { equis } from './format.ts';

export interface BuyVariant {
  id: string;
  label: string;
  desc: string;
  priceX: number;
}

export interface BuyMenu {
  view: Container;
  variants: readonly BuyVariant[];
  /** Muestra el menú con los precios de la apuesta actual. */
  open(): void;
  /** Los precios siguen a la apuesta, que se puede cambiar con el menú cerrado. */
  refreshPrices(): void;
}

export function createBuyMenu(opts: {
  cfg: GameConfig;
  boardW: number;
  boardH: number;
  bet: () => number;
  /** El jugador eligió una variante: hay que comprarla. */
  onBuy: (variantId: string) => void;
}): BuyMenu {
  const { cfg, boardW, boardH } = opts;
  const view = new Container();
  view.visible = false;

  const variants: readonly BuyVariant[] = cfg.bonusVariants && cfg.bonusVariants.length
    ? cfg.bonusVariants
    : [{ id: 'simple', label: 'Comprar el bonus', desc: 'Giros gratis garantizados', priceX: cfg.bonusBuyX }];

  const shade = new Graphics()
    .rect(-30, -30, boardW + 60, boardH + 200)
    .fill({ color: 0x050302, alpha: 0.85 });
  shade.eventMode = 'static'; // bloquea clicks al tablero
  view.addChild(shade);

  const alto = 130 + variants.length * 74;
  const ancho = 440;
  const x0 = boardW / 2 - ancho / 2;
  const y0 = boardH / 2 - alto / 2;

  const panel = new Graphics()
    .roundRect(x0, y0 + 4, ancho, alto, 18)
    .fill({ color: 0x000000, alpha: 0.5 })
    .roundRect(x0, y0, ancho, alto, 18)
    .fill(vgrad([[0, 0x241b10], [1, 0x140e08]]))
    .roundRect(x0, y0, ancho, alto, 18)
    .stroke({ width: 2, color: PALETTE.frameLight, alpha: 0.8 });
  view.addChild(panel);

  const t1 = new Text({
    text: 'COMPRAR EL BONUS',
    style: { fontFamily: 'Georgia, serif', fontSize: 21, fontWeight: '700', fill: PALETTE.win, letterSpacing: 1.4 },
  });
  t1.anchor.set(0.5);
  t1.position.set(boardW / 2, y0 + 30);
  view.addChild(t1);

  const sub = new Text({
    // El texto depende de cuántas variantes tenga el juego: El Kiosco tiene una sola.
    text: variants.length === 1
      ? `Paga el mismo RTP que el juego (${(cfg.rtp * 100).toFixed(2)}%): te ahorrás el camino, no ganás ventaja.`
      : `Las ${variants.length === 2 ? 'dos' : 'tres'} pagan el mismo RTP (${(cfg.rtp * 100).toFixed(2)}%): cambia qué te llevás, no la ventaja.`,
    style: { fontFamily: 'Georgia, serif', fontSize: 11.5, fill: PALETTE.textDim, align: 'center' },
  });
  sub.anchor.set(0.5);
  sub.position.set(boardW / 2, y0 + 52);
  view.addChild(sub);

  /** Una fila del menú: nombre, qué te llevás, y el precio grande. */
  const fila = (v: BuyVariant, i: number): Container => {
    const c = new Container();
    const fy = y0 + 74 + i * 74;
    const g = new Graphics();
    const dibujar = (hover: boolean): void => {
      g.clear()
        .roundRect(x0 + 16, fy, ancho - 32, 62, 12)
        .fill(vgrad([
          [0, hover ? 0x3d2d18 : 0x2c2113],
          [1, hover ? 0x281c0e : 0x1b1309],
        ]))
        .roundRect(x0 + 16, fy, ancho - 32, 62, 12)
        .stroke({ width: 1.4, color: PALETTE.frameLight, alpha: hover ? 0.9 : 0.35 });
    };
    dibujar(false);
    c.addChild(g);

    const nom = new Text({
      text: v.label,
      style: { fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: '700', fill: PALETTE.text },
    });
    nom.position.set(x0 + 32, fy + 12);
    c.addChild(nom);

    const des = new Text({
      text: v.desc,
      style: { fontFamily: 'Georgia, serif', fontSize: 11.5, fill: PALETTE.textDim },
    });
    des.position.set(x0 + 32, fy + 36);
    c.addChild(des);

    const precio = new Text({
      text: (opts.bet() * v.priceX).toLocaleString('es-AR'),
      style: { fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: '700', fill: PALETTE.win },
    });
    precio.anchor.set(1, 0);
    precio.position.set(x0 + ancho - 32, fy + 11);
    precio.label = `precio-${v.id}`;
    c.addChild(precio);

    const mult = new Text({
      text: `${equis(v.priceX)}× tu apuesta`,
      style: { fontFamily: 'Georgia, serif', fontSize: 10.5, fill: PALETTE.textDim },
    });
    mult.anchor.set(1, 0);
    mult.position.set(x0 + ancho - 32, fy + 38);
    c.addChild(mult);

    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerover', () => dibujar(true));
    c.on('pointerout', () => dibujar(false));
    c.on('pointertap', () => {
      view.visible = false;
      opts.onBuy(v.id);
    });
    return c;
  };

  variants.forEach((v, i) => view.addChild(fila(v, i)));

  const cancelar = new Text({
    text: 'Cancelar',
    style: { fontFamily: 'Georgia, serif', fontSize: 14, fill: PALETTE.textDim },
  });
  cancelar.anchor.set(0.5);
  cancelar.position.set(boardW / 2, y0 + alto - 26);
  cancelar.eventMode = 'static';
  cancelar.cursor = 'pointer';
  cancelar.on('pointertap', () => { view.visible = false; audio.click(); });
  view.addChild(cancelar);

  const refreshPrices = (): void => {
    for (const v of variants) {
      const t = view.getChildByLabel(`precio-${v.id}`, true) as Text | null;
      if (t) t.text = (opts.bet() * v.priceX).toLocaleString('es-AR');
    }
  };

  return {
    view,
    variants,
    refreshPrices,
    open() {
      refreshPrices();
      view.visible = true;
    },
  };
}
