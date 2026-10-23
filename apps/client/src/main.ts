/**
 * Cliente de slots — arranque y orquestación.
 *
 * Este archivo hace tres cosas y nada más:
 *  1. Arma la escena de Pixi.
 *  2. Habla con el RGS a través del contrato (`RgsClient`), sin saber si del
 *     otro lado hay un servidor, el casino o una implementación local.
 *  3. Conecta los controles con la reproducción de rondas.
 *
 * Lo demás vive en su módulo:
 *   play/        reproducir una ronda: líneas, racimos, la Escalinata
 *   ui/          el mueble, el menú de compra, la tabla de pagos
 *   presentation el fondo y las pantallas de la función (el casino trae la suya)
 *   games.ts     qué juego es, armado a partir de los manifests
 */

import { Application, Container, FillGradient, Graphics, Text } from 'pixi.js';
import { CryptoRng, SYM } from '@casino/math';
import type { RgsClient } from '@casino/protocol';
import { RgsError, RGS_ERRORS } from '@casino/protocol';

import { pickClientGame, pickOriginal } from './games.ts';
import { LocalRgs, roundToSteps } from './rgs/local.ts';
import { BridgeRgs, isEmbedded } from './rgs/bridge.ts';
import { setActiveTheme, PALETTE, TIMING } from './render/theme.ts';
import { ReelSet } from './render/reels.ts';
import { ClusterBoard } from './render/cluster-board.ts';
import { WinPresenter } from './render/winlines.ts';
import { Hud } from './render/hud.ts';
import { Fx } from './render/fx.ts';
import { ClimbScene } from './render/climb.ts';
import { MultLayer } from './render/mults.ts';
import { HoldBoard } from './render/hold-board.ts';
import { audio } from './render/audio.ts';
import { createPresentation } from './presentation.ts';
import { paintedTextures } from './render/painted.ts';
import { drawFrame } from './ui/frame.ts';
import { createBuyMenu } from './ui/buy-menu.ts';
import { createPaytable } from './ui/paytable.ts';
import type { PlayContext, Session, TraceEntry } from './play/context.ts';
import { celebrate, playRound } from './play/round.ts';

