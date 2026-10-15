/**
 * Pantalla de información: la tabla de pagos y las reglas de la función.
 *
 * Hay tres familias y cada una se explica distinto: las líneas (3, 4 o 5 en
 * línea), los racimos pegados (tamaño del racimo) y "en cualquier lado"
 * (cuántos hay en la grilla). La regla de arriba es lo único que el jugador
 * no puede deducir mirando la pantalla, así que va primero.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { GameConfig } from '@casino/protocol';
import { PAYING_SYMBOLS, SYMBOL_NAMES, TIER_LABELS, type SlotGameDef } from '@casino/math';

import type { SymbolTextures } from '../render/symbols.ts';
import { PALETTE } from '../render/theme.ts';
import { audio } from '../render/audio.ts';
import { equis } from './format.ts';

export function createPaytable(opts: {
  cfg: GameConfig;
  game: SlotGameDef;
  labels: Record<number, string>;
  textures: SymbolTextures;
  boardW: number;
  boardH: number;
  cluster: boolean;
  hasClimb: boolean;
}): Container {
  const { cfg, labels: SKIN, textures, boardW, boardH } = opts;
  const GAME = opts.game;
  const view = new Container();
  view.visible = false;

  const shade = new Graphics()
    .rect(-30, -46, boardW + 60, boardH + 240)
    .fill({ color: 0x0a0603, alpha: 0.96 });
  shade.eventMode = 'static';
  shade.cursor = 'pointer';
  shade.on('pointertap', () => {
    view.visible = false;
    audio.click();
  });
  view.addChild(shade);

  const t = (text: string, x: number, y: number, size: number, color: number, anchor = 0): Text => {
    const tx = new Text({
      text,
      style: { fontFamily: 'Georgia, serif', fontSize: size, fill: color, fontWeight: size > 13 ? '700' : '400' },
    });
    tx.anchor.set(anchor, 0);
    tx.position.set(x, y);
    view.addChild(tx);
    return tx;
  };

  const sprite = (sym: number, size: number, x: number, y: number): void => {
    const spr = new Sprite(textures.get(sym)!);
    spr.width = size;
    spr.height = size;
    spr.position.set(x, y);
    view.addChild(spr);
  };

  const pie = (prefijo: string): string =>
    `${prefijo}${equis(cfg.bonusBuyX)}× la apuesta` +
    `  ·  RTP ${(cfg.rtp * 100).toFixed(2)}%` +
    (cfg.maxWinX ? `  ·  premio máximo ${cfg.maxWinX.toLocaleString('es-AR')}×` : '');

  t(`${cfg.title.toUpperCase()} — TABLA DE PAGOS`, boardW / 2, -34, 22, PALETTE.win, 0.5);

  if (opts.cluster) {
    /* Los símbolos que el juego USA DE VERDAD. La enumeración del motor
       tiene once y la comparten todos los juegos, pero La Vendimia solo pone
       seis en las tiras. Se deducen de la tabla de pagos —fila en cero es
       símbolo que no existe— en vez de listarlos a mano. */
    const enJuego = PAYING_SYMBOLS.filter((s) => (cfg.paytable[s] ?? []).some((v) => v > 0));
    /* Dos clases de juego de racimos: los que piden símbolos PEGADOS (La
       Vendimia) y los que pagan EN CUALQUIER LADO (El Kiosco). Cambian la
       regla de arriba, los tramos y la sección de la feature. */
    const racimos = GAME as { payMode?: string; tierLabels?: readonly string[]; minSize?: number; cascadeMults?: readonly number[] };
    const enCualquierLado = racimos.payMode === 'anywhere';
    const tramos = racimos.tierLabels ?? TIER_LABELS;

    t('premios en múltiplos de la ficha (apuesta ÷ 20)  ·  tocá para cerrar', boardW / 2, -8, 10.5, PALETTE.textDim, 0.5);
    t(enCualquierLado
      ? `PAGAN ${racimos.minSize ?? 8} O MÁS IGUALES EN CUALQUIER LUGAR DE LA GRILLA — no hace falta que se toquen.`
      : 'UN RACIMO SON 5 O MÁS SÍMBOLOS IGUALES PEGADOS — arriba, abajo o al costado, en cualquier forma.',
      boardW / 2, 8, 11.5, PALETTE.scatter, 0.5);

    const colX = tramos.map((_, k) => boardW - 54 * (tramos.length - 1 - k));
    tramos.forEach((lab, k) => t(lab, colX[k]!, 30, 10.5, PALETTE.textDim, 1));
    t(enCualquierLado ? 'cuántos hay en la grilla →' : 'tamaño del racimo →', 4, 30, 10.5, PALETTE.textDim);

    enJuego.forEach((sym, k) => {
      const y = 46 + k * 34;
      sprite(sym, 30, 2, y);
      t(SKIN[sym] ?? SYMBOL_NAMES[sym]!, 38, y + 8, 12, PALETTE.text);
      const fila = cfg.paytable[sym] ?? [];
      for (let c = 0; c < colX.length; c++) t(String(fila[c] ?? 0), colX[c]!, y + 8, 12, PALETTE.win, 1);
    });

    const reglasY = 46 + enJuego.length * 34 + 6;
    sprite(0, 34, 2, reglasY);
    if (enCualquierLado) {
      t(`${SKIN[0]}: solo en los giros gratis. No paga y no se va con las cascadas.`, 40, reglasY + 2, 11.5, PALETTE.text);
      t('Si la secuencia gana, el premio se multiplica por la SUMA de todas las bombas de la grilla.',
        40, reglasY + 18, 10.5, PALETTE.textDim);
    } else {
      t('Sustituye a todo menos a la Barrica, y PEGA racimos.', 40, reglasY + 2, 11.5, PALETTE.text);
      t('Una misma tijera puede cobrar en dos racimos distintos a la vez.', 40, reglasY + 18, 10.5, PALETTE.textDim);
    }

    sprite(1, 34, 2, reglasY + 40);
    const sp = cfg.scatterPaytable;
    const scatPlural = enCualquierLado ? 'chupetines' : 'barricas';
    t(`${cfg.scattersToTrigger}+ ${scatPlural} en cualquier lado dan giros gratis.`, 40, reglasY + 42, 11.5, PALETTE.text);
    t(`Además pagan ${sp[4]}× / ${sp[5]}× / ${sp[6]}× la apuesta con 4, 5 y 6${enCualquierLado ? ' o más' : ''}.`,
      40, reglasY + 58, 10.5, PALETTE.textDim);

    const escY = reglasY + 88;
    if (enCualquierLado) {
      const k = GAME as { freeSpinsAwarded: number; freeSpinsRetrigger: number; scattersToRetrigger?: number };
      t('CASCADAS Y BOMBAS', 4, escY, 14, PALETTE.scatter);
      t('Lo que gana se va, cae lo de arriba, entra lo nuevo y se vuelve a mirar, hasta que no haya premio.',
        4, escY + 20, 11, PALETTE.text);
      t(`Giros gratis: ${k.freeSpinsAwarded} giros · ${k.scattersToRetrigger ?? cfg.scattersToTrigger}+ ${scatPlural} adentro suman ${k.freeSpinsRetrigger} más.`,
        4, escY + 38, 11, PALETTE.text);
      t('Las bombas valen de ×2 a ×500 y se SUMAN: dos de ×10 y una de ×25 multiplican ×45.',
        4, escY + 56, 11, PALETTE.mult ?? PALETTE.win);
      t(pie('Compra del bonus desde '), 4, escY + 78, 10.5, PALETTE.textDim);
    } else {
      t('CASCADAS Y LA ESCALERA', 4, escY, 14, PALETTE.scatter);
      t('Lo que gana se va, cae lo de arriba, entra lo nuevo y se vuelve a mirar. Cada cascada',
        4, escY + 20, 11, PALETTE.text);
      t('de la misma jugada sube el multiplicador un escalón:', 4, escY + 34, 11, PALETTE.text);
      t((racimos.cascadeMults ?? []).map((m) => `×${m}`).join('  →  '), 4, escY + 52, 13, PALETTE.win);
      t('En los giros gratis la escalera NO vuelve a empezar: sigue donde quedó hasta el final.',
        4, escY + 72, 11, PALETTE.mult ?? PALETTE.win);
      t(pie('Compra del bonus desde '), 4, escY + 90, 10.5, PALETTE.textDim);
    }
    return view;
  }

  t('premios en múltiplos de la apuesta por línea (apuesta ÷ 20) · tocá para cerrar', boardW / 2, -4, 11, PALETTE.textDim, 0.5);

  // Grilla 3x3 de símbolos pagadores con sus pagos.
  const cellW = (boardW - 8) / 3;
  PAYING_SYMBOLS.forEach((sym, k) => {
    const x = 4 + (k % 3) * cellW;
    const y = 26 + Math.floor(k / 3) * 64;
    sprite(sym, 52, x, y);
    const pays = cfg.paytable[sym]!;
    t(SKIN[sym] ?? SYMBOL_NAMES[sym]!, x + 58, y + 8, 13, PALETTE.text);
    t(`3: ${pays[3]}   4: ${pays[4]}   5: ${pays[5]}`, x + 58, y + 28, 12, PALETTE.textDim);
  });

  // Especiales y reglas.
  const rulesY = 26 + 3 * 64 + 6;
  sprite(0, 44, 4, rulesY);
  const scatterName = opts.hasClimb ? 'Templo' : 'Dinamita';
  t(`Sustituye a todo menos a la ${scatterName}`, 54, rulesY + 12, 12, PALETTE.textDim);

  sprite(1, 44, boardW / 2, rulesY);
  const scatPays = cfg.scatterPaytable;
  t(`3/4/5 en cualquier lado: ${scatPays[3]}×/${scatPays[4]}×/${scatPays[5]}× la apuesta · 3+ dan giros gratis`,
    boardW / 2 + 50, rulesY + 12, 11, PALETTE.textDim);

  // La sección de la feature cambia según el juego: escalinata o pegajosos.
  const featY = rulesY + 54;
  if (opts.hasClimb) {
    t('LA ESCALINATA', 4, featY, 15, PALETTE.scatter);
    t(cfg.climbTiers.map((tt, k) => `N${k + 1}: ${tt.spins}×${tt.multiplier}`).join('   '), 4, featY + 22, 12.5, PALETTE.text);
    const oddsTxt = cfg.climbAscendPerMil.map((o) => `${o / 10}%`).join(' → ');
    t(`Probabilidad de subir cada escalón: ${oddsTxt} · retrigger: 3+ templos = +5 giros`,
      4, featY + 42, 11, PALETTE.textDim);
  } else {
    t('WILDS PEGAJOSOS', 4, featY, 15, PALETTE.scatter);
    t('En los giros gratis, cada wild que cae sortea un multiplicador y QUEDA FIJO hasta el final.',
      4, featY + 22, 12, PALETTE.text);
    const multTable = (GAME as { wildMultsFree?: readonly { mult: number; perMil: number }[] }).wildMultsFree ?? [];
    t(multTable.map((w) => `×${w.mult}: ${(w.perMil / 10).toFixed(1)}%`).join('   '), 4, featY + 42, 12, PALETTE.text);
    t('Los multiplicadores de una misma línea SE MULTIPLICAN entre sí (×10 y ×25 = ×250).',
      4, featY + 62, 11, PALETTE.textDim);
  }

  t(`Compra del bonus: ${equis(cfg.bonusBuyX)}× la apuesta` +
    `  ·  RTP del juego ${(cfg.rtp * 100).toFixed(2)}%` +
    (cfg.maxWinX ? `  ·  premio máximo ${cfg.maxWinX.toLocaleString('es-AR')}×` : ''),
    4, featY + (opts.hasClimb ? 62 : 82), 11, PALETTE.textDim);
  return view;
}
