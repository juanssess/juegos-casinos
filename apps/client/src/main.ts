/**
 * Maverick — bootstrap y orquestación.
 *
 * Este archivo hace tres cosas y nada más:
 *  1. Arma la escena de Pixi.
 *  2. Habla con el RGS a través del contrato (`RgsClient`), sin saber si del
 *     otro lado hay un servidor o una implementación local.
 *  3. Reproduce los pasos que el servidor ya resolvió.
 *
 * Cambiar el RGS local por uno remoto es cambiar UNA línea: la construcción de
 * `rgs`. Nada más en todo el cliente sabe de dónde salen las rondas.
 */

import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import { CryptoRng, SYMBOL_NAMES, PAYING_SYMBOLS } from '@casino/math';
import type { ClimbDto, RgsClient, SpinStep } from '@casino/protocol';
import { RgsError, RGS_ERRORS } from '@casino/protocol';

import { pickClientGame } from './games.ts';
import { LocalRgs, roundToSteps } from './rgs/local.ts';
import { BridgeRgs, isEmbedded } from './rgs/bridge.ts';
import { setActiveTheme, PALETTE, TIMING } from './render/theme.ts';
import { ReelSet } from './render/reels.ts';
import { WinPresenter } from './render/winlines.ts';
import { Hud } from './render/hud.ts';
import { Fx } from './render/fx.ts';
import { ClimbScene } from './render/climb.ts';
import { MultLayer } from './render/mults.ts';
import { audio } from './render/audio.ts';

