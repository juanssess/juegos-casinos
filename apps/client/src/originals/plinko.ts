/**
 * La Kermés — el Plinko.
 *
 * Cada tiro se resuelve y se liquida ANTES de que la bolita caiga: el
 * camino (izquierda o derecha en cada fila) sale del RNG al tirar, y la
 * animación solo lo recorre. Por eso se pueden tirar varias bolitas
 * seguidas sin esperar, y por eso una recarga a mitad de caída no pierde
 * nada: la jugada ya estaba pagada.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { plinkoDrop, plinkoKey, plinkoOdds, roundPay, type PlinkoDef } from '@casino/math';

import { audio } from '../render/audio.ts';
import type { OriginalCtx } from './boot.ts';
import { choice, equis, fichas } from './ui.ts';

interface Ball {
  sprite: Sprite;
  path: number[];
  /**
   * Tramo que está recorriendo: el tramo `s` va del punto s−1 al s, donde
   * el punto −1 es la entrada arriba del tablero, el punto s < filas es el
   * clavo que golpea en la fila s, y el punto `filas` es el casillero.
   */
  seg: number;
  /** Avance dentro del tramo, de 0 a 1. */
  k: number;
  bucket: number;
  pay: number;
}

/** Tiros en el aire a la vez, como máximo. */
const MAX_BALLS = 12;