async function main(): Promise<void> {
  // Los originales (Crash, Mines, Plinko) son otro cliente: no hay rodillos.
  const original = pickOriginal();
  if (original) {
    await (await import('./originals/boot.ts')).bootOriginal(original);
    return;
  }

  // Qué juego se carga lo decide la URL (?game=sebusca). Todo lo que sigue
  // es genérico: el orquestador no sabe de qué juego se trata.
  const profile = pickClientGame();
  const GAME = profile.game;
  const TITLE = profile.title;
  const BET_LEVELS = profile.betLevels;
  // El tema se fija ANTES de crear nada: los módulos de render lo leen al
  // construirse.
  setActiveTheme(profile.palette, profile.timing);
  document.title = TITLE;

  const presentation = createPresentation(profile);
  const app = new Application();
  await app.init({
    background: PALETTE.bgBottom,
    // Con símbolos vectoriales rasterizados a 3x el antialias no aporta y en
    // GPUs integradas cuesta frames; con arte de mapa de bits sí. Lo decide
    // la presentación. La resolución se capea en 1.75 por el mismo motivo.
    antialias: presentation.antialias,
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
  const engine = profile.engine();
  const rgsOpts = {
    game: GAME,
    engine,
    title: TITLE,
    betLevels: BET_LEVELS,
    rtp: profile.rtp,
    bonusBuyX: profile.bonusBuyX,
    ...(profile.maxWinX ? { maxWinX: profile.maxWinX } : {}),
  };
  const bridge = isEmbedded() ? new BridgeRgs(rgsOpts) : null;
  const rgs: RgsClient = bridge ?? new LocalRgs({ ...rgsOpts, startingBalance: 100_000, latencyMs: 25 });

  const auth = await rgs.authenticate({ token: 'local', gameId: GAME.id });
  const cfg = auth.config;

  await Promise.all([presentation.preload(), Fx.preload()]);
  // El arte pintado manda; el dibujo procedural cubre lo que el atlas no trae.
  const procedural = profile.textures(app);
  const textures = profile.art ? await paintedTextures(app, profile.art, procedural) : procedural;

  // ── Escena ───────────────────────────────────────────────────────────────
  // El fondo va fuera del contenedor escalado: cubre la pantalla y nada más.
  const scenery = presentation.scenery(app, profile);
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

  /* LA ÚNICA RAMA ESTRUCTURAL DEL CLIENTE.
     Un juego de racimos no tiene rodillos que giren: tiene celdas que caen,
     explotan y vuelven a caer. Es otro tablero. Pero expone la MISMA
     superficie (spinTo, stopNow, setGrid, cellSprite, update), así que a
     partir de acá el HUD, el sonido, el autoplay, la compra del bonus y la
     recuperación de ronda son exactamente los mismos para todos los juegos.
     La otra rama está en play/round.ts, y no hay una tercera. */
  const opcionesTablero = {
    reels: cfg.reels,
    rows: cfg.rows,
    cellSize: CELL,
    gap: GAP,
    textures,
    scattersToTrigger: cfg.scattersToTrigger,
    ...(profile.hold ? { anticipateAt: profile.hold.trigger - 2 } : {}),
    ...(profile.valueColor ? { valueColor: profile.valueColor } : {}),
    ...(profile.ways ? { variableHeight: true } : {}),
  };
  const reelSet: ReelSet | ClusterBoard = profile.cluster
    ? new ClusterBoard(opcionesTablero)
    : new ReelSet(opcionesTablero);
  board.addChild(reelSet.view);

  const wins = new WinPresenter(
    reelSet,
    { reels: cfg.reels, rows: cfg.rows, cellSize: CELL, gap: GAP, paylines: cfg.paylines },
    TIMING.winCycle,
  );
  board.addChild(wins.view);

  const boardW = cfg.reels * (CELL + GAP) - GAP;
  const boardH = cfg.rows * CELL;

  const climbScene = new ClimbScene(boardW, boardH, {
    ...(profile.climbName ? { title: profile.climbName } : {}),
    // Con nombre propio, la escalada la sube el scatter del juego en vez del sol de Maverick.
    ...(profile.climbName && textures.get(SYM.SCATTER) ? { marker: textures.get(SYM.SCATTER)! } : {}),
  });
  board.addChild(climbScene.view);

  // Capa de multiplicadores pegajosos. Solo la usan los juegos que los
  // tienen; en el resto queda vacía y no cuesta nada.
  const multLayer = new MultLayer({ reels: cfg.reels, rows: cfg.rows, cellSize: CELL, gap: GAP });
  board.addChild(multLayer.view);

  // Tablero de Hold & Win, encima de los rodillos y con su misma geometría.
  const holdBoard = profile.hold
    ? new HoldBoard({
        reels: cfg.reels, rows: cfg.rows, cellSize: CELL, gap: GAP,
        coin: textures.get(SYM.SCATTER)!, jackpots: profile.hold.jackpots,
        valueColor: profile.valueColor ?? (() => PALETTE.win),
      })
    : null;
  if (holdBoard) board.addChild(holdBoard.view);

  const fx = new Fx(boardW, boardH);
  board.addChild(fx.view);

  // Contador persistente de la feature ("GIROS GRATIS 3/12 · ×5").
  const freeCounter = new Text({
    text: '',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 18,
      fontWeight: '700',
      fill: 0xffedc4,
      stroke: { color: 0x100a08, width: 4 },
      letterSpacing: 1.5,
    },
  });
  freeCounter.anchor.set(0.5, 1);
  freeCounter.visible = false;
  root.addChild(freeCounter);

  /**
   * El multiplicador de la cascada actual, arriba a la derecha del mueble.
   *
   * En un juego de racimos este número ES la jugada: la diferencia entre una
   * cascada linda y un premio grande es en qué escalón te agarró.
   */
  const cascadaBadge = new Text({
    text: '',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 26,
      fontWeight: '700',
      fill: PALETTE.mult ?? PALETTE.win,
      stroke: { color: 0x100a08, width: 4 },
      letterSpacing: 1,
    },
  });
  cascadaBadge.anchor.set(1, 1);
  cascadaBadge.visible = false;
  root.addChild(cascadaBadge);

  /* Cuántos caminos tiene la caída, en los juegos de caminos. Cambia en cada
     jugada y es parte de la emoción: siete en todas son 117.649. */
  const waysLabel = profile.ways
    ? new Text({
        text: '',
        style: {
          fontFamily: 'Georgia, serif',
          fontSize: 15,
          fontWeight: '700',
          fill: PALETTE.scatter,
          stroke: { color: 0x100a08, width: 4 },
          letterSpacing: 1,
        },
      })
    : null;
  if (waysLabel) {
    waysLabel.anchor.set(0.5, 0);
    root.addChild(waysLabel);
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

  // El RTP del pie es el que midió el QA; si el juego todavía no lo pasó, se dice.
  const footer = new Text({
    text: `RTP ${(cfg.rtp * 100).toFixed(2)}%${profile.verified ? '' : ' (sin QA)'}  ·  ${profile.tagline}  ·  volatilidad ${profile.volatility}`,
    style: { fontFamily: 'system-ui, sans-serif', fontSize: 12, fill: PALETTE.textDim },
  });
  footer.anchor.set(0.5, 0);
  root.addChild(footer);

  const hud = new Hud(boardW, cfg.anteCostX);
  root.addChild(hud.view);

  let freeMode = false;

  function setFreeMode(free: boolean): void {
    if (freeMode === free) return;
    freeMode = free;
    drawFrame(frame, boardW, boardH, free);
    scenery.setFree(free);
    // El encabezado CAMBIA de estado: durante la feature el título deja lugar
    // al contador. Mostrar los dos a la vez los hacía chocar.
    freeCounter.visible = free;
    title.visible = !free;
  }

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

    bg.clear();
    scenery.layout(bg, w, h);

    /* Viñeta sobre el fondo del juego.
       Un fondo parejo de punta a punta compite con los rodillos por la
       atención. Oscurecer las esquinas empuja el ojo al centro sin que se
       note que algo lo empujó. */
    bg.rect(0, 0, w, h).fill(
      new FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.44 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.44 },
        outerRadius: 0.72,
        colorStops: [
          // Calibrado mirando el fondo, no eligiendo un número: a 0,62 la
          // viñeta se comía el marrón azteca y el juego quedaba negro.
          { offset: 0.38, color: 'rgba(0,0,0,0)' },
          { offset: 0.8, color: 'rgba(0,0,0,0.2)' },
          { offset: 1, color: 'rgba(0,0,0,0.42)' },
        ],
        textureSpace: 'local',
      }),
    );

    drawFrame(frame, boardW, boardH, freeMode);

    title.x = boardW / 2;
    title.y = -36;
    cascadaBadge.x = boardW;
    cascadaBadge.y = -34;
    if (waysLabel) {
      // Entre el tablero y el mueble: arriba compite con el título.
      waysLabel.x = boardW / 2;
      waysLabel.y = boardH + 8;
    }
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
  // Dentro de un iframe el renderer puede cambiar de tamaño sin que la
  // ventana avise: se escucha a los dos.
  app.renderer.on('resize', layout);

  // ── Estado de la sesión ──────────────────────────────────────────────────
  let balance = auth.balance;
  let bet = BET_LEVELS[0]!;

  /* APUESTA ANTE.
     Vive como un booleano y viaja en cada pedido; no es un "modo" que el
     servidor recuerde: si el que cobra y el que juega pudieran
     desincronizarse, siempre se desincronizan en contra de alguien. */
  let anteOn = false;
  let busyFlag = false;
  /**
   * `busy` es una propiedad y no una variable suelta porque el casino que
   * embebe el juego necesita saber cuándo hay una ronda en curso, para no
   * dejar salir al jugador con los rodillos girando. Y al terminar cualquier
   * ronda —bien o con error— la función se cierra: si quedara abierta, el
   * fondo y el marco seguirían en modo bonus sobre un juego normal.
   */
  const busyState = {
    get value(): boolean {
      return busyFlag;
    },
    set value(v: boolean) {
      if (busyFlag === v) return;
      busyFlag = v;
      if (!v) {
        presentation.featureEnd();
        setFreeMode(false);
        layout();
      }
      bridge?.setBusy(v);
    },
  };

  const session: Session = { turbo: false, skipRequested: false, simTime: 0, accum: 0 };
  try {
    session.turbo = localStorage.getItem(`turbo.${profile.id}`) === '1';
  } catch { /* sin storage */ }
  reelSet.turbo = session.turbo;
  hud.setTurbo(session.turbo);
  hud.setMuted(audio.muted);

  /**
   * Espera interrumpible sobre el RELOJ DEL JUEGO, no el de pared.
   *
   * Si el jugador oculta la pestaña a mitad de una ronda, el ticker se
   * congela y la ronda queda EN PAUSA, en vez de seguir corriendo invisible.
   * Y los timers de pestañas ocultas se degradan hasta 1 tick por minuto en
   * Chrome. El tiempo simulado avanza con cada frame (o con `pump()` en QA),
   * y `skipRequested` corta todo.
   */
  const waiters: { until: number; resolve: () => void }[] = [];
  function wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      waiters.push({ until: session.simTime + ms, resolve });
    });
  }

  /**
   * Traza de QA: qué pasos se reprodujeron y cuándo. Una jugada de racimos es
   * una CADENA, y cuando algo se cuelga a la mitad no hay forma de saber en
   * cuál eslabón mirando la pantalla. Acotada: una sesión de autoplay larga
   * son miles de pasos.
   */
  const TRAZA_MAX = 200;
  const traza: TraceEntry[] = [];

  const ctx: PlayContext = {
    profile,
    cfg,
    game: GAME,
    reelSet,
    wins,
    hud,
    fx,
    climbScene,
    multLayer,
    holdBoard,
    freeCounter,
    cascadaBadge,
    waysLabel,
    presentation,
    session,
    hasClimb: cfg.climbTiers.length > 0,
    wait,
    tf: () => (session.turbo ? 0.45 : 1),
    setFreeMode,
    layout,
    trace(e) {
      traza.push(e);
      if (traza.length > TRAZA_MAX) traza.shift();
    },
  };

  hud.setBalance(balance);
  hud.setBet(bet);
  /* GRILLA DE ARRANQUE: sale de las TIRAS DEL JUEGO, no de una fórmula. Así
     cada juego arranca mostrando exactamente lo que va a mostrar jugando, y
     no símbolos que no tiene. */
  reelSet.setGrid(
    Array.from({ length: cfg.reels * cfg.rows }, (_, i) => {
      const r = Math.floor(i / cfg.rows);
      const row = i % cfg.rows;
      const tira = GAME.baseStrips[r]!;
      return tira[(r * 11 + row * 3) % tira.length]!;
    }),
  );
  if (waysLabel) waysLabel.text = `${(cfg.rows ** cfg.reels).toLocaleString('es-AR')} CAMINOS`;

  /** Un frame de animación. Separado del ticker para poder avanzarlo a mano. */
  function step(dt: number): void {
    session.simTime += dt;
    // Resolver esperas vencidas (o todas, si el jugador pidió saltar).
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i]!;
      if (session.skipRequested || session.simTime >= w.until) {
        waiters.splice(i, 1);
        w.resolve();
      }
    }
    reelSet.update(dt);
    wins.update(dt);
    hud.update(dt);
    climbScene.update(dt);
    multLayer.update(dt);
    holdBoard?.update(dt);
    fx.update(dt);
    board.position.set(fx.offsetX, fx.offsetY);
  }

  app.ticker.add((ticker) => step(ticker.deltaMS));

  /** Prepara la pantalla para una ronda nueva. */
  function beginRound(): void {
    busyState.value = true;
    session.skipRequested = false;
    hud.setEnabled(false);
    hud.setBusy(true);
    hud.setBuyEnabled(false);
    hud.resetWin();
    wins.clear();
  }

  function endRound(): void {
    busyState.value = false;
    session.skipRequested = false;
    hud.setEnabled(true);
    hud.setBusy(false);
    hud.setBuyEnabled(true);
  }

  /** Devuelve true si la ronda se jugó (para que el autoplay sepa si seguir). */
  async function spin(): Promise<boolean> {
    if (busyState.value) return false;
    let ok = false;
    beginRound();
    audio.click();

    try {
      const res = await rgs.spin({ bet, ante: anteOn });
      balance = res.balance;
      // Mostramos el saldo YA descontado pero SIN el premio: el premio se
      // acredita visualmente al final. Mostrar el saldo final de entrada
      // spoilea el resultado antes de que giren los rodillos.
      hud.setBalance(balance - res.round.totalWin);
      await playRound(ctx, rgs, res.round.steps, res.round.bet, res.round.roundId, -1, res.round.climb);
      celebrate(ctx, res.round.totalWin, res.round.bet);
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
      endRound();
    }
    return ok;
  }

  /** Compra del bonus (la confirmación la pide el menú). Misma coreografía que un giro. */
  async function doBuy(variant: string): Promise<void> {
    if (busyState.value) return;
    beginRound();

    try {
      const res = await rgs.buyBonus({ bet, ...(variant ? { variant } : {}) });
      balance = res.balance;
      hud.setBalance(balance - res.round.totalWin);
      await playRound(ctx, rgs, res.round.steps, res.round.bet, res.round.roundId, -1, res.round.climb);
      celebrate(ctx, res.round.totalWin, res.round.bet);
      hud.setBalance(balance);
    } catch (e) {
      if (e instanceof RgsError && e.code === RGS_ERRORS.INSUFFICIENT_FUNDS) {
        const v = buyMenu.variants.find((x) => x.id === variant);
        const cuesta = bet * (v ? v.priceX : cfg.bonusBuyX);
        hud.showBanner('SALDO INSUFICIENTE', `la compra cuesta ${cuesta.toLocaleString('es-AR')}`);
      } else {
        hud.showBanner('ERROR', e instanceof Error ? e.message : 'desconocido');
        console.error(e);
      }
    } finally {
      endRound();
    }
  }

  const buyMenu = createBuyMenu({ cfg, boardW, boardH, bet: () => bet, onBuy: (v) => void doBuy(v) });
  board.addChild(buyMenu.view);

  function askBuy(): void {
    if (busyState.value || buyMenu.view.visible) return;
    audio.click();
    buyMenu.open();
  }

  const infoModal = createPaytable({
    cfg,
    game: GAME,
    labels: profile.labels,
    textures,
    boardW,
    boardH,
    cluster: profile.cluster === true,
    hasClimb: ctx.hasClimb,
    hold: profile.hold,
    climbName: profile.climbName,
    // "Bandera de la Cumbre" → "banderas": se pluraliza la primera palabra.
    scatterPlural: profile.climbName ? `${(profile.labels[SYM.SCATTER] ?? 'scatter').split(' ')[0]!.toLowerCase()}s` : undefined,
  });
  board.addChild(infoModal);

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
      if (autoLeft > 0) await wait(350 * ctx.tf());
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
      if (!session.skipRequested) {
        session.skipRequested = true;
        reelSet.stopNow();
        audio.click();
      }
      return;
    }
    void spin();
  }

  // Superficie de depuración: en desarrollo siempre, y en un build con
  // `?debug=1`, para poder diagnosticar el juego ya compilado —por ejemplo
  // embebido en el casino— sin recompilarlo.
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) {
    Object.assign(window as unknown as Record<string, unknown>, {
      __maverick: {
        app,
        rgs,
        reelSet,
        fx,
        climbScene,
        buy: () => doBuy(''),
        /** Abre el menú de compra (las variantes), sin apostar nada. */
        menu: () => askBuy(),
        /* Abre y cierra la tabla de pagos sin depender de un click, para
           poder revisarla en QA automatizado. */
        info: () => {
          infoModal.visible = !infoModal.visible;
          return infoModal.visible;
        },
        spin: () => spin(),
        setBet: (v: number) => {
          bet = v;
          hud.setBet(v);
        },
        get busy() {
          return busyState.value;
        },
        get traza() {
          return traza;
        },
        /**
         * QA visual de la feature: busca una ronda con giros gratis contra el
         * motor del perfil (síncrono, sin RGS ni saldo) y la reproduce.
         */
        async demoFeature(maxTries = 5000) {
          // Con una ronda en curso (o retomándose) no se arranca otra encima.
          if (busyState.value) return { tries: 0, steps: 0, win: 0, busy: true };
          const demoEngine = profile.engine();
          const rng = new CryptoRng();
          const demoBet = BET_LEVELS[0]!;
          for (let i = 0; i < maxTries; i++) {
            const result = demoEngine.play(rng, demoBet);
            if (!result.triggered) continue;
            const steps = roundToSteps(GAME, result);
            beginRound();
            await playRound(ctx, rgs, steps, demoBet, 'demo', -1, result.climb);
            celebrate(ctx, result.totalWin, demoBet);
            endRound();
            return { tries: i + 1, steps: steps.length, win: result.totalWin };
          }
          return { tries: maxTries, steps: 0, win: 0 };
        },
        /**
         * Avanza la animación `ms` de tiempo simulado, sincrónicamente. El
         * navegador congela requestAnimationFrame con la pestaña oculta, así
         * que en QA automatizado el ticker no corre.
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

  hud.onSpin.push(spinOrSkip);
  hud.onBetChange.push((delta) => {
    const i = BET_LEVELS.indexOf(bet);
    bet = BET_LEVELS[Math.max(0, Math.min(BET_LEVELS.length - 1, i + delta))]!;
    hud.setBet(bet);
    hud.setBuyPrice(bet * cfg.bonusBuyX);
    buyMenu.refreshPrices();
    audio.click();
  });
  hud.onAnte.push(() => {
    anteOn = !anteOn;
    hud.setAnte(anteOn);
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
    session.turbo = !session.turbo;
    reelSet.turbo = session.turbo;
    hud.setTurbo(session.turbo);
    audio.click();
    try {
      localStorage.setItem(`turbo.${profile.id}`, session.turbo ? '1' : '0');
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
    await playRound(ctx, rgs, r.steps, r.bet, r.roundId, r.acknowledgedStep, r.climb);
    busyState.value = false;
    session.skipRequested = false;
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