async function main(): Promise<void> {
  // Qué juego se carga lo decide la URL (?game=sebusca). Todo lo que sigue
  // es genérico: el orquestador no sabe de qué juego se trata.
  const profile = pickClientGame();
  const GAME = profile.game;
  const TITLE = profile.title;
  const SKIN = profile.labels;
  const BET_LEVELS = profile.betLevels;
  const DECLARED_RTP = profile.rtp;
  const BONUS_BUY_X = profile.bonusBuyX;
  // El tema se fija ANTES de crear nada: los módulos de render lo leen al
  // construirse.
  setActiveTheme(profile.palette, profile.timing);
  document.title = TITLE;

  const app = new Application();
  await app.init({
    background: PALETTE.bgBottom,
    // Sin antialias: los símbolos ya vienen rasterizados a 3x, así que el AA
    // no aporta nada y en GPUs integradas cuesta frames. La resolución se
    // capea en 1.75 por el mismo motivo (en 4K, 2x era un framebuffer enorme).
    antialias: false,
    powerPreference: 'high-performance',
    resolution: Math.min(window.devicePixelRatio || 1, 1.75),
    autoDensity: true,
    resizeTo: window,
  });
  document.getElementById('stage')!.appendChild(app.canvas);

  // El audio necesita un gesto del usuario para arrancar.
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);

  // ── Aquí, y solo aquí, se elige de dónde vienen las rondas y la plata. ───
  //
  // Embebido en el casino (?wallet=parent): la billetera es la del casino y
  // el juego le pide permiso para cada débito. Suelto: billetera propia con
  // fichas de práctica. El resto del cliente no distingue una de otra.
  const embedded = isEmbedded();
  const engine = profile.engine();
  const bridge = embedded
    ? new BridgeRgs({
        game: GAME,
        engine,
        title: TITLE,
        betLevels: BET_LEVELS,
        rtp: DECLARED_RTP,
        bonusBuyX: BONUS_BUY_X,
        ...(profile.maxWinX ? { maxWinX: profile.maxWinX } : {}),
      })
    : null;
  const rgs: RgsClient =
    bridge ??
    new LocalRgs({
      game: GAME,
      engine,
      title: TITLE,
      betLevels: BET_LEVELS,
      rtp: DECLARED_RTP,
      bonusBuyX: BONUS_BUY_X,
      ...(profile.maxWinX ? { maxWinX: profile.maxWinX } : {}),
      startingBalance: 100_000,
      latencyMs: 25,
    });

  const auth = await rgs.authenticate({ token: 'local', gameId: GAME.id });
  const cfg = auth.config;

  const textures = profile.textures(app);

  // ── Escena ───────────────────────────────────────────────────────────────
  // El fondo va fuera del contenedor escalado: cubre la pantalla y nada más.
  // Si vive adentro tiene que ser enorme para tapar los bordes en cualquier
  // escala, y eso infla los bounds de la escena entera.
  const bg = new Graphics();
  app.stage.addChild(bg);

  const root = new Container();
  app.stage.addChild(root);

  const board = new Container();
  root.addChild(board);

  const frame = new Graphics();
  board.addChild(frame);

  const CELL = profile.cellSize;
  const GAP = 6;
  const reelSet = new ReelSet({
    reels: cfg.reels,
    rows: cfg.rows,
    cellSize: CELL,
    gap: GAP,
    textures,
    scattersToTrigger: cfg.scattersToTrigger,
  });
  board.addChild(reelSet.view);

  const wins = new WinPresenter(
    reelSet,
    { reels: cfg.reels, rows: cfg.rows, cellSize: CELL, gap: GAP, paylines: cfg.paylines },
    TIMING.winCycle,
  );
  board.addChild(wins.view);

  const boardW = cfg.reels * (CELL + GAP) - GAP;
  const boardH = cfg.rows * CELL;

  const climbScene = new ClimbScene(boardW, boardH);
  board.addChild(climbScene.view);

  // Capa de multiplicadores pegajosos. Solo la usan los juegos que los
  // tienen; en el resto queda vacía y no cuesta nada.
  const multLayer = new MultLayer({ reels: cfg.reels, rows: cfg.rows, cellSize: CELL, gap: GAP });
  board.addChild(multLayer.view);

  const fx = new Fx(boardW, boardH);
  board.addChild(fx.view);

  // Contador persistente de la feature ("GIROS GRATIS 3/12 · ×5").
  const freeCounter = new Text({
    text: '',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fontWeight: '700',
      fill: PALETTE.scatter,
      letterSpacing: 1.5,
    },
  });
  freeCounter.anchor.set(0.5, 1);
  freeCounter.visible = false;
  root.addChild(freeCounter);

  let freeMode = false;
  /** ¿Este juego tiene Escalinata? Si no, la feature son pegajosos. */
  const hasClimb = cfg.climbTiers.length > 0;

  /** Oscurece un color a la mitad, para el aro exterior del marco. */
  function darken(c: number, k = 0.45): number {
    const r = Math.round(((c >> 16) & 255) * k);
    const g = Math.round(((c >> 8) & 255) * k);
    const b = Math.round((c & 255) * k);
    return (r << 16) | (g << 8) | b;
  }

  /** Marco doble; en la feature vira al color del scatter del juego. */
  function drawFrame(free: boolean): void {
    const glow = free ? PALETTE.scatter : PALETTE.frameLight;
    frame
      .clear()
      .roundRect(-22, -22, boardW + 44, boardH + 44, 20)
      .fill({ color: 0x000000, alpha: 0.4 })
      .roundRect(-17, -17, boardW + 34, boardH + 34, 16)
      .stroke({ width: 6, color: free ? darken(PALETTE.scatter) : PALETTE.frame, alpha: 0.95 })
      .roundRect(-14, -14, boardW + 28, boardH + 28, 14)
      .stroke({ width: 2.5, color: glow, alpha: 0.95 })
      .roundRect(-8, -8, boardW + 16, boardH + 16, 10)
      .stroke({ width: 1.2, color: glow, alpha: 0.3 });
    // Remaches dorados en las esquinas: detalle barato que "viste" el marco.
    for (const [cx, cy] of [
      [-14, -14], [boardW + 14, -14], [-14, boardH + 14], [boardW + 14, boardH + 14],
    ] as const) {
      frame.circle(cx, cy, 5).fill(glow);
      frame.circle(cx, cy, 2.2).fill(0x2a1a08);
    }
  }

  function setFreeMode(free: boolean): void {
    if (freeMode === free) return;
    freeMode = free;
    drawFrame(free);
    // El encabezado CAMBIA de estado: durante la feature el título deja lugar
    // al contador. Mostrar los dos a la vez los hacía chocar.
    freeCounter.visible = free;
    title.visible = !free;
  }

  const title = new Text({
    text: cfg.title.toUpperCase(),
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 34,
      fontWeight: '700',
      fill: PALETTE.frameLight,
      letterSpacing: 8,
    },
  });
  title.anchor.set(0.5, 1);
  root.addChild(title);

  const footer = new Text({
    text: `RTP ${(cfg.rtp * 100).toFixed(2)}%  ·  ${profile.tagline}  ·  volatilidad ${profile.volatility}`,
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: PALETTE.textDim },
  });
  footer.anchor.set(0.5, 0);
  root.addChild(footer);

  const hud = new Hud(boardW);
  root.addChild(hud.view);

  function layout(): void {
    const w = app.screen.width;
    const h = app.screen.height;

    // Alto que ocupa todo: tablero + HUD (140) + pie. El presupuesto lo
    // manda el HUD, que es fijo, así que el 5×5 se escala solo para entrar.
    const UI_H = 210;
    const scale = Math.min(w / (boardW + 80), h / (boardH + UI_H + 120), 1.15);
    root.scale.set(scale);
    root.x = (w - boardW * scale) / 2;
    root.y = (h - (boardH + UI_H) * scale) / 2 + 34 * scale;

    // Escenografía propia de cada juego. Todo procedural — nada de imágenes —
    // pero suficiente para que el juego no flote en un vacío negro, y para
    // que dos juegos en el mismo cliente no se sientan el mismo juego.
    bg.clear().rect(0, 0, w, h).fill(PALETTE.bgBottom);
    profile.backdrop(bg, w, h);

    drawFrame(freeMode);

    title.x = boardW / 2;
    title.y = -36;
    freeCounter.x = boardW / 2;
    freeCounter.y = -36;
    footer.x = boardW / 2;
    // Debajo de los toggles (que viven en hud.view.y + 96 y miden 34).
    footer.y = boardH + 188;
    hud.view.y = boardH + 36;
    hud.layout(boardW);
  }
  layout();
  window.addEventListener('resize', layout);

  // ── Estado de la sesión ──────────────────────────────────────────────────
  let balance = auth.balance;
  let bet = BET_LEVELS[0]!;
  let busyFlag = false;
  /**
   * `busy` es una propiedad y no una variable suelta porque el casino que
   * embebe el juego necesita saber cuándo hay una ronda en curso, para no
   * dejar salir al jugador con los rodillos girando. Interceptar la
   * asignación evita tener que avisar a mano en los cinco lugares que la
   * tocan — y olvidarse en uno.
   */
  const busyState = {
    get value(): boolean {
      return busyFlag;
    },
    set value(v: boolean) {
      if (busyFlag === v) return;
      busyFlag = v;
      bridge?.setBusy(v);
    },
  };
  /**
   * Cuando el jugador aprieta durante una ronda, esto se enciende: los
   * rodillos hacen slam stop y TODAS las esperas de presentación se resuelven
   * al instante hasta que termine la ronda. Es lo que hace que el juego
   * responda como un slot real en vez de tenerte de rehén de la animación.
   */
  let skipRequested = false;
  let turbo = false;
  try {
    turbo = localStorage.getItem(`turbo.${profile.id}`) === '1';
  } catch { /* sin storage */ }
  reelSet.turbo = turbo;
  hud.setTurbo(turbo);
  hud.setMuted(audio.muted);

  /** Factor de tiempos de presentación (turbo acorta todo). */
  const tf = () => (turbo ? 0.45 : 1);

  /**
   * Espera interrumpible sobre el RELOJ DEL JUEGO, no el de pared.
   *
   * Dos razones. Primera: si el jugador oculta la pestaña a mitad de una
   * ronda, el ticker se congela y la ronda queda EN PAUSA, en vez de seguir
   * corriendo invisible con animaciones que nadie ve. Segunda: los timers de
   * pestañas ocultas se degradan hasta 1 tick por minuto en Chrome — una
   * espera de wall-clock ahí es una trampa. El tiempo simulado avanza con
   * cada frame (o con `pump()` en QA), y `skipRequested` corta todo.
   */
  let simTime = 0;
  const waiters: { until: number; resolve: () => void }[] = [];

  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      waiters.push({ until: simTime + ms, resolve });
    });
  }

  hud.setBalance(balance);
  hud.setBet(bet);
  reelSet.setGrid(new Array(cfg.reels * cfg.rows).fill(0).map((_, i) => (i * 7) % 9 + 2));

  /** Un frame de animación. Separado del ticker para poder avanzarlo a mano. */
  function step(dt: number): void {
    simTime += dt;
    // Resolver esperas vencidas (o todas, si el jugador pidió saltar).
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i]!;
      if (skipRequested || simTime >= w.until) {
        waiters.splice(i, 1);
        w.resolve();
      }
    }
    reelSet.update(dt);
    wins.update(dt);
    hud.update(dt);
    climbScene.update(dt);
    multLayer.update(dt);
    fx.update(dt);
    board.position.set(fx.offsetX, fx.offsetY);
  }

  app.ticker.add((ticker) => step(ticker.deltaMS));

  /** Reproduce un paso: gira, frena, muestra premios. */
  async function playStep(step: SpinStep, roundBet: number): Promise<void> {
    wins.clear();

    if (step.kind === 'free' && step.freeIndex && step.freeTotal) {
      setFreeMode(true);
      // En un juego con pegajosos el multiplicador no es global: se muestra
      // cuántos hay en el tablero, que es lo que el jugador está mirando.
      freeCounter.text = step.mults
        ? `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ${multLayer.count} wilds`
        : `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ×${step.multiplier}`;
    }

    // Precalculamos qué rodillos traen scatter para sonar la campanita justo
    // cuando cada uno frena, subiendo de tono con cada scatter que cae.
    const scatterInReel: boolean[] = new Array(cfg.reels).fill(false);
    for (const cell of step.scatterCells) scatterInReel[Math.floor(cell / cfg.rows)] = true;
    let scattersLanded = 0;

    audio.spinStart();
    const spun = reelSet.spinTo(step.grid, {
      onReelStop: (r, anticipated) => {
        audio.reelStop();
        if (anticipated) {
          audio.anticipationEnd();
          hud.hideBanner();
        }
        if (scatterInReel[r]) {
          scattersLanded++;
          audio.scatterHit(scattersLanded);
        }
      },
      onAnticipation: () => {
        audio.anticipationStart();
        hud.showBanner('¡CASI!', hasClimb ? 'un templo más' : 'un cartucho más');
      },
    });
    // Si venimos salteando (fast-forward de la ronda), frenamos ya.
    if (skipRequested) reelSet.stopNow();
    await spun;
    audio.spinEnd();
    audio.anticipationEnd();
    hud.hideBanner();

    // Wilds pegajosos: los nuevos se revelan DESPUÉS de que frenan los
    // rodillos, uno por uno. Es el momento del juego — ver qué multiplicador
    // te tocó — y merece su propio tiempo, no compartirlo con el giro.
    if (step.mults) {
      const fresh = multLayer.sync(step.mults);
      if (fresh.length > 0) {
        // El más alto manda la intensidad del golpe.
        const best = Math.max(...fresh.map((c) => step.mults![c]!));
        audio.climbUp(Math.min(6, Math.log2(best)));
        fx.shake(best >= 25 ? 9 : best >= 10 ? 6 : 3);
        if (best >= 25) fx.burst(20 + fresh.length * 8);
        await wait((TIMING.wildReveal ?? 500) * tf());
      }
    }

    // El disparo en sí es un golpe corto: la celebración de verdad viene
    // después (la Escalinata, o los pegajosos llenando el tablero).
    if (step.scatterCells.length >= cfg.scattersToTrigger && step.kind === 'base') {
      audio.freeSpins();
      fx.shake(8);
      if (!hasClimb) {
        fx.announce('¡GIROS GRATIS!', `${step.awarded} giros · los wilds se quedan`, 1200);
        fx.burst(45);
        await wait(1500 * tf());
      } else {
        await wait(600 * tf());
      }
    }

    if (step.win > 0) {
      wins.show(step.lineWins);
      const countDur = TIMING.countUp * tf();
      hud.countTo(step.win, countDur);
      audio.countTicks(countDur);
      audio.win(step.win / roundBet);
      // El premio queda lo justo para leerse; solo los premios que valen la
      // pena (>2x) retienen la pantalla un poco más.
      const x = step.win / roundBet;
      const extra = x > 2 ? Math.min(3, x / 10) * 550 : 0;
      await wait((countDur + 220 + extra) * (turbo ? 0.7 : 1));
      wins.clear();
    } else {
      await wait(110);
    }
  }

  async function playRound(
    steps: SpinStep[],
    roundBet: number,
    roundId: string,
    from: number,
    climb?: ClimbDto,
  ): Promise<void> {
    let running = 0;
    // Los pegajosos son estado de la FEATURE, no del giro: se limpian al
    // empezar la ronda y no antes de cada giro.
    multLayer.clear();
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;
      running += step.win;
      if (i <= from) continue; // ya visto antes de recargar la página
      await playStep(step, roundBet);

      // Tras el giro que disparó viene la Escalinata: el bonus se gana dos
      // veces — primero el disparo, después la escalada.
      if (i === 0 && climb && steps.length > 1 && !skipRequested) {
        await climbScene.play(climb, cfg.climbTiers, wait, {
          drum: () => audio.drum(),
          up: (t) => audio.climbUp(t),
          stop: () => audio.climbStop(),
          top: () => audio.climbTop(),
        });
        const atTop = climb.tier === cfg.climbTiers.length;
        fx.announce(
          `${climb.spins} GIROS ×${climb.multiplier}`,
          atTop ? 'la Cámara del Sol' : `nivel ${climb.tier} de la Escalinata`,
          1100,
        );
        fx.burst(25 + climb.tier * 18);
        if (atTop) fx.shake(10);
        await wait(900 * tf());
      }

      hud.countTo(running, 400);
      if (i > 0) await wait(TIMING.freeSpinGap * tf());
      await rgs.acknowledge(roundId, i);
    }
    hud.hideBanner();
    setFreeMode(false);
    multLayer.clear();
  }

  /** Celebración proporcional al premio. Si todo se celebra igual, nada se celebra. */
  function celebrate(totalWin: number, roundBet: number): void {
    const x = totalWin / roundBet;
    if (x >= 100) {
      fx.announce('¡PREMIO ÉPICO!', `${x.toFixed(0)}× la apuesta`, 2000);
      fx.burst(120);
      fx.shake(14);
      audio.bigWin(3);
    } else if (x >= 40) {
      fx.announce('¡PREMIO GIGANTE!', `${x.toFixed(0)}× la apuesta`, 1600);
      fx.burst(80);
      fx.shake(10);
      audio.bigWin(2);
    } else if (x >= 15) {
      fx.announce('¡GRAN PREMIO!', `${x.toFixed(1)}× la apuesta`, 1300);
      fx.burst(50);
      fx.shake(7);
      audio.bigWin(1);
    }
  }

  /** Devuelve true si la ronda se jugó (para que el autoplay sepa si seguir). */
  async function spin(): Promise<boolean> {
    if (busyState.value) return false;
    let ok = false;
    busyState.value = true;
    skipRequested = false;
    hud.setEnabled(false);
    hud.setBusy(true);
    hud.setBuyEnabled(false);
    hud.resetWin();
    wins.clear();
    audio.click();

    try {
      const res = await rgs.spin({ bet });
      balance = res.balance;
      // Mostramos el saldo YA descontado pero SIN el premio: el premio se
      // acredita visualmente al final. Mostrar el saldo final de entrada
      // spoilea el resultado antes de que giren los rodillos.
      hud.setBalance(balance - res.round.totalWin);

      await playRound(res.round.steps, res.round.bet, res.round.roundId, -1, res.round.climb);

      celebrate(res.round.totalWin, res.round.bet);
      hud.setBalance(balance);
      ok = true;
    } catch (e) {
      if (e instanceof RgsError && e.code === RGS_ERRORS.INSUFFICIENT_FUNDS) {
        hud.showBanner('SALDO INSUFICIENTE', 'bajá la apuesta para seguir');
      } else {
        hud.showBanner('ERROR', e instanceof Error ? e.message : 'desconocido');
        console.error(e);
      }
    } finally {
      busyState.value = false;
      skipRequested = false;
      hud.setEnabled(true);
      hud.setBusy(false);
      hud.setBuyEnabled(true);
    }
    return ok;
  }

  /**
   * Compra del bonus (sin confirmación — la confirmación la pide buyBonus).
   * Misma coreografía que un giro normal; solo cambia el costo y la garantía.
   */
  async function doBuy(): Promise<void> {
    if (busyState.value) return;
    busyState.value = true;
    skipRequested = false;
    hud.setEnabled(false);
    hud.setBusy(true);
    hud.setBuyEnabled(false);
    hud.resetWin();
    wins.clear();

    try {
      const res = await rgs.buyBonus({ bet });
      balance = res.balance;
      hud.setBalance(balance - res.round.totalWin);
      await playRound(res.round.steps, res.round.bet, res.round.roundId, -1, res.round.climb);
      celebrate(res.round.totalWin, res.round.bet);
      hud.setBalance(balance);
    } catch (e) {
      if (e instanceof RgsError && e.code === RGS_ERRORS.INSUFFICIENT_FUNDS) {
        hud.showBanner('SALDO INSUFICIENTE', `la compra cuesta ${(bet * cfg.bonusBuyX).toLocaleString('es-AR')}`);
      } else {
        hud.showBanner('ERROR', e instanceof Error ? e.message : 'desconocido');
        console.error(e);
      }
    } finally {
      busyState.value = false;
      skipRequested = false;
      hud.setEnabled(true);
      hud.setBusy(false);
      hud.setBuyEnabled(true);
    }
  }

  // ── Modal de confirmación de compra ─────────────────────────────────────
  // Comprar 80x tu apuesta no es un click cualquiera: se confirma siempre.
  const buyModal = new Container();
  buyModal.visible = false;
  {
    const shade = new Graphics()
      .rect(-30, -30, boardW + 60, boardH + 200)
      .fill({ color: 0x050302, alpha: 0.82 });
    shade.eventMode = 'static'; // bloquea clicks al tablero
    buyModal.addChild(shade);

    const panel = new Graphics()
      .roundRect(boardW / 2 - 190, boardH / 2 - 100, 380, 200, 16)
      .fill(0x1c150d)
      .stroke({ width: 2.5, color: PALETTE.frameLight });
    buyModal.addChild(panel);

    const t1 = new Text({
      text: hasClimb ? 'COMPRAR LA ESCALINATA' : 'COMPRAR GIROS GRATIS',
      style: { fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: '700', fill: PALETTE.win, letterSpacing: 1 },
    });
    t1.anchor.set(0.5);
    t1.position.set(boardW / 2, boardH / 2 - 62);
    buyModal.addChild(t1);

    const t2 = new Text({
      text: '',
      style: { fontFamily: 'Georgia, serif', fontSize: 17, fill: PALETTE.text, align: 'center' },
    });
    t2.anchor.set(0.5);
    t2.position.set(boardW / 2, boardH / 2 - 18);
    t2.label = 'buy-modal-text';
    buyModal.addChild(t2);

    const mkBtn = (text: string, x: number, gold: boolean, cb: () => void): Container => {
      const c = new Container();
      const g = new Graphics()
        .roundRect(0, 0, 150, 46, 12)
        .fill(gold ? PALETTE.win : 0x241a0e)
        .stroke({ width: 2, color: gold ? PALETTE.frameLight : PALETTE.textDim });
      const t = new Text({
        text,
        style: { fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: '700', fill: gold ? 0x2a1a08 : PALETTE.text },
      });
      t.anchor.set(0.5);
      t.position.set(75, 23);
      c.addChild(g, t);
      c.position.set(x, boardH / 2 + 26);
      c.eventMode = 'static';
      c.cursor = 'pointer';
      c.on('pointertap', cb);
      return c;
    };
    buyModal.addChild(
      mkBtn('COMPRAR', boardW / 2 - 165, true, () => {
        buyModal.visible = false;
        void doBuy();
      }),
      mkBtn('CANCELAR', boardW / 2 + 15, false, () => {
        buyModal.visible = false;
        audio.click();
      }),
    );
  }
  board.addChild(buyModal);

  function askBuy(): void {
    if (busyState.value || buyModal.visible) return;
    audio.click();
    const price = bet * cfg.bonusBuyX;
    const t = buyModal.children.find((c) => c.label === 'buy-modal-text') as Text;
    t.text = `${price.toLocaleString('es-AR')} créditos (${cfg.bonusBuyX}× tu apuesta)\nGiros gratis garantizados · RTP 96.6%`;
    buyModal.visible = true;
  }

  // ── Autoplay ────────────────────────────────────────────────────────────
  let autoLeft = 0;
  let autoRunning = false;

  async function autoRun(): Promise<void> {
    if (autoRunning) return;
    autoRunning = true;
    while (autoLeft > 0 && !busyState.value) {
      autoLeft--;
      hud.setAuto(autoLeft);
      const ok = await spin();
      if (!ok) break; // saldo insuficiente u otro error: el auto no insiste
      if (autoLeft > 0) await wait(350 * tf());
    }
    autoLeft = 0;
    hud.setAuto(0);
    autoRunning = false;
  }

  /** Girar o, si ya hay ronda en curso, saltarse el teatro. */
  function spinOrSkip(): void {
    // Cualquier toque del jugador corta el autoplay: él manda.
    if (autoLeft > 0) {
      autoLeft = 0;
      hud.setAuto(0);
    }
    if (busyState.value) {
      if (!skipRequested) {
        skipRequested = true;
        reelSet.stopNow();
        audio.click();
      }
      return;
    }
    void spin();
  }

  // Superficie de depuración: permite disparar giros y capturar el frame desde
  // la consola o desde un script de prueba, sin tocar el juego.
  // Superficie de depuración: en desarrollo siempre, y en un build con
  // `?debug=1`. Lo segundo existe para poder diagnosticar el juego ya
  // compilado —por ejemplo embebido en el casino— sin recompilarlo.
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __maverick: {
        app,
        rgs,
        reelSet,
        fx,
        climbScene,
        buy: () => doBuy(),
        spin: () => spin(),
        setBet: (v: number) => {
          bet = v;
          hud.setBet(v);
        },
        get busy() {
          return busyState.value;
        },
        /**
         * QA visual de la feature. La feature entra 1 de cada ~209 rondas, así
         * que esperarla a mano no es viable: esto usa un RGS aparte, sin
         * latencia y con saldo propio, para encontrar una ronda con giros
         * gratis y reproducirla en pantalla sin tocar el saldo real.
         */
        async demoFeature(maxTries = 5000) {
          // Búsqueda SÍNCRONA contra el motor. Hacerla a través del RGS cuesta
          // un turno del event loop por ronda: 3000 rondas eran ~12 segundos
          // de pantalla congelada. Acá son microsegundos.
          const engine = createRoundEngine(GAME);
          const rng = new CryptoRng();
          const demoBet = BET_LEVELS[0]!;
          for (let i = 0; i < maxTries; i++) {
            const result = engine.play(rng, demoBet);
            if (!result.triggered) continue;
            const steps = roundToSteps(GAME, result);
            busyState.value = true;
            skipRequested = false;
            hud.setEnabled(false);
            hud.setBusy(true);
            hud.resetWin();
            await playRound(steps, demoBet, 'demo', -1, result.climb);
            celebrate(result.totalWin, demoBet);
            busyState.value = false;
            hud.setEnabled(true);
            hud.setBusy(false);
            return { tries: i + 1, steps: steps.length, win: result.totalWin };
          }
          return { tries: maxTries, steps: 0, win: 0 };
        },
        /**
         * Avanza la animación `ms` de tiempo simulado, sincrónicamente.
         *
         * El navegador congela requestAnimationFrame cuando la pestaña no está
         * visible, así que en QA automatizado el ticker no corre y no se puede
         * fotografiar un rodillo a mitad de giro. Esto avanza el reloj a mano,
         * y de paso vuelve determinista la inspección de un frame concreto.
         */
        pump(ms: number, dt = 16) {
          for (let t = 0; t < ms; t += dt) step(dt);
        },
        /** Arranca un giro hacia `grid` sin esperar a que termine. */
        demoSpin(grid: number[]) {
          wins.clear();
          void reelSet.spinTo(grid);
        },
        /** Muestra los premios de un paso ya resuelto. */
        demoWins(lineWins: unknown[]) {
          wins.show(lineWins as never);
        },
        /** Fotografía el canvas y la guarda en apps/client/.shots/<name>. */
        async shot(name = 'maverick.png') {
          const data = await app.renderer.extract.base64({ target: app.stage });
          const r = await fetch('/__shot', {
            method: 'POST',
            body: JSON.stringify({ name, data }),
          });
          return r.json();
        },
      },
    });
  }

  // ── Pantalla de información / tabla de pagos ────────────────────────────
  const infoModal = new Container();
  infoModal.visible = false;
  {
    const shade = new Graphics()
      .rect(-30, -46, boardW + 60, boardH + 240)
      .fill({ color: 0x0a0603, alpha: 0.96 });
    shade.eventMode = 'static';
    shade.cursor = 'pointer';
    shade.on('pointertap', () => {
      infoModal.visible = false;
      audio.click();
    });
    infoModal.addChild(shade);

    const t = (text: string, x: number, y: number, size: number, color: number, anchor = 0): Text => {
      const tx = new Text({
        text,
        style: { fontFamily: 'Georgia, serif', fontSize: size, fill: color, fontWeight: size > 13 ? '700' : '400' },
      });
      tx.anchor.set(anchor, 0);
      tx.position.set(x, y);
      infoModal.addChild(tx);
      return tx;
    };

    t('MAVERICK — TABLA DE PAGOS', boardW / 2, -34, 22, PALETTE.win, 0.5);
    t('premios en múltiplos de la apuesta por línea (apuesta ÷ 20) · tocá para cerrar', boardW / 2, -4, 11, PALETTE.textDim, 0.5);

    // Grilla 3×3 de símbolos pagadores con sus pagos.
    const cellW = (boardW - 8) / 3;
    PAYING_SYMBOLS.forEach((sym, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 4 + col * cellW;
      const y = 26 + row * 64;
      const spr = new Sprite(textures.get(sym)!);
      spr.width = 52;
      spr.height = 52;
      spr.position.set(x, y);
      infoModal.addChild(spr);
      const pays = cfg.paytable[sym]!;
      t(SKIN[sym]?.label ?? SYMBOL_NAMES[sym]!, x + 58, y + 8, 13, PALETTE.text);
      t(`3: ${pays[3]}   4: ${pays[4]}   5: ${pays[5]}`, x + 58, y + 28, 12, PALETTE.textDim);
    });

    // Especiales y reglas.
    const rulesY = 26 + 3 * 64 + 6;
    const wildSpr = new Sprite(textures.get(0)!);
    wildSpr.width = 44;
    wildSpr.height = 44;
    wildSpr.position.set(4, rulesY);
    infoModal.addChild(wildSpr);
    const scatterName = hasClimb ? 'Templo' : 'Dinamita';
    t(`Sustituye a todo menos a la ${scatterName}`, 54, rulesY + 12, 12, PALETTE.textDim);

    const scatSpr = new Sprite(textures.get(1)!);
    scatSpr.width = 44;
    scatSpr.height = 44;
    scatSpr.position.set(boardW / 2, rulesY);
    infoModal.addChild(scatSpr);
    const scatPays = cfg.scatterPaytable;
    t(
      `3/4/5 en cualquier lado: ${scatPays[3]}×/${scatPays[4]}×/${scatPays[5]}× la apuesta · 3+ dan giros gratis`,
      boardW / 2 + 50,
      rulesY + 12,
      11,
      PALETTE.textDim,
    );

    // La sección de la feature cambia según el juego: escalinata o pegajosos.
    const featY = rulesY + 54;
    if (hasClimb) {
      t('LA ESCALINATA', 4, featY, 15, PALETTE.scatter);
      const tiersTxt = cfg.climbTiers
        .map((tt, i) => `N${i + 1}: ${tt.spins}×${tt.multiplier}`)
        .join('   ');
      t(tiersTxt, 4, featY + 22, 12.5, PALETTE.text);
      const oddsTxt = cfg.climbAscendPerMil.map((o) => `${o / 10}%`).join(' → ');
      t(
        `Probabilidad de subir cada escalón: ${oddsTxt} · retrigger: 3+ templos = +5 giros`,
        4, featY + 42, 11, PALETTE.textDim,
      );
    } else {
      t('WILDS PEGAJOSOS', 4, featY, 15, PALETTE.scatter);
      t(
        'En los giros gratis, cada wild que cae sortea un multiplicador y QUEDA FIJO hasta el final.',
        4, featY + 22, 12, PALETTE.text,
      );
      const multTable = (GAME as { wildMultsFree?: readonly { mult: number; perMil: number }[] })
        .wildMultsFree ?? [];
      t(
        multTable.map((w) => `×${w.mult}: ${(w.perMil / 10).toFixed(1)}%`).join('   '),
        4, featY + 42, 12, PALETTE.text,
      );
      t(
        'Los multiplicadores de una misma línea SE MULTIPLICAN entre sí (×10 y ×25 = ×250).',
        4, featY + 62, 11, PALETTE.textDim,
      );
    }

    t(
      `Compra del bonus: ${cfg.bonusBuyX}× la apuesta` +
        `  ·  RTP del juego ${(cfg.rtp * 100).toFixed(2)}%` +
        (cfg.maxWinX ? `  ·  premio máximo ${cfg.maxWinX.toLocaleString('es-AR')}×` : ''),
      4,
      featY + (hasClimb ? 62 : 82),
      11,
      PALETTE.textDim,
    );
  }
  board.addChild(infoModal);

  hud.onSpin.push(spinOrSkip);
  hud.onBetChange.push((delta) => {
    const i = BET_LEVELS.indexOf(bet);
    const next = BET_LEVELS[Math.max(0, Math.min(BET_LEVELS.length - 1, i + delta))]!;
    bet = next;
    hud.setBet(bet);
    hud.setBuyPrice(bet * cfg.bonusBuyX);
    audio.click();
  });
  hud.onBuy.push(askBuy);
  hud.onAuto.push(() => {
    if (busyState.value && autoLeft === 0) return;
    audio.click();
    // Cicla 0 → 10 → 25 → 50 → 0.
    const cycle = [0, 10, 25, 50];
    const cur = cycle.indexOf(autoLeft) === -1 ? 0 : cycle.indexOf(autoLeft);
    autoLeft = cycle[(cur + 1) % cycle.length]!;
    hud.setAuto(autoLeft);
    if (autoLeft > 0 && !busyState.value) void autoRun();
  });
  hud.onInfo.push(() => {
    if (busyState.value) return;
    audio.click();
    infoModal.visible = !infoModal.visible;
  });
  hud.setBuyPrice(bet * cfg.bonusBuyX);
  hud.onTurbo.push(() => {
    turbo = !turbo;
    reelSet.turbo = turbo;
    hud.setTurbo(turbo);
    audio.click();
    try {
      localStorage.setItem(`turbo.${profile.id}`, turbo ? '1' : '0');
    } catch { /* sin storage */ }
  });
  hud.onMute.push(() => {
    audio.setMuted(!audio.muted);
    hud.setMuted(audio.muted);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      spinOrSkip();
    }
  });

  // Recuperación: si quedó una ronda a medias, se retoma antes de poder apostar.
  if (auth.pendingRound) {
    busyState.value = true;
    hud.setEnabled(false);
    hud.setBusy(true);
    const r = auth.pendingRound;
    hud.showBanner('RETOMANDO', 'tenías una ronda sin terminar');
    await wait(900);
    hud.hideBanner();
    await playRound(r.steps, r.bet, r.roundId, r.acknowledgedStep, r.climb);
    busyState.value = false;
    skipRequested = false;
    hud.setEnabled(true);
    hud.setBusy(false);
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  document.body.innerHTML =
    `<pre style="color:#f3e6cc;padding:24px;font:14px ui-monospace,monospace">` +
    `No arrancó:\n\n${e instanceof Error ? (e.stack ?? e.message) : String(e)}</pre>`;
});
