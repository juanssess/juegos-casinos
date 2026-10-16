/**
 * Famatina — el Mines.
 *
 * Las cargas se ubican AL APOSTAR (ver originals.ts) y quedan guardadas con
 * la jugada; destapar una roca solo revela lo que ya estaba. Por eso la
 * jugada se puede retomar si se recarga la página: las rocas destapadas,
 * las cargas y lo apostado están en la jugada pendiente, no en la pantalla.
 *
 * El multiplicador de cada roca es exacto (rtp / P(sobrevivir)) y el cobro
 * se redondea sin cambiar su valor esperado. Si la próxima roca llevaría el
 * premio por encima del tope, la jugada se cobra sola.
 */

import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { minesMaxReveals, minesMultiplier, placeMines, roundPay, type MinesDef } from '@casino/math';

import { audio } from '../render/audio.ts';
import type { OriginalCtx } from './boot.ts';
import { choice, equis, fichas } from './ui.ts';
import { loadPending, savePending } from './wallet.ts';

interface Pending { bet: number; m: number; mines: number[]; revealed: number[]; settled: boolean }

interface Tile {
  view: Container;
  plate: Graphics;
  face: Sprite;
  /** 0 tapada, 1 oro, 2 dinamita. Lo que se ve, no lo que hay. */
  shown: 0 | 1 | 2;
  /** Animación de dar vuelta: de 0 a 1. */
  flip: number;
  dim: boolean;
}

