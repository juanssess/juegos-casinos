/**
 * HUD: saldo, apuesta, botón de giro y los carteles del centro.
 *
 * Dos detalles que parecen cosméticos y no lo son:
 *
 *  - El premio se CUENTA hacia arriba, no aparece. El conteo es el momento en
 *    que el jugador siente que ganó; mostrar el número final de una lo mata.
 *  - El botón se bloquea mientras la ronda no terminó. Si se puede volver a
 *    apretar, el jugador se saltea la animación y después no entiende por qué
 *    su saldo cambió.
 */

import { Container, Graphics, Text } from 'pixi.js';
import { PALETTE, TIMING } from './theme.ts';

function label(text: string, size: number, color: number, weight: '400' | '700' = '400'): Text {
  return new Text({
    text,
    style: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: size,
      fontWeight: weight,
      fill: color,
      letterSpacing: 0.5,
    },
  });
}

const fmt = (n: number) => Math.round(n).toLocaleString('es-AR');

export class Hud {
  readonly view = new Container();
  readonly onSpin: (() => void)[] = [];
  readonly onBetChange: ((delta: number) => void)[] = [];
  readonly onTurbo: (() => void)[] = [];
  readonly onMute: (() => void)[] = [];
  readonly onBuy: (() => void)[] = [];
  readonly onAuto: (() => void)[] = [];
  readonly onInfo: (() => void)[] = [];

  #balance = label('0', 22, PALETTE.text, '700');
  #balanceCap = label('SALDO', 12, PALETTE.textDim);
  #bet = label('0', 22, PALETTE.text, '700');
  #betCap = label('APUESTA', 12, PALETTE.textDim);
  #win = label('', 26, PALETTE.win, '700');
  #winCap = label('', 12, PALETTE.textDim);
  #button = new Container();
  #buttonFace = new Graphics();
  #buttonText = label('GIRAR', 17, 0x2a1a08, '700');
  #banner = label('', 30, PALETTE.win, '700');
  #bannerSub = label('', 15, PALETTE.text);
  #enabled = true;
  #busy = false;
  #minus: Container;
  #plus: Container;
  #betCx = 0;
  #turboBtn: Container;
  #turboFace = new Graphics();
  #muteBtn: Container;
  #muteFace = new Graphics();
  #muteText = label('🔊', 15, PALETTE.text);
  #turboText = label('⚡', 15, PALETTE.text);
  #autoBtn: Container;
  #autoFace = new Graphics();
  #autoText = label('AUTO', 10, PALETTE.text, '700');
  #infoBtn: Container;
  #infoFace = new Graphics();
  #infoText = label('ⓘ', 16, PALETTE.text);
  #buyBtn = new Container();
  #buyFace = new Graphics();
  #buyCap = label('COMPRAR BONUS', 11, 0x2a1a08, '700');
  #buyPrice = label('', 18, 0x2a1a08, '700');
  #buyEnabled = true;
  #countDur = TIMING.countUp;

  #countFrom = 0;
  #countTo = 0;
  #countT = 0;
  #counting = false;

