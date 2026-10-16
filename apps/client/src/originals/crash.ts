/**
 * Ruta 40 — el Crash.
 *
 * El camión sale y el multiplicador sube con el tiempo, m(t) = e^(k·t),
 * hasta el punto de quiebre que se sorteó AL ARRANCAR (ver originals.ts).
 * Nada de lo que pasa en pantalla cambia ese punto: la curva es el reloj
 * que el jugador mira para decidir cuándo bajarse.
 *
 * El retiro se liquida en el momento en que se pide, no cuando el motor se
 * funde: lo cobrado ya es del jugador. La curva sigue hasta el quiebre
 * igual —más rápido— para que se vea lo que hubiera pasado.
 */

import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { crashPoint, roundPay, type CrashDef } from '@casino/math';

import { audio } from '../render/audio.ts';
import type { OriginalCtx } from './boot.ts';
import { equis, fichas } from './ui.ts';
import { loadPending, savePending } from './wallet.ts';

/** Después del retiro la curva corre a esta velocidad hasta el quiebre. */
const FAST = 6;

interface Pending { bet: number; crash: number; auto: number | null; settled: boolean }

export function startCrash(ctx: OriginalCtx, def: CrashDef): void {
  const { app, shell, wallet, pieces, world, rng, m } = ctx;
  const P = m.theme.PALETTE;
  /** Velocidad de la subida: la del tema del juego (Ruta 40: ×2 a los ~11,5 s). */
  const GROWTH = (m.theme as { GROWTH?: number }).GROWTH ?? 0.00006;

  // ── Escena ───────────────────────────────────────────────────────────
  const grid = new Graphics();
  const fill = new Graphics();
  const curve = new Graphics();
  const truck = new Sprite(pieces.get(1) ?? undefined);
  truck.anchor.set(0.5, 0.75);
  const burst = new Sprite(pieces.get(0) ?? undefined);
  burst.anchor.set(0.5);
  burst.visible = false;
  const big = new Text({
    text: '×1,00',
    style: { fontFamily: 'Georgia, serif', fontSize: 64, fontWeight: '700', fill: P.text, stroke: { color: 0x000000, width: 6 } },
  });
  big.anchor.set(0.5);
  const sub = new Text({
    text: 'elegí la apuesta y arrancá',
    style: { fontFamily: 'Georgia, serif', fontSize: 18, fill: P.textDim, stroke: { color: 0x000000, width: 4 } },
  });
  sub.anchor.set(0.5);
  const history = new Container();
  world.addChild(grid, fill, curve, truck, burst, big, sub, history);

  let W = 800;
  let H = 500;
  const box = { x: 0, y: 0, w: 0, h: 0 };
  ctx.onResize((w, h) => {
    W = w;
    H = h;
    box.x = Math.max(40, w * 0.07);
    box.y = 70;
    box.w = w - box.x - Math.max(30, w * 0.05);
    box.h = h - box.y - 30;
    big.position.set(w / 2, Math.max(110, h * 0.3));
    big.style.fontSize = Math.max(40, Math.min(84, w / 11));
    sub.position.set(w / 2, big.y + big.height / 2 + 22);
    const size = Math.max(60, Math.min(120, w / 8));
    truck.width = truck.height = size;
    // El camión pintado mira a la izquierda; la ruta va a la derecha.
    truck.scale.x = -Math.abs(truck.scale.x);
    burst.width = burst.height = size * 1.6;
    drawHistory();
    draw();
  });

  // ── Estado ───────────────────────────────────────────────────────────
  let running = false;
  let t = 0;
  let mult = 1;
  let speed = 1;
  let round: Pending | null = null;
  let cashedAt = 0;
  let lastMilestone = 1;
  const past: number[] = [];

  /** Ejes: el tiempo visible crece con la ronda, el multiplicador también. */
  function view(): { tMax: number; mMax: number } {
    return { tMax: Math.max(9000, t * 1.15), mMax: Math.max(2, mult * 1.25) };
  }
  const px = (tt: number, mm: number, v: { tMax: number; mMax: number }) => ({
    x: box.x + (tt / v.tMax) * box.w,
    y: box.y + box.h - ((mm - 1) / (v.mMax - 1)) * box.h,
  });

  function draw(): void {
    const v = view();
    grid.clear();
    // Líneas de referencia en multiplicadores redondos.
    const steps = [1.5, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000].filter((s) => s < v.mMax);
    const shown = steps.slice(-4);
    for (const s of shown) {
      const y = px(0, s, v).y;
      grid.moveTo(box.x, y).lineTo(box.x + box.w, y).stroke({ width: 1, color: P.textDim, alpha: 0.18 });
    }
    grid.moveTo(box.x, box.y + box.h).lineTo(box.x + box.w, box.y + box.h).stroke({ width: 2, color: P.frameLight, alpha: 0.35 });

    curve.clear();
    fill.clear();
    if (t <= 0) {
      const p0 = px(0, 1, v);
      truck.position.set(p0.x + truck.width * 0.35, p0.y);
      truck.rotation = 0;
      return;
    }
    const n = 60;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const tt = (t * i) / n;
      pts.push(px(tt, Math.exp(GROWTH * tt), v));
    }
    const crashed = !running && round === null && burst.visible;
    const color = crashed ? 0xff5a4a : cashedAt ? 0x7dffa8 : P.scatter;
    fill.moveTo(pts[0]!.x, box.y + box.h);
    for (const p of pts) fill.lineTo(p.x, p.y);
    fill.lineTo(pts[n]!.x, box.y + box.h).closePath().fill({ color, alpha: 0.12 });
    curve.moveTo(pts[0]!.x, pts[0]!.y);
    for (const p of pts) curve.lineTo(p.x, p.y);
    curve.stroke({ width: 9, color, alpha: 0.18, cap: 'round', join: 'round' });
    curve.moveTo(pts[0]!.x, pts[0]!.y);
    for (const p of pts) curve.lineTo(p.x, p.y);
    curve.stroke({ width: 4, color, alpha: 0.95, cap: 'round', join: 'round' });

    const tip = pts[n]!;
    const prev = pts[n - 3]!;
    truck.position.set(tip.x, tip.y);
    truck.rotation = Math.max(-0.9, Math.atan2(tip.y - prev.y, tip.x - prev.x) * 0.8);
    burst.position.set(tip.x, tip.y - truck.height * 0.3);
  }

  function drawHistory(): void {
    history.removeChildren();
    let x = W - 14;
    for (const c of past.slice(-8).reverse()) {
      const tx = new Text({
        text: equis(c),
        style: { fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: '700', fill: c >= 2 ? 0x7dffa8 : 0xff8a7a },
      });
      tx.anchor.set(1, 0);
      tx.position.set(x, 48);
      x -= tx.width + 14;
      history.addChild(tx);
    }
  }

  // ── Controles ────────────────────────────────────────────────────────
  const autoInput = document.createElement('input');
  autoInput.className = 'o-input';
  autoInput.type = 'number';
  autoInput.step = '0.01';
  autoInput.min = String(def.minCashout);
  autoInput.max = String(def.maxMult);
  autoInput.placeholder = 'manual';
  autoInput.setAttribute('aria-label', 'Retiro automático');
  shell.group('Retiro automático', autoInput);

  const autoValue = (): number | null => {
    const v = Number(autoInput.value.replace(',', '.'));
    if (!autoInput.value || !Number.isFinite(v)) return null;
    return Math.min(def.maxMult, Math.max(def.minCashout, Math.floor(v * 100) / 100));
  };

  function setButton(): void {
    const b = shell.main;
    b.classList.remove('o-hot');
    if (!running) {
      b.textContent = 'ARRANCAR';
      b.disabled = false;
    } else if (!cashedAt) {
      const now = Math.floor(mult * 100) / 100;
      b.textContent = `RETIRARSE · ${fichas(round!.bet * now)}`;
      b.disabled = now < def.minCashout;
      b.classList.add('o-hot');
    } else {
      b.textContent = `COBRASTE ${equis(cashedAt)}`;
      b.disabled = true;
    }
  }

  let starting = false;
  async function start(): Promise<void> {
    if (running || starting) return;
    starting = true;
    shell.main.disabled = true;
    const bet = shell.bet();
    audio.click();
    let accepted = false;
    let debitFailed = false;
    try { accepted = await wallet.debit(bet); }
    catch (_) { debitFailed = true; }
    starting = false;
    if (!accepted) {
      setButton();
      shell.flash(debitFailed ? 'No se pudo confirmar la apuesta. Probá de nuevo.' : 'Saldo insuficiente', 'lose');
      shell.setBalance(wallet.balance);
      return;
    }
    shell.setBalance(wallet.balance);
    round = { bet, crash: crashPoint(def, rng), auto: autoValue(), settled: false };
    savePending(m.id, round);
    running = true;
    wallet.busy(true);
    shell.lock(true);
    autoInput.disabled = true;
    t = 0;
    mult = 1;
    speed = 1;
    cashedAt = 0;
    lastMilestone = 1;
    burst.visible = false;
    truck.alpha = 1;
    big.style.fill = P.text;
    sub.text = round.auto ? `retiro automático en ${equis(round.auto)}` : 'retirate antes de que se funda el motor';
    audio.spinStart();
    setButton();
  }

  async function cashout(at: number): Promise<void> {
    if (!round || cashedAt || round.settled) return;
    cashedAt = at;
    speed = FAST;
    const r = round;
    const pay = roundPay(r.bet * at, rng);
    r.settled = true;
    savePending(m.id, null);
    audio.win(at);
    if (at >= 10) audio.bigWin(at >= 100 ? 2 : 1);
    big.style.fill = 0x7dffa8;
    sub.text = `cobraste ${fichas(pay)} en ${equis(at)}`;
    shell.flash(`+${fichas(pay)}`, 'win');
    ctx.glow(at >= 10);
    setButton();
    await wallet.settle(r.bet, pay, `retiro en ${equis(at)} · se fundió en ${equis(r.crash)}`);
    shell.setBalance(wallet.balance);
  }

  async function crashNow(): Promise<void> {
    const r = round!;
    running = false;
    round = null;
    mult = r.crash;
    burst.visible = true;
    burst.alpha = 1;
    truck.alpha = 0.55;
    audio.spinEnd();
    audio.reelStop();
    past.push(r.crash);
    drawHistory();
    if (!cashedAt) {
      big.style.fill = 0xff6a5a;
      sub.text = `se fundió el motor en ${equis(r.crash)}`;
      r.settled = true;
      savePending(m.id, null);
      await wallet.settle(r.bet, 0, `se fundió en ${equis(r.crash)} sin retirarse`);
      shell.setBalance(wallet.balance);
    }
    draw();
    wallet.busy(false);
    shell.lock(false);
    autoInput.disabled = false;
    window.setTimeout(() => ctx.glow(false), 1500);
    setButton();
  }

  app.ticker.add((tk) => {
    if (burst.visible && !running) burst.alpha = Math.max(0.7, burst.alpha - tk.deltaMS / 2500);
    if (!running || !round) return;
    t += tk.deltaMS * speed;
    mult = Math.exp(GROWTH * t);
    const shownMult = Math.floor(mult * 100) / 100;
    if (round.auto && !cashedAt && shownMult >= round.auto && round.auto <= round.crash) void cashout(round.auto);
    if (mult >= round.crash) {
      t = Math.log(round.crash) / GROWTH;
      mult = round.crash;
      big.text = equis(mult);
      void crashNow();
      return;
    }
    big.text = equis(mult);
    // Una campanita por cada escalón redondo: el oído también lleva la cuenta.
    const milestone = Math.floor(Math.log2(mult) * 2);
    if (milestone > lastMilestone) {
      lastMilestone = milestone;
      audio.scatterHit(Math.min(6, milestone));
    }
    if (!cashedAt) setButton();
    draw();
  });

  shell.main.onclick = () => {
    if (!running) void start();
    else if (!cashedAt) {
      const now = Math.floor(mult * 100) / 100;
      if (now >= def.minCashout && round && now < round.crash) void cashout(now);
    }
  };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      if (document.activeElement === autoInput) return;
      e.preventDefault();
      shell.main.click();
    }
  });

  /* Una jugada que quedó a medias al recargar: lo cobrado ya se cobró. Se
     liquida con lo único que el jugador había decidido de antemano, el
     retiro automático; sin retiro automático, el motor se fundió con él. */
  const pend = loadPending<Pending>(m.id);
  if (pend && !pend.settled) {
    const won = pend.auto !== null && pend.auto <= pend.crash;
    const pay = won ? roundPay(pend.bet * pend.auto!, rng) : 0;
    savePending(m.id, null);
    void wallet.settle(pend.bet, pay, `jugada retomada · se fundió en ${equis(pend.crash)}`).then(() => {
      shell.setBalance(wallet.balance);
      shell.flash(won ? `Jugada retomada: cobraste ${fichas(pay)}` : `Jugada retomada: se fundió en ${equis(pend.crash)}`, won ? 'win' : 'lose');
    });
  }

  setButton();
  draw();

  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __original: {
        start: () => start(),
        cashout: () => shell.main.click(),
        get state() { return { running, mult, cashedAt, crash: round?.crash ?? null, balance: wallet.balance }; },
        pump(ms: number) { for (let k = 0; k < ms; k += 16) app.ticker.update(app.ticker.lastTime + 16); },
      },
    });
  }
}