export function startMines(ctx: OriginalCtx, def: MinesDef): void {
  const { app, shell, wallet, pieces, world, rng, m } = ctx;
  const P = m.theme.PALETTE;
  const SIDE = 5;
  const tex = (i: number): Texture | undefined => pieces.get(i);

  // ── Escena ───────────────────────────────────────────────────────────
  const board = new Container();
  const info = new Text({
    text: '',
    style: { fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: '700', fill: P.text, stroke: { color: 0x000000, width: 5 } },
  });
  info.anchor.set(0.5, 1);
  world.addChild(board, info);

  let cell = 90;
  const tiles: Tile[] = [];
  for (let i = 0; i < def.cells; i++) {
    const view = new Container();
    const plate = new Graphics();
    const face = new Sprite(tex(2));
    face.anchor.set(0.5);
    view.addChild(plate, face);
    view.eventMode = 'static';
    view.cursor = 'pointer';
    view.on('pointertap', () => void reveal(i));
    board.addChild(view);
    tiles.push({ view, plate, face, shown: 0, flip: 1, dim: false });
  }

  function paintTile(tl: Tile): void {
    const color = tl.shown === 1 ? P.win : tl.shown === 2 ? P.scatter : P.frame;
    tl.plate.clear()
      .roundRect(-cell / 2 + 3, -cell / 2 + 3, cell - 6, cell - 6, cell * 0.14)
      .fill({ color: tl.shown === 0 ? 0x000000 : color, alpha: tl.shown === 0 ? 0.45 : 0.28 })
      .roundRect(-cell / 2 + 3, -cell / 2 + 3, cell - 6, cell - 6, cell * 0.14)
      .stroke({ width: 2, color, alpha: 0.8 });
    tl.face.texture = tex(tl.shown === 1 ? 1 : tl.shown === 2 ? 0 : 2) ?? tl.face.texture;
    const s = cell * (tl.shown === 0 ? 0.86 : 0.7);
    tl.face.width = s;
    tl.face.height = s;
    tl.view.alpha = tl.dim ? 0.45 : 1;
  }

  ctx.onResize((w, h) => {
    // Arriba van el título y el multiplicador: el tablero entra en lo que queda.
    const top = 84;
    cell = Math.floor(Math.min((w - 24) / SIDE, (h - top - 12) / SIDE, 112));
    const size = cell * SIDE;
    board.position.set((w - size) / 2, top + Math.max(0, (h - top - 12 - size) / 2));
    tiles.forEach((tl, i) => {
      tl.view.position.set((i % SIDE) * cell + cell / 2, Math.floor(i / SIDE) * cell + cell / 2);
      paintTile(tl);
    });
    info.position.set(w / 2, board.y - 10);
  });

  // ── Controles ────────────────────────────────────────────────────────
  let minesCount = 3;
  const countBox = document.createElement('div');
  countBox.className = 'o-step';
  const less = document.createElement('button');
  less.className = 'o-btn';
  less.textContent = '−';
  less.setAttribute('aria-label', 'Menos cargas');
  const countEl = document.createElement('div');
  countEl.className = 'o-value';
  countEl.style.minWidth = '40px';
  const more = document.createElement('button');
  more.className = 'o-btn';
  more.textContent = '+';
  more.setAttribute('aria-label', 'Más cargas');
  countBox.append(less, countEl, more);
  shell.group('Cargas de dinamita', countBox);
  const presets = choice([1, 3, 5, 10, 24].map((v) => ({ value: v, label: String(v) })), 3, (v) => setCount(v));
  shell.group('Rápido', presets.el);

  const random = document.createElement('button');
  random.className = 'o-btn';
  random.textContent = 'AL AZAR';
  shell.group('Destapar', random);

  function setCount(v: number): void {
    minesCount = Math.max(def.minMines, Math.min(def.maxMines, v));
    countEl.textContent = String(minesCount);
    presets.set(minesCount);
    showInfo();
  }
  less.onclick = () => setCount(minesCount - 1);
  more.onclick = () => setCount(minesCount + 1);

  // ── Estado ───────────────────────────────────────────────────────────
  let round: Pending | null = null;
  let busy = false;
  const safeCount = () => round?.revealed.length ?? 0;

  function showInfo(): void {
    const mm = round?.m ?? minesCount;
    const k = safeCount();
    const next = k < def.cells - mm ? minesMultiplier(def, mm, k + 1) : 0;
    info.text = round
      ? `${equis(k ? minesMultiplier(def, mm, k) : 1)}${next && k < minesMaxReveals(def, mm) ? `   ·   próxima ${equis(next)}` : ''}`
      : `primera pepita ${equis(minesMultiplier(def, mm, 1))}`;
    const b = shell.main;
    b.classList.remove('o-hot');
    if (!round) {
      b.textContent = 'APOSTAR';
      b.disabled = busy;
    } else if (k === 0) {
      b.textContent = 'DESTAPÁ UNA ROCA';
      b.disabled = true;
    } else {
      b.textContent = `COBRAR · ${fichas(round.bet * minesMultiplier(def, round.m, k))}`;
      b.disabled = busy;
      b.classList.add('o-hot');
    }
    const playing = round !== null;
    less.disabled = more.disabled = playing;
    presets.disable(playing);
    random.disabled = !playing || busy;
    shell.lock(playing);
  }

  function resetBoard(): void {
    for (const tl of tiles) {
      tl.shown = 0;
      tl.dim = false;
      tl.flip = 1;
      paintTile(tl);
    }
  }

  async function bet(): Promise<void> {
    if (round || busy) return;
    const amount = shell.bet();
    audio.click();
    busy = true;
    const ok = await wallet.debit(amount);
    busy = false;
    shell.setBalance(wallet.balance);
    if (!ok) {
      shell.flash('Saldo insuficiente', 'lose');
      return;
    }
    resetBoard();
    ctx.glow(false);
    round = { bet: amount, m: minesCount, mines: placeMines(def, minesCount, rng), revealed: [], settled: false };
    savePending(m.id, round);
    wallet.busy(true);
    showInfo();
  }

  /** Muestra todo el tablero al terminar: lo que no se destapó, apagado. */
  function revealAll(r: Pending): void {
    const minas = new Set(r.mines);
    tiles.forEach((tl, i) => {
      if (tl.shown) return;
      tl.shown = minas.has(i) ? 2 : 1;
      tl.dim = true;
      tl.flip = 0;
      paintTile(tl);
    });
  }

  async function reveal(i: number): Promise<void> {
    const r = round;
    if (!r || busy || r.revealed.includes(i)) return;
    const tl = tiles[i]!;
    if (r.mines.includes(i)) {
      tl.shown = 2;
      tl.flip = 0;
      paintTile(tl);
      round = null;
      r.settled = true;
      savePending(m.id, null);
      audio.anticipationStart();
      window.setTimeout(() => audio.anticipationEnd(), 400);
      revealAll(r);
      shell.flash('¡Dinamita!', 'lose');
      busy = true;
      showInfo();
      await wallet.settle(r.bet, 0, `${r.m} cargas · explotó en la roca ${r.revealed.length + 1}`);
      busy = false;
      shell.setBalance(wallet.balance);
      wallet.busy(false);
      showInfo();
      return;
    }
    r.revealed.push(i);
    savePending(m.id, r);
    tl.shown = 1;
    tl.flip = 0;
    paintTile(tl);
    audio.scatterHit(Math.min(6, r.revealed.length));
    // Llegar al tope (o al último oro) cobra solo: la próxima roca pasaría el máximo.
    if (r.revealed.length >= minesMaxReveals(def, r.m)) {
      await collect();
      return;
    }
    showInfo();
  }

  async function collect(): Promise<void> {
    const r = round;
    if (!r || busy || r.revealed.length === 0) return;
    const x = minesMultiplier(def, r.m, r.revealed.length);
    const pay = roundPay(r.bet * x, rng);
    round = null;
    r.settled = true;
    savePending(m.id, null);
    revealAll(r);
    audio.win(x);
    if (x >= 10) audio.bigWin(x >= 100 ? 2 : 1);
    ctx.glow(x >= 5);
    shell.flash(`+${fichas(pay)}  ·  ${equis(x)}`, 'win');
    busy = true;
    showInfo();
    await wallet.settle(r.bet, pay, `${r.m} cargas · ${r.revealed.length} pepitas · ${equis(x)}`);
    busy = false;
    shell.setBalance(wallet.balance);
    wallet.busy(false);
    showInfo();
  }

  random.onclick = () => {
    const r = round;
    if (!r) return;
    const free = tiles.map((_, i) => i).filter((i) => !r.revealed.includes(i));
    // El azar de la interfaz no decide nada: las cargas ya están puestas.
    void reveal(free[Math.floor(Math.random() * free.length)]!);
  };

  shell.main.onclick = () => {
    if (!round) void bet();
    else void collect();
  };

  app.ticker.add((tk) => {
    for (const tl of tiles) {
      if (tl.flip >= 1) continue;
      tl.flip = Math.min(1, tl.flip + tk.deltaMS / 260);
      // Se da vuelta: se achica de costado y vuelve con la cara nueva.
      tl.view.scale.x = Math.abs(Math.cos(tl.flip * Math.PI)) * 0.92 + 0.08;
      if (tl.flip >= 1) tl.view.scale.x = 1;
    }
  });

  // Una jugada a medias: se retoma tal cual estaba.
  const pend = loadPending<Pending>(m.id);
  if (pend && !pend.settled) {
    round = pend;
    minesCount = pend.m;
    for (const i of pend.revealed) {
      tiles[i]!.shown = 1;
      paintTile(tiles[i]!);
    }
    wallet.busy(true);
    shell.flash('Retomaste la jugada que quedó abierta', 'info');
  }
  setCount(minesCount);

  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __original: {
        bet: () => bet(),
        reveal: (i: number) => reveal(i),
        collect: () => collect(),
        setCount,
        get state() { return { round, balance: wallet.balance }; },
      },
    });
  }
}