export function startPlinko(ctx: OriginalCtx, def: PlinkoDef): void {
  const { app, shell, wallet, pieces, world, rng, m } = ctx;
  const P = m.theme.PALETTE;

  let rows = def.rows[1] ?? def.rows[0]!;
  let risk = def.risks[1]?.id ?? def.risks[0]!.id;

  // ── Escena ───────────────────────────────────────────────────────────
  const pegLayer = new Container();
  const bucketLayer = new Container();
  const ballLayer = new Container();
  const last = new Text({
    text: '',
    style: { fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: '700', fill: P.text, stroke: { color: 0x000000, width: 5 } },
  });
  last.anchor.set(0.5, 1);
  world.addChild(pegLayer, bucketLayer, ballLayer, last);

  let W = 800;
  let H = 500;
  /** Geometría del tablero para `rows` filas: separación y origen. */
  const geo = { gap: 30, top: 80, cx: 400, peg: 10, ball: 18 };
  const pegPos = (r: number, i: number) => ({ x: geo.cx + (i - r / 2) * geo.gap, y: geo.top + r * geo.gap });
  const bucketX = (k: number) => geo.cx + (k - rows / 2) * geo.gap;
  const bucketY = () => geo.top + rows * geo.gap + geo.gap * 0.15;

  const bucketViews: { box: Graphics; label: Text; pulse: number }[] = [];

  /** Color del casillero según cuánto paga: rojo las puntas grandes, frío lo que no devuelve. */
  function bucketColor(x: number): number {
    if (x >= 100) return 0xff3b5c;
    if (x >= 10) return 0xff7a3c;
    if (x >= 2) return 0xffb43c;
    if (x >= 1) return 0xf4d36a;
    return 0x6f88b8;
  }

  function build(): void {
    pegLayer.removeChildren();
    bucketLayer.removeChildren();
    bucketViews.length = 0;
    // Arriba van el título y las chances de las puntas; abajo, los casilleros.
    const TOP = 96;
    geo.gap = Math.max(14, Math.min(46, (W - 30) / (rows + 2), (H - TOP - 16) / (rows + 0.9)));
    geo.cx = W / 2;
    geo.top = TOP + Math.max(0, (H - TOP - 16 - (rows + 0.9) * geo.gap) / 2);
    geo.peg = geo.gap * 0.34;
    geo.ball = geo.gap * 0.72;
    const pegTex = pieces.get(0);
    // Fila r tiene r + 3 clavos: la bola entra por el medio de la primera.
    for (let r = 0; r < rows; r++) {
      for (let i = -1; i <= r + 1; i++) {
        const p = pegPos(r, i);
        if (pegTex) {
          const s = new Sprite(pegTex);
          s.anchor.set(0.5);
          s.width = s.height = geo.peg;
          s.position.set(p.x, p.y);
          pegLayer.addChild(s);
        } else {
          pegLayer.addChild(new Graphics().circle(p.x, p.y, geo.peg / 2).fill(P.frameLight));
        }
      }
    }
    const table = def.tables[plinkoKey(rows, risk)]!;
    const fontSize = Math.max(8, Math.min(14, geo.gap * 0.34));
    table.forEach((x, k) => {
      const box = new Graphics();
      const c = bucketColor(x);
      const w = geo.gap * 0.92;
      const h = geo.gap * 0.78;
      box.roundRect(-w / 2, 0, w, h, h * 0.25).fill({ color: c, alpha: 0.9 })
        .roundRect(-w / 2, 0, w, h, h * 0.25).stroke({ width: 1.5, color: 0x000000, alpha: 0.35 });
      box.position.set(bucketX(k), bucketY());
      const label = new Text({
        text: x >= 100 ? String(x) : String(x).replace('.', ','),
        style: { fontFamily: 'system-ui, sans-serif', fontSize, fontWeight: '800', fill: 0x1a0d06 },
      });
      label.anchor.set(0.5);
      label.position.set(bucketX(k), bucketY() + h / 2);
      bucketLayer.addChild(box, label);
      bucketViews.push({ box, label, pulse: 0 });
    });
    last.position.set(W / 2, 74);
  }

  ctx.onResize((w, h) => {
    W = w;
    H = h;
    build();
  });

  // ── Controles ────────────────────────────────────────────────────────
  const rowsPick = choice(def.rows.map((n) => ({ value: n, label: String(n) })), rows, (n) => {
    rows = n;
    build();
    showOdds();
  });
  shell.group('Filas', rowsPick.el);
  const riskPick = choice(def.risks.map((r) => ({ value: r.id, label: r.label })), risk, (id) => {
    risk = id;
    build();
    showOdds();
  });
  shell.group('Riesgo', riskPick.el);

  function showOdds(): void {
    const t = def.tables[plinkoKey(rows, risk)]!;
    const odds = plinkoOdds(rows);
    const edge = odds[0]! * 2;
    last.text = `puntas ${equis(t[0]!)} · 1 de cada ${Math.round(1 / edge).toLocaleString('es-AR')}`;
  }

  // ── Tiros ────────────────────────────────────────────────────────────
  const balls: Ball[] = [];
  /** Lo ganado que todavía está cayendo: el saldo lo muestra al llegar. */
  let inFlight = 0;
  let sending = false;

  function setButton(): void {
    shell.main.textContent = 'TIRAR';
    shell.main.disabled = sending || balls.length >= MAX_BALLS;
    const locked = balls.length > 0;
    rowsPick.disable(locked);
    riskPick.disable(locked);
    shell.lock(locked);
  }

  async function drop(): Promise<void> {
    if (sending || balls.length >= MAX_BALLS) return;
    const bet = shell.bet();
    sending = true;
    setButton();
    audio.click();
    const ok = await wallet.debit(bet);
    if (!ok) {
      sending = false;
      setButton();
      shell.setBalance(wallet.balance);
      shell.flash('Saldo insuficiente', 'lose');
      return;
    }
    const { path, bucket } = plinkoDrop(rows, rng);
    const x = def.tables[plinkoKey(rows, risk)]![bucket]!;
    const pay = roundPay(bet * x, rng);
    // Se liquida ya: la caída es teatro de algo que ya pasó.
    await wallet.settle(bet, pay, `${rows} filas, riesgo ${risk} · ${equis(x)}`);
    inFlight += pay;
    shell.setBalance(wallet.balance - inFlight);
    sending = false;

    const sprite = new Sprite(pieces.get(1));
    sprite.anchor.set(0.5);
    sprite.width = sprite.height = geo.ball;
    sprite.position.set(geo.cx, geo.top - geo.gap * 1.1);
    ballLayer.addChild(sprite);
    if (balls.length === 0) wallet.busy(true);
    balls.push({ sprite, path, seg: 0, k: 0, bucket, pay });
    setButton();
  }

  function land(b: Ball): void {
    const t = def.tables[plinkoKey(rows, risk)]!;
    const x = t[b.bucket]!;
    inFlight -= b.pay;
    shell.setBalance(wallet.balance - inFlight);
    const v = bucketViews[b.bucket];
    if (v) v.pulse = 1;
    if (x >= 1) audio.win(x);
    else audio.reelStop();
    if (x >= 10) {
      audio.bigWin(x >= 100 ? 2 : 1);
      shell.flash(`+${fichas(b.pay)}  ·  ${equis(x)}`, 'win');
      ctx.glow(true);
      window.setTimeout(() => ctx.glow(false), 1400);
    }
    ballLayer.removeChild(b.sprite);
    b.sprite.destroy();
    if (balls.length === 0) wallet.busy(false);
    setButton();
  }

  /** El punto `s` del recorrido de una bolita (ver `Ball.seg`). */
  function pointOf(b: Ball, s: number): { x: number; y: number } {
    if (s < 0) return { x: geo.cx, y: geo.top - geo.gap * 1.1 };
    let c = 0;
    for (let r = 0; r < s && r < rows; r++) c += b.path[r]!;
    if (s >= rows) return { x: bucketX(c), y: bucketY() + geo.gap * 0.2 };
    const p = pegPos(s, c);
    // Apoyada arriba del clavo, no clavada en él.
    return { x: p.x, y: p.y - (geo.peg + geo.ball) * 0.42 };
  }

  app.ticker.add((tk) => {
    // Un clavo cada ~110 ms: rápido como una bolita de verdad, lento para seguirla.
    const stepMs = 110;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i]!;
      b.k += tk.deltaMS / stepMs;
      while (b.k >= 1) {
        b.k -= 1;
        b.seg++;
        if (b.seg <= rows) audio.reelStop();
      }
      if (b.seg > rows) {
        balls.splice(i, 1);
        land(b);
        continue;
      }
      const a = pointOf(b, b.seg - 1);
      const z = pointOf(b, b.seg);
      const e = b.k;
      b.sprite.x = a.x + (z.x - a.x) * e;
      // Cae acelerando y rebota un poco hacia arriba al salir del clavo.
      b.sprite.y = a.y + (z.y - a.y) * e * e - Math.sin(e * Math.PI) * geo.gap * 0.22;
      b.sprite.rotation += (z.x >= a.x ? 1 : -1) * tk.deltaMS * 0.008;
    }
    for (const v of bucketViews) {
      if (v.pulse <= 0) continue;
      v.pulse = Math.max(0, v.pulse - tk.deltaMS / 450);
      const s = 1 + 0.25 * v.pulse;
      v.box.scale.set(s);
      v.label.scale.set(s);
    }
  });

  shell.main.onclick = () => void drop();
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      void drop();
    }
  });

  setButton();
  showOdds();

  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __original: {
        drop: () => drop(),
        get state() { return { balls: balls.length, inFlight, balance: wallet.balance }; },
      },
    });
  }
}
