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

import { Application, Container, FillGradient, Graphics, Sprite, Text } from 'pixi.js';
import { CryptoRng, SYMBOL_NAMES, PAYING_SYMBOLS, TIER_LABELS } from '@casino/math';
import type { ClimbDto, RgsClient, SpinStep } from '@casino/protocol';
import { RgsError, RGS_ERRORS } from '@casino/protocol';

import { pickClientGame } from './games.ts';
import { LocalRgs, roundToSteps } from './rgs/local.ts';
import { BridgeRgs, isEmbedded } from './rgs/bridge.ts';
import { setActiveTheme, PALETTE, TIMING } from './render/theme.ts';
import { metal, vgrad, rgrad } from './render/material.ts';
import { ReelSet } from './render/reels.ts';
import { ClusterBoard } from './render/cluster-board.ts';
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

  /* Los precios de compra pueden tener decimal —en La Vendimia lo tienen a
     proposito, ver su tuning.ts— y en castellano el decimal va con coma. Un
     "56.6x" al lado de un "1.132" se lee como mil quinientos sesenta y seis. */
  const equis = (v: number): string =>
    v.toLocaleString('es-AR', { maximumFractionDigits: 1 });

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

  /* LA ÚNICA RAMA ESTRUCTURAL DEL CLIENTE.
     Un juego de racimos no tiene rodillos que giren: tiene celdas que caen,
     explotan y vuelven a caer. Es otro tablero. Pero expone la MISMA
     superficie (spinTo, stopNow, setGrid, cellSprite, update), así que a
     partir de acá el HUD, el sonido, el autoplay, la compra del bonus y la
     recuperación de ronda son exactamente los mismos para los tres juegos.
     La otra rama está en playStep, y no hay una tercera. */
  const esRacimos = profile.cluster === true;
  const opcionesTablero = {
    reels: cfg.reels,
    rows: cfg.rows,
    cellSize: CELL,
    gap: GAP,
    textures,
    scattersToTrigger: cfg.scattersToTrigger,
  };
  const reelSet: ReelSet | ClusterBoard = esRacimos
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

  /**
   * El multiplicador de la cascada actual, arriba a la derecha del mueble.
   *
   * En un juego de racimos este número ES la jugada: la diferencia entre una
   * cascada linda y un premio grande es en qué escalón te agarró. Si vive
   * solo en el contador de premio, el jugador ve subir la plata sin entender
   * por qué de golpe subió tanto.
   */
  const cascadaBadge = new Text({
    text: '',
    style: {
      fontFamily: 'Georgia, serif',
      fontSize: 26,
      fontWeight: '700',
      fill: PALETTE.mult ?? PALETTE.win,
      letterSpacing: 1,
    },
  });
  cascadaBadge.anchor.set(1, 1);
  cascadaBadge.visible = false;
  root.addChild(cascadaBadge);

  /**
   * Traza de QA: qué pasos se reprodujeron y cuándo.
   *
   * Existe porque una jugada de racimos es una CADENA, y cuando algo se
   * cuelga a la mitad no hay forma de saber en cuál eslabón mirando la
   * pantalla. Con esto, `__maverick.traza` dice exactamente hasta dónde
   * llegó —y así apareció el error que rompía el ticker desde el ciclo de
   * premios—.
   *
   * Acotada a propósito: una sesión de autoplay larga son miles de pasos, y
   * un array que crece sin techo en un juego que corre horas es una fuga de
   * memoria con buenas intenciones.
   */
  const TRAZA_MAX = 200;
  const traza: { k: string; i: number; c: number; t: number }[] = [];

  let freeMode = false;
  /** ¿Este juego tiene Escalinata? Si no, la feature son pegajosos. */
  const hasClimb = cfg.climbTiers.length > 0;

  /* Los símbolos que un juego de racimos USA DE VERDAD.
     La enumeración del motor tiene once y la comparten los tres juegos, pero
     La Vendimia solo pone seis en las tiras: con nueve repartidos en treinta
     celdas ninguno junta cinco pegados. Se deducen de la tabla de pagos —fila
     en cero es símbolo que no existe— en vez de listarlos a mano, que es la
     clase de lista que se olvida de actualizar. */
  const SIMBOLOS_EN_JUEGO = PAYING_SYMBOLS.filter((s) =>
    (cfg.paytable[s] ?? []).some((v) => v > 0),
  );
  const ESCALERA: readonly number[] =
    (GAME as { cascadeMults?: readonly number[] }).cascadeMults ?? [];

  /** Oscurece un color a la mitad, para el aro exterior del marco. */
  function darken(c: number, k = 0.45): number {
    const r = Math.round(((c >> 16) & 255) * k);
    const g = Math.round(((c >> 8) & 255) * k);
    const b = Math.round((c & 255) * k);
    return (r << 16) | (g << 8) | b;
  }

  /**
   * EL MUEBLE.
   *
   * Antes esto eran cuatro rectangulos redondeados con trazos de colores
   * planos. De lejos se leia como un recuadro dibujado encima del fondo, no
   * como un mueble con los rodillos adentro.
   *
   * Lo que hace que un marco parezca metal es lo mismo que en los simbolos:
   * un degradado con la banda clara ESTRECHA —el reflejo del horizonte— y
   * oscuro arriba y abajo. Y lo que hace que los rodillos parezcan HUNDIDOS
   * es el labio oscuro por dentro del bisel: sin esa sombra, la grilla flota
   * a la misma altura que el marco y el mueble no existe.
   *
   * En la feature vira al color del scatter, que era el comportamiento de
   * antes y sigue siendo la senial mas clara de que cambio el estado.
   */
  function drawFrame(free: boolean): void {
    const glow = free ? PALETTE.scatter : PALETTE.frameLight;
    const oscuro = free ? darken(PALETTE.scatter) : PALETTE.frame;
    const claro = free ? PALETTE.scatter : PALETTE.frameLight;

    frame.clear();

    // Sombra proyectada: apoya el mueble sobre el fondo.
    frame
      .roundRect(-26, -22, boardW + 52, boardH + 54, 24)
      .fill({ color: 0x000000, alpha: 0.45 });

    // El bisel, con metal de verdad.
    frame
      .roundRect(-20, -20, boardW + 40, boardH + 40, 18)
      .fill(metal(darken(oscuro), oscuro, claro));

    // Filo exterior oscuro: separa el mueble del fondo.
    frame
      .roundRect(-20, -20, boardW + 40, boardH + 40, 18)
      .stroke({ width: 2, color: 0x0d0904, alpha: 0.9 });

    // Hilo claro sobre el canto superior: la luz pega arriba.
    frame
      .moveTo(-4, -18.5)
      .lineTo(boardW + 4, -18.5)
      .stroke({ width: 2, color: 0xffffff, alpha: 0.22 });

    // El labio interno: la sombra que hunde los rodillos.
    frame
      .roundRect(-9, -9, boardW + 18, boardH + 18, 11)
      .stroke({ width: 7, color: 0x000000, alpha: 0.55 });

    // Y el filo brillante que remata el hueco.
    frame
      .roundRect(-6, -6, boardW + 12, boardH + 12, 9)
      .stroke({ width: 1.6, color: glow, alpha: 0.75 });

    // Remaches en las esquinas, ahora con volumen.
    for (const [cx, cy] of [
      [-13, -13], [boardW + 13, -13], [-13, boardH + 13], [boardW + 13, boardH + 13],
    ] as const) {
      frame.circle(cx, cy, 6.5).fill({ color: 0x000000, alpha: 0.5 });
      frame.circle(cx, cy, 5.4).fill(metal(darken(oscuro), claro, 0xffffff));
      frame.circle(cx - 1.3, cy - 1.3, 1.5).fill({ color: 0xffffff, alpha: 0.55 });
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

  const hud = new Hud(boardW, cfg.anteCostX);
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

    /* Vinieta sobre el fondo del juego.
       Un fondo parejo de punta a punta compite con los rodillos por la
       atencion. Oscurecer las esquinas empuja el ojo al centro sin que se
       note que algo lo empujo: es el truco mas viejo de la iluminacion y
       funciona igual en una mesa de casino que en una foto. */
    bg.rect(0, 0, w, h).fill(
      new FillGradient({
        type: 'radial',
        center: { x: 0.5, y: 0.44 },
        innerRadius: 0,
        outerCenter: { x: 0.5, y: 0.44 },
        outerRadius: 0.72,
        colorStops: [
          // Calibrado mirando el fondo, no eligiendo un numero: a 0,62 la
          // vinieta se comia el marron azteca y el juego quedaba negro.
          { offset: 0.38, color: 'rgba(0,0,0,0)' },
          { offset: 0.8, color: 'rgba(0,0,0,0.2)' },
          { offset: 1, color: 'rgba(0,0,0,0.42)' },
        ],
        textureSpace: 'local',
      }),
    );

    drawFrame(freeMode);

    title.x = boardW / 2;
    title.y = -36;
    cascadaBadge.x = boardW;
    cascadaBadge.y = -34;
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

  /* APUESTA ANTE.
     Vive como un booleano y viaja en cada pedido; no es un "modo" que el
     servidor recuerde. Ver el comentario en SpinRequest: si el que cobra y
     el que juega pudieran desincronizarse, siempre se desincronizan en
     contra de alguien. */
  let anteOn = false;
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
  /* GRILLA DE ARRANQUE: sale de las TIRAS DEL JUEGO, no de una fórmula.
     Antes era `(i * 7) % 9 + 2`, que reparte los símbolos 2 a 10 en abanico.
     Con dos juegos que usan los once andaba; en La Vendimia, que solo usa
     seis, la pantalla de bienvenida se llenaba de los símbolos que este
     juego no tiene —grises, sin dibujo— y lo primero que ve alguien que
     entra es una grilla rota. Leyendo la tira propia, cada juego arranca
     mostrando exactamente lo que va a mostrar jugando. */
  reelSet.setGrid(
    Array.from({ length: cfg.reels * cfg.rows }, (_, i) => {
      const r = Math.floor(i / cfg.rows);
      const row = i % cfg.rows;
      const tira = GAME.baseStrips[r]!;
      return tira[(r * 11 + row * 3) % tira.length]!;
    }),
  );

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

  /**
   * Los eventos de la caída/giro: sonido de frenada por columna, campanita
   * de scatter subiendo de tono, y el cartel de expectativa. Son idénticos
   * en los tres juegos, así que viven en un solo lugar.
   */
  function eventosDeCaida(step: SpinStep): {
    onReelStop: (r: number, ant: boolean) => void;
    onAnticipation: () => void;
  } {
    const conScatter: boolean[] = new Array(cfg.reels).fill(false);
    for (const cell of step.scatterCells) conScatter[Math.floor(cell / cfg.rows)] = true;
    let cayeron = 0;
    return {
      onReelStop: (r, anticipated) => {
        audio.reelStop();
        if (anticipated) {
          audio.anticipationEnd();
          hud.hideBanner();
        }
        if (conScatter[r]) {
          cayeron++;
          audio.scatterHit(cayeron);
        }
      },
      onAnticipation: () => {
        audio.anticipationStart();
        hud.showBanner('¡CASI!', hasClimb ? 'un templo más' : esRacimos ? 'una barrica más' : 'un cartucho más');
      },
    };
  }

  /**
   * Reproduce un paso de un juego de RACIMOS.
   *
   * La diferencia con un slot de líneas no es de animación: es de ESTRUCTURA.
   * Un giro de líneas tiene un resultado y se muestra. Una jugada de racimos
   * tiene una CADENA —caída, premio, explosión, caída, premio— y cada eslabón
   * vale más que el anterior porque la escalera del multiplicador subió.
   *
   * Todo eso ya vino resuelto del servidor: `step.grid` es la caída inicial y
   * `step.tumbles` son las cascadas, en orden. Acá no se decide nada, se
   * averigua qué celda va a dónde para poder animar el movimiento en vez de
   * reemplazar la grilla de golpe.
   */
  async function playPasoRacimos(step: SpinStep, roundBet: number): Promise<void> {
    const tablero = reelSet as ClusterBoard;
    traza.push({ k: step.kind, i: step.freeIndex ?? 0, c: (step.tumbles ?? []).length, t: Math.round(simTime) });
    if (traza.length > TRAZA_MAX) traza.shift();
    wins.clear();
    cascadaBadge.visible = false;

    if (step.kind === 'free' && step.freeIndex && step.freeTotal) {
      setFreeMode(true);
      freeCounter.text = `GIROS GRATIS ${step.freeIndex}/${step.freeTotal}`;
    }

    audio.spinStart();
    const caida = tablero.spinTo(step.grid, eventosDeCaida(step));
    if (skipRequested) tablero.stopNow();
    await caida;
    audio.spinEnd();
    audio.anticipationEnd();
    hud.hideBanner();

    if (step.scatterCells.length >= cfg.scattersToTrigger && step.kind === 'base') {
      audio.freeSpins();
      fx.shake(8);
      fx.announce('¡GIROS GRATIS!', `${step.awarded} giros · la escalera no vuelve atrás`, 1100);
      fx.burst(45);
      await wait(1300 * tf());
    }

    /* La cadena completa: la caída inicial es la etapa 0 y cada cascada es
       una más. La última que manda el servidor no paga nada — es la grilla
       ya asentada— y está justamente para que la jugada termine de verse. */
    const etapas: { grid: number[]; wins: typeof step.lineWins; multiplier: number }[] = [
      { grid: step.grid, wins: step.lineWins, multiplier: step.multiplier },
      ...(step.tumbles ?? []).map((t) => ({ grid: t.grid, wins: t.wins, multiplier: t.multiplier })),
    ];

    let acumulado = step.scatterWin;
    if (step.scatterWin > 0) hud.countTo(acumulado, 260 * tf());

    for (let i = 0; i < etapas.length; i++) {
      const e = etapas[i]!;

      if (i > 0) {
        const anteriores = etapas[i - 1]!.wins;
        const celdas: number[] = [];
        for (const w of anteriores) for (const c of w.cells) celdas.push(c);
        // El golpe de la explosión sube de tono con cada cascada: es la
        // señal más barata de que la escalera está subiendo.
        audio.scatterHit(Math.min(6, i));
        if (i >= 4) fx.shake(Math.min(9, i));
        await tablero.tumbleTo(celdas, e.grid);
      }

      if (e.wins.length === 0) {
        cascadaBadge.visible = false;
        continue;
      }

      cascadaBadge.text = `×${e.multiplier}`;
      cascadaBadge.visible = e.multiplier > 1;

      let sub = 0;
      for (const w of e.wins) sub += w.amount;
      acumulado += sub;

      wins.show(e.wins);
      /* Los tiempos de una cascada tienen que ser CORTOS. Una jugada puede
         tener seis eslabones, y lo que en un slot de líneas es una pausa
         cómoda, acá multiplicado por seis es una jugada eterna. Solo el
         premio que vale la pena (>2× la apuesta) se queda un rato más. */
      const x = sub / roundBet;
      const dur = Math.min(TIMING.countUp, 150 + x * 45) * tf();
      hud.countTo(acumulado, dur);
      audio.countTicks(dur);
      audio.win(x);
      const extra = x > 2 ? Math.min(2, x / 12) * 380 : 0;
      await wait((dur + 90 + extra) * (turbo ? 0.7 : 1));
      wins.clear();
    }

    cascadaBadge.visible = false;
  }

  /** Reproduce un paso: gira, frena, muestra premios. */
  async function playStep(step: SpinStep, roundBet: number): Promise<void> {
    if (esRacimos) {
      await playPasoRacimos(step, roundBet);
      return;
    }
    wins.clear();

    if (step.kind === 'free' && step.freeIndex && step.freeTotal) {
      setFreeMode(true);
      // En un juego con pegajosos el multiplicador no es global: se muestra
      // cuántos hay en el tablero, que es lo que el jugador está mirando.
      freeCounter.text = step.mults
        ? `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ${multLayer.count} wilds`
        : `GIROS GRATIS ${step.freeIndex}/${step.freeTotal} · ×${step.multiplier}`;
    }

    audio.spinStart();
    const spun = reelSet.spinTo(step.grid, eventosDeCaida(step));
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
      const res = await rgs.spin({ bet, ante: anteOn });
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
      const res = await rgs.buyBonus({ bet, variant: variantElegida || undefined });
      balance = res.balance;
      hud.setBalance(balance - res.round.totalWin);
      await playRound(res.round.steps, res.round.bet, res.round.roundId, -1, res.round.climb);
      celebrate(res.round.totalWin, res.round.bet);
      hud.setBalance(balance);
    } catch (e) {
      if (e instanceof RgsError && e.code === RGS_ERRORS.INSUFFICIENT_FUNDS) {
        const v = VARIANTES.find((x) => x.id === variantElegida);
        const cuesta = bet * (v ? v.priceX : cfg.bonusBuyX);
        hud.showBanner('SALDO INSUFICIENTE', `la compra cuesta ${cuesta.toLocaleString('es-AR')}`);
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
  /* ============================================================
     MENU DE COMPRA

     Antes era un cartel con un precio y dos botones. Ahora hay varias
     variantes y cada una vale distinto, asi que el modal muestra la
     ESCALERA completa: que te llevas y cuanto cuesta, una al lado de la
     otra.

     Mostrarlas juntas no es solo comodidad. Un precio suelto no se puede
     juzgar; tres precios con lo que dan al lado si. Y como los tres estan
     cotizados al mismo RTP, la eleccion es de gusto y de bolsillo, no una
     trampa donde una opcion es peor negocio que las otras.
     ============================================================ */
  const buyModal = new Container();
  buyModal.visible = false;
  let variantElegida = '';

  const VARIANTES = cfg.bonusVariants && cfg.bonusVariants.length
    ? cfg.bonusVariants
    : [{ id: 'simple', label: 'Comprar el bonus', desc: 'Giros gratis garantizados', priceX: cfg.bonusBuyX }];

  {
    const shade = new Graphics()
      .rect(-30, -30, boardW + 60, boardH + 200)
      .fill({ color: 0x050302, alpha: 0.85 });
    shade.eventMode = 'static'; // bloquea clicks al tablero
    buyModal.addChild(shade);

    const alto = 130 + VARIANTES.length * 74;
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
    buyModal.addChild(panel);

    const t1 = new Text({
      text: 'COMPRAR EL BONUS',
      style: { fontFamily: 'Georgia, serif', fontSize: 21, fontWeight: '700', fill: PALETTE.win, letterSpacing: 1.4 },
    });
    t1.anchor.set(0.5);
    t1.position.set(boardW / 2, y0 + 30);
    buyModal.addChild(t1);

    const sub = new Text({
      text: `Las tres pagan el mismo RTP (${(cfg.rtp * 100).toFixed(2)}%): cambia qué te llevás, no la ventaja.`,
      style: { fontFamily: 'Georgia, serif', fontSize: 11.5, fill: PALETTE.textDim, align: 'center' },
    });
    sub.anchor.set(0.5);
    sub.position.set(boardW / 2, y0 + 52);
    buyModal.addChild(sub);

    /** Una fila del menu: nombre, que te llevas, y el precio grande. */
    const fila = (v: { id: string; label: string; desc: string; priceX: number }, i: number): Container => {
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
        text: (bet * v.priceX).toLocaleString('es-AR'),
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
        buyModal.visible = false;
        variantElegida = v.id;
        void doBuy();
      });
      return c;
    };

    VARIANTES.forEach((v, i) => buyModal.addChild(fila(v, i)));

    const cancelar = new Text({
      text: 'Cancelar',
      style: { fontFamily: 'Georgia, serif', fontSize: 14, fill: PALETTE.textDim },
    });
    cancelar.anchor.set(0.5);
    cancelar.position.set(boardW / 2, y0 + alto - 26);
    cancelar.eventMode = 'static';
    cancelar.cursor = 'pointer';
    cancelar.on('pointertap', () => { buyModal.visible = false; audio.click(); });
    buyModal.addChild(cancelar);
  }

  board.addChild(buyModal);

  function askBuy(): void {
    if (busyState.value || buyModal.visible) return;
    audio.click();
    refrescarPrecios();
    buyModal.visible = true;
  }

  /** Los precios del menu siguen a la apuesta, que se puede cambiar antes. */
  function refrescarPrecios(): void {
    for (const v of VARIANTES) {
      const t = buyModal.getChildByLabel(`precio-${v.id}`, true) as Text | null;
      if (t) t.text = (bet * v.priceX).toLocaleString('es-AR');
    }
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
        /** Abre el menu de compra (las variantes), sin apostar nada. */
        menu: () => askBuy(),
        /* Abre y cierra la tabla de pagos sin depender de un click. Existe
           para poder revisarla en QA automatizado: si hay que acertarle al
           boton, la revision depende de donde cayo el layout ese dia. */
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
         * QA visual de la feature. La feature entra 1 de cada ~209 rondas, así
         * que esperarla a mano no es viable: esto usa un RGS aparte, sin
         * latencia y con saldo propio, para encontrar una ronda con giros
         * gratis y reproducirla en pantalla sin tocar el saldo real.
         */
        async demoFeature(maxTries = 5000) {
          // Búsqueda SÍNCRONA contra el motor. Hacerla a través del RGS cuesta
          // un turno del event loop por ronda: 3000 rondas eran ~12 segundos
          // de pantalla congelada. Acá son microsegundos.
          //
          // Y usa el motor DEL PERFIL, no el generico de lineas. Con
          // `createRoundEngine(GAME)` clavado, en Se Busca la demo mostraba
          // la feature sin wilds pegajosos y en La Vendimia directamente sin
          // cascadas: una demo que no muestra la mecanica que se quiere ver.
          const engine = profile.engine();
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

    t(`${cfg.title.toUpperCase()} — TABLA DE PAGOS`, boardW / 2, -34, 22, PALETTE.win, 0.5);

    if (esRacimos) {
      /* ============================================================
         LA TABLA DE UN JUEGO DE RACIMOS

         No se parece a la de un juego de líneas y no puede parecerse: no
         hay "3, 4 o 5 en línea", hay TAMAÑO DE RACIMO. Son cinco columnas
         de tramos por cada símbolo, y arriba de todo tiene que estar dicha
         la regla —cinco o más pegados, en cualquier forma— porque es lo
         único que el jugador no puede deducir mirando la pantalla.
         ============================================================ */
      t('premios en múltiplos de la ficha (apuesta ÷ 20)  ·  tocá para cerrar', boardW / 2, -8, 10.5, PALETTE.textDim, 0.5);
      t('UN RACIMO SON 5 O MÁS SÍMBOLOS IGUALES PEGADOS — arriba, abajo o al costado, en cualquier forma.',
        boardW / 2, 8, 11.5, PALETTE.scatter, 0.5);

      const colX = [boardW - 216, boardW - 162, boardW - 108, boardW - 54, boardW];
      TIER_LABELS.forEach((lab, k) => t(lab, colX[k]!, 30, 10.5, PALETTE.textDim, 1));
      t('tamaño del racimo →', 4, 30, 10.5, PALETTE.textDim);

      SIMBOLOS_EN_JUEGO.forEach((sym, k) => {
        const y = 46 + k * 34;
        const spr = new Sprite(textures.get(sym)!);
        spr.width = 30;
        spr.height = 30;
        spr.position.set(2, y);
        infoModal.addChild(spr);
        t(SKIN[sym] ?? SYMBOL_NAMES[sym]!, 38, y + 8, 12, PALETTE.text);
        const fila = cfg.paytable[sym] ?? [];
        for (let c = 0; c < colX.length; c++) {
          t(String(fila[c] ?? 0), colX[c]!, y + 8, 12, PALETTE.win, 1);
        }
      });

      const reglasY = 46 + SIMBOLOS_EN_JUEGO.length * 34 + 6;

      const wildSpr = new Sprite(textures.get(0)!);
      wildSpr.width = 34;
      wildSpr.height = 34;
      wildSpr.position.set(2, reglasY);
      infoModal.addChild(wildSpr);
      t('Sustituye a todo menos a la Barrica, y PEGA racimos.', 40, reglasY + 2, 11.5, PALETTE.text);
      t('Una misma tijera puede cobrar en dos racimos distintos a la vez.', 40, reglasY + 18, 10.5, PALETTE.textDim);

      const scatSpr = new Sprite(textures.get(1)!);
      scatSpr.width = 34;
      scatSpr.height = 34;
      scatSpr.position.set(2, reglasY + 40);
      infoModal.addChild(scatSpr);
      const sp = cfg.scatterPaytable;
      t(`${cfg.scattersToTrigger}+ barricas en cualquier lado dan giros gratis.`, 40, reglasY + 42, 11.5, PALETTE.text);
      t(`Además pagan ${sp[4]}× / ${sp[5]}× / ${sp[6]}× la apuesta con 4, 5 y 6.`, 40, reglasY + 58, 10.5, PALETTE.textDim);

      const escY = reglasY + 88;
      t('CASCADAS Y LA ESCALERA', 4, escY, 14, PALETTE.scatter);
      t('Lo que gana se va, cae lo de arriba, entra lo nuevo y se vuelve a mirar. Cada cascada',
        4, escY + 20, 11, PALETTE.text);
      t('de la misma jugada sube el multiplicador un escalón:', 4, escY + 34, 11, PALETTE.text);
      t(ESCALERA.map((m) => `×${m}`).join('  →  '), 4, escY + 52, 13, PALETTE.win);
      t('En los giros gratis la escalera NO vuelve a empezar: sigue donde quedó hasta el final.',
        4, escY + 72, 11, PALETTE.mult ?? PALETTE.win);
      t(`Compra del bonus desde ${equis(cfg.bonusBuyX)}× la apuesta` +
        `  ·  RTP ${(cfg.rtp * 100).toFixed(2)}%` +
        (cfg.maxWinX ? `  ·  premio máximo ${cfg.maxWinX.toLocaleString('es-AR')}×` : ''),
        4, escY + 90, 10.5, PALETTE.textDim);
    } else {
      t('premios en múltiplos de la apuesta por línea (apuesta ÷ 20) · tocá para cerrar', boardW / 2, -4, 11, PALETTE.textDim, 0.5);

      // Grilla 3x3 de simbolos pagadores con sus pagos.
      const cellW = (boardW - 8) / 3;
      PAYING_SYMBOLS.forEach((sym, k) => {
        const col = k % 3;
        const row = Math.floor(k / 3);
        const x = 4 + col * cellW;
        const y = 26 + row * 64;
        const spr = new Sprite(textures.get(sym)!);
        spr.width = 52;
        spr.height = 52;
        spr.position.set(x, y);
        infoModal.addChild(spr);
        const pays = cfg.paytable[sym]!;
        t(SKIN[sym] ?? SYMBOL_NAMES[sym]!, x + 58, y + 8, 13, PALETTE.text);
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
      t(`3/4/5 en cualquier lado: ${scatPays[3]}×/${scatPays[4]}×/${scatPays[5]}× la apuesta · 3+ dan giros gratis`,
        boardW / 2 + 50, rulesY + 12, 11, PALETTE.textDim);

      // La seccion de la feature cambia segun el juego: escalinata o pegajosos.
      const featY = rulesY + 54;
      if (hasClimb) {
        t('LA ESCALINATA', 4, featY, 15, PALETTE.scatter);
        const tiersTxt = cfg.climbTiers
          .map((tt, k) => `N${k + 1}: ${tt.spins}×${tt.multiplier}`)
          .join('   ');
        t(tiersTxt, 4, featY + 22, 12.5, PALETTE.text);
        const oddsTxt = cfg.climbAscendPerMil.map((o) => `${o / 10}%`).join(' → ');
        t(`Probabilidad de subir cada escalón: ${oddsTxt} · retrigger: 3+ templos = +5 giros`,
          4, featY + 42, 11, PALETTE.textDim);
      } else {
        t('WILDS PEGAJOSOS', 4, featY, 15, PALETTE.scatter);
        t('En los giros gratis, cada wild que cae sortea un multiplicador y QUEDA FIJO hasta el final.',
          4, featY + 22, 12, PALETTE.text);
        const multTable = (GAME as { wildMultsFree?: readonly { mult: number; perMil: number }[] })
          .wildMultsFree ?? [];
        t(multTable.map((w) => `×${w.mult}: ${(w.perMil / 10).toFixed(1)}%`).join('   '),
          4, featY + 42, 12, PALETTE.text);
        t('Los multiplicadores de una misma línea SE MULTIPLICAN entre sí (×10 y ×25 = ×250).',
          4, featY + 62, 11, PALETTE.textDim);
      }

      t(`Compra del bonus: ${equis(cfg.bonusBuyX)}× la apuesta` +
        `  ·  RTP del juego ${(cfg.rtp * 100).toFixed(2)}%` +
        (cfg.maxWinX ? `  ·  premio máximo ${cfg.maxWinX.toLocaleString('es-AR')}×` : ''),
        4, featY + (hasClimb ? 62 : 82), 11, PALETTE.textDim);
    }
  }
  board.addChild(infoModal);

  hud.onSpin.push(spinOrSkip);
  hud.onBetChange.push((delta) => {
    const i = BET_LEVELS.indexOf(bet);
    const next = BET_LEVELS[Math.max(0, Math.min(BET_LEVELS.length - 1, i + delta))]!;
    bet = next;
    hud.setBet(bet);
    hud.setBuyPrice(bet * cfg.bonusBuyX);
    refrescarPrecios();
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