  constructor(private width: number) {
    const v = this.view;
    this.#minus = this.#betButton('−', -1);
    this.#plus = this.#betButton('+', 1);

    for (const t of [this.#balanceCap, this.#balance, this.#betCap, this.#bet, this.#winCap, this.#win]) {
      v.addChild(t);
    }

    this.#button.eventMode = 'static';
    this.#button.cursor = 'pointer';
    this.#button.addChild(this.#buttonFace);
    this.#buttonText.anchor.set(0.5);
    this.#button.addChild(this.#buttonText);
    // El botón de giro NUNCA se bloquea: durante una ronda pasa a "PARAR" y
    // el orquestador decide (girar vs saltar la animación). Un botón muerto
    // durante dos segundos es la principal causa de que un slot se sienta lento.
    this.#button.on('pointertap', () => {
      for (const cb of this.onSpin) cb();
    });
    v.addChild(this.#button);

    v.addChild(this.#minus, this.#plus);

    this.#turboBtn = this.#toggle(this.#turboFace, this.#turboText, () => {
      for (const cb of this.onTurbo) cb();
    });
    this.#muteBtn = this.#toggle(this.#muteFace, this.#muteText, () => {
      for (const cb of this.onMute) cb();
    });
    this.#autoBtn = this.#toggle(this.#autoFace, this.#autoText, () => {
      for (const cb of this.onAuto) cb();
    });
    this.#infoBtn = this.#toggle(this.#infoFace, this.#infoText, () => {
      for (const cb of this.onInfo) cb();
    });
    v.addChild(this.#turboBtn, this.#muteBtn, this.#autoBtn, this.#infoBtn);
    this.#toggleFace(this.#turboFace, false);
    this.#toggleFace(this.#muteFace, true);
    this.#toggleFace(this.#autoFace, false);
    this.#toggleFace(this.#infoFace, false);

    // Compra del bonus: la entrada directa a la Escalinata, con el precio
    // siempre visible — el jugador decide sabiendo cuánto cuesta.
    this.#buyCap.anchor.set(0.5, 0);
    this.#buyPrice.anchor.set(0.5, 0);
    this.#buyBtn.addChild(this.#buyFace, this.#buyCap, this.#buyPrice);
    this.#buyBtn.eventMode = 'static';
    this.#buyBtn.cursor = 'pointer';
    this.#buyBtn.on('pointertap', () => {
      if (this.#buyEnabled) for (const cb of this.onBuy) cb();
    });
    this.#drawBuy();
    v.addChild(this.#buyBtn);

    this.#banner.anchor.set(0.5);
    this.#bannerSub.anchor.set(0.5);
    this.#banner.alpha = 0;
    this.#bannerSub.alpha = 0;
    v.addChild(this.#banner, this.#bannerSub);

    this.#drawButton();
    this.layout(width);
  }

  #betButton(glyph: string, delta: number): Container {
    const c = new Container();
    const g = new Graphics()
      .roundRect(0, 0, 30, 30, 8)
      .fill({ color: PALETTE.frame, alpha: 0.5 })
      .stroke({ width: 1.5, color: PALETTE.frameLight, alpha: 0.7 });
    const t = label(glyph, 17, PALETTE.text, '700');
    t.anchor.set(0.5);
    t.x = 15;
    t.y = 15;
    c.addChild(g, t);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', () => {
      if (this.#enabled) for (const cb of this.onBetChange) cb(delta);
    });
    return c;
  }

  #toggle(face: Graphics, text: Text, cb: () => void): Container {
    const c = new Container();
    text.anchor.set(0.5);
    text.x = 17;
    text.y = 17;
    c.addChild(face, text);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointertap', cb);
    return c;
  }

  #toggleFace(g: Graphics, active: boolean): void {
    g.clear()
      .roundRect(0, 0, 34, 34, 9)
      .fill({ color: active ? 0x6b4a22 : 0x241a0e, alpha: 0.9 })
      .stroke({ width: 1.5, color: active ? PALETTE.win : PALETTE.frameLight, alpha: active ? 1 : 0.45 });
  }

  #drawBuy(): void {
    const w = 150;
    const h = 48;
    const on = this.#buyEnabled;
    this.#buyFace
      .clear()
      .roundRect(0, 0, w, h, 12)
      .fill({ color: on ? PALETTE.win : 0x5c4a28 })
      .stroke({ width: 2, color: on ? PALETTE.frameLight : 0x3a2c16 });
    this.#buyCap.position.set(w / 2, 7);
    this.#buyPrice.position.set(w / 2, 21);
    this.#buyBtn.alpha = on ? 1 : 0.55;
    this.#buyBtn.cursor = on ? 'pointer' : 'default';
  }

  #drawButton(): void {
    const r = 42;
    this.#buttonFace
      .clear()
      .circle(r, r, r)
      .fill({ color: this.#busy ? 0x8a6830 : PALETTE.frameLight })
      .circle(r, r, r - 5)
      .fill({ color: this.#busy ? 0xd9ae4a : PALETTE.win })
      .stroke({ width: 2, color: 0x2a1a08, alpha: 0.4 });
    this.#buttonText.x = r;
    this.#buttonText.y = r;
  }

  layout(width: number): void {
    this.width = width;
    const r = 42;

    // El botón manda: se ubica primero y todo lo demás se acomoda alrededor,
    // con separación garantizada. Antes se posicionaba cada cosa por su cuenta
    // y en pantallas angostas el botón se comía los controles de apuesta.
    const buttonCx = width - r - 10;
    this.#button.x = buttonCx - r;
    this.#button.y = 4;

    this.#balanceCap.x = 4;
    this.#balanceCap.y = 20;
    this.#balance.x = 4;
    this.#balance.y = 36;

    // Bloque de apuesta centrado entre el saldo y el botón.
    const betCx = Math.min(width * 0.46, buttonCx - r - 110);
    this.#betCx = betCx;
    this.#betCap.x = betCx - this.#betCap.width / 2;
    this.#betCap.y = 20;
    this.#bet.y = 36;
    this.#centerBet();

    this.#minus.x = betCx - 62;
    this.#minus.y = 32;
    this.#plus.x = betCx + 32;
    this.#plus.y = 32;

    this.#winCap.anchor.set(0.5, 0);
    this.#win.anchor.set(0.5, 0);
    const winCx = (betCx + buttonCx - r) / 2 + 30;
    this.#winCap.x = winCx;
    this.#winCap.y = 20;
    this.#win.x = winCx;
    this.#win.y = 34;

    // Toggles chicos bajo el botón de giro: [⚡][🔊][AUTO][ⓘ]
    const toggleY = 96;
    this.#turboBtn.position.set(buttonCx - 118, toggleY);
    this.#muteBtn.position.set(buttonCx - 76, toggleY);
    this.#autoBtn.position.set(buttonCx - 34, toggleY);
    this.#infoBtn.position.set(buttonCx + 8, toggleY);

    // Compra del bonus, bajo el saldo.
    this.#buyBtn.position.set(4, 72);

    this.#banner.x = width / 2;
    this.#banner.y = -180;
    this.#bannerSub.x = width / 2;
    this.#bannerSub.y = -144;
  }

  setBalance(v: number): void {
    this.#balance.text = fmt(v);
  }

  setBet(v: number): void {
    this.#bet.text = fmt(v);
    // El ancho del texto cambia con la cifra, así que hay que recentrar cada
    // vez; si no, la apuesta "camina" al pasar de 20 a 2.000.
    this.#centerBet();
  }

  #centerBet(): void {
    this.#bet.x = this.#betCx - this.#bet.width / 2;
  }

  /** Habilita/deshabilita SOLO los controles de apuesta (el giro no se bloquea). */
  setEnabled(v: boolean): void {
    this.#enabled = v;
    this.#minus.alpha = v ? 1 : 0.4;
    this.#plus.alpha = v ? 1 : 0.4;
  }

  /** Durante una ronda el botón pasa a "PARAR" (salta la animación). */
  setBusy(v: boolean): void {
    this.#busy = v;
    this.#buttonText.text = v ? 'PARAR' : 'GIRAR';
    this.#drawButton();
  }

  setTurbo(on: boolean): void {
    this.#toggleFace(this.#turboFace, on);
    this.#turboText.alpha = on ? 1 : 0.55;
  }

  setMuted(muted: boolean): void {
    this.#muteText.text = muted ? '🔇' : '🔊';
    this.#toggleFace(this.#muteFace, !muted);
  }

  /** 0 = auto apagado; >0 = giros automáticos restantes. */
  setAuto(remaining: number): void {
    this.#autoText.text = remaining > 0 ? String(remaining) : 'AUTO';
    this.#autoText.style.fontSize = remaining > 0 ? 14 : 10;
    this.#toggleFace(this.#autoFace, remaining > 0);
  }

  setBuyPrice(credits: number): void {
    this.#buyPrice.text = fmt(credits);
  }

  setBuyEnabled(v: boolean): void {
    this.#buyEnabled = v;
    this.#drawBuy();
  }

  /** Arranca el conteo del premio. Es el momento emocional del giro. */
  countTo(amount: number, durationMs = TIMING.countUp): void {
    this.#countFrom = this.#countTo;
    this.#countTo = amount;
    this.#countT = 0;
    this.#countDur = durationMs;
    this.#counting = amount > 0;
    this.#winCap.text = amount > 0 ? 'GANANCIA' : '';
    if (amount <= 0) this.#win.text = '';
  }

  resetWin(): void {
    this.#countFrom = 0;
    this.#countTo = 0;
    this.#counting = false;
    this.#win.text = '';
    this.#winCap.text = '';
  }

  showBanner(main: string, sub = ''): void {
    this.#banner.text = main;
    this.#bannerSub.text = sub;
    this.#banner.alpha = 1;
    this.#bannerSub.alpha = sub ? 1 : 0;
    this.#banner.scale.set(0.7);
  }

  hideBanner(): void {
    this.#banner.alpha = 0;
    this.#bannerSub.alpha = 0;
  }

  update(dtMs: number): void {
    if (this.#counting) {
      this.#countT += dtMs;
      const k = Math.min(1, this.#countT / this.#countDur);
      const eased = 1 - Math.pow(1 - k, 3);
      this.#win.text = fmt(this.#countFrom + (this.#countTo - this.#countFrom) * eased);
      if (k >= 1) this.#counting = false;
    }
    if (this.#banner.alpha > 0 && this.#banner.scale.x < 1) {
      this.#banner.scale.set(Math.min(1, this.#banner.scale.x + dtMs / 220));
    }
  }
}
