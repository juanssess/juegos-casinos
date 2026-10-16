/**
 * El mueble de los originales: título, saldo, apuesta, el botón grande y
 * el pie con el RTP. Es HTML encima del lienzo de Pixi y no Pixi, porque
 * los originales piden controles de formulario de verdad (cuántas minas,
 * cuántas filas, en cuánto retirarse) y un control nativo se toca bien en
 * el celular, se lee con lector de pantalla y no hay que reinventarlo.
 *
 * Los colores salen de la paleta del juego, así cada original tiene su
 * mueble sin una hoja de estilos por juego.
 */

import type { OriginalManifest } from '@casino/math';

const hex = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;

/** Fichas con separador de miles, como el resto del casino. */
export const fichas = (n: number): string => Math.round(n).toLocaleString('es-AR');
/** Un multiplicador con dos decimales y coma: ×1,84. */
export const equis = (x: number): string =>
  `×${(Math.floor(x * 100 + 1e-6) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface Shell {
  /** Donde va el lienzo de Pixi. */
  stage: HTMLElement;
  /** Donde cada juego pone sus controles propios. */
  controls: HTMLElement;
  /** El botón grande (apostar, retirarse, tirar). */
  main: HTMLButtonElement;
  bet(): number;
  setBalance(n: number): void;
  /** Bloquea lo que no se puede cambiar con una jugada en curso. */
  lock(locked: boolean): void;
  onBetChange(cb: (bet: number) => void): void;
  /** Un aviso corto arriba del mueble. */
  flash(text: string, kind?: 'win' | 'lose' | 'info'): void;
  /** Agrega un grupo de controles con su rótulo. */
  group(label: string, el: HTMLElement): HTMLElement;
}

export function createShell(m: OriginalManifest, rtpText: string): Shell {
  const P = m.theme.PALETTE;
  const style = document.createElement('style');
  style.textContent = `
    :root{--o-bg:${hex(P.bgBottom)};--o-panel:${hex(P.reelBg)};--o-frame:${hex(P.frame)};--o-gold:${hex(P.frameLight)};
      --o-text:${hex(P.text)};--o-dim:${hex(P.textDim)};--o-win:${hex(P.win)};--o-accent:${hex(P.scatter)}}
    body{background:var(--o-bg);color:var(--o-text)}
    #stage{position:absolute;inset:0 0 var(--o-bar,132px) 0;height:auto}
    .o-title{position:absolute;top:10px;left:0;right:0;text-align:center;font:700 26px Georgia,serif;letter-spacing:7px;
      color:var(--o-gold);text-shadow:0 2px 6px #000c;pointer-events:none;z-index:2}
    .o-bar{position:absolute;left:0;right:0;bottom:0;min-height:132px;box-sizing:border-box;padding:10px 14px 8px;
      background:linear-gradient(#000a,#000e);border-top:2px solid var(--o-frame);display:flex;flex-direction:column;gap:6px;z-index:3}
    .o-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 16px}
    .o-group{display:flex;flex-direction:column;align-items:center;gap:3px}
    .o-label{font:600 10px system-ui,sans-serif;letter-spacing:1.5px;color:var(--o-dim);text-transform:uppercase}
    .o-value{font:700 18px Georgia,serif;color:var(--o-text);min-width:84px;text-align:center}
    .o-step{display:flex;align-items:center;gap:6px}
    .o-btn{font:700 13px system-ui,sans-serif;color:var(--o-text);background:var(--o-panel);border:1px solid var(--o-frame);
      border-radius:8px;padding:6px 10px;cursor:pointer;min-width:34px;min-height:32px}
    .o-btn:hover:not(:disabled){border-color:var(--o-gold)}
    .o-btn[aria-pressed=true]{background:var(--o-frame);border-color:var(--o-gold);color:var(--o-gold)}
    .o-btn:disabled{opacity:.4;cursor:default}
    .o-main{font:700 17px Georgia,serif;letter-spacing:1.5px;color:#2a1606;min-width:190px;min-height:52px;border-radius:26px;border:0;
      background:radial-gradient(circle at 50% 30%,#fff3c4,var(--o-gold) 55%,#a8742a);box-shadow:0 3px 12px #0009,inset 0 -3px 0 #0003;cursor:pointer}
    .o-main:disabled{filter:grayscale(.6);opacity:.55;cursor:default}
    .o-main.o-hot{background:radial-gradient(circle at 50% 30%,#fff,#7dffa8 50%,#1f9a52)}
    .o-input{font:700 15px Georgia,serif;width:84px;text-align:center;background:var(--o-panel);color:var(--o-text);
      border:1px solid var(--o-frame);border-radius:8px;padding:5px}
    .o-foot{font:11px system-ui,sans-serif;color:var(--o-dim);text-align:center}
    .o-flash{position:absolute;left:50%;bottom:calc(var(--o-bar,132px) + 12px);transform:translateX(-50%);font:700 20px Georgia,serif;
      padding:8px 18px;border-radius:12px;background:#000c;border:1px solid var(--o-frame);opacity:0;transition:opacity .25s;
      pointer-events:none;z-index:4;white-space:nowrap}
    .o-flash.o-on{opacity:1}
    .o-flash.o-win{color:var(--o-win);border-color:var(--o-win)}
    .o-flash.o-lose{color:#ff8a7a}
    @media (max-width:560px){.o-title{font-size:19px;letter-spacing:4px}.o-main{min-width:150px}.o-value{min-width:64px;font-size:16px}}
  `;
  document.head.appendChild(style);

  const stage = document.getElementById('stage')!;
  const title = document.createElement('div');
  title.className = 'o-title';
  title.textContent = m.theme.TITLE.toUpperCase();
  document.body.appendChild(title);

  const bar = document.createElement('div');
  bar.className = 'o-bar';
  const row = document.createElement('div');
  row.className = 'o-row';
  const controls = document.createElement('div');
  controls.className = 'o-row';
  const foot = document.createElement('div');
  foot.className = 'o-foot';
  foot.textContent = `${rtpText}  ·  ${m.client.tagline}`;
  bar.append(row, controls, foot);
  document.body.appendChild(bar);

  const flashEl = document.createElement('div');
  flashEl.className = 'o-flash';
  flashEl.setAttribute('role', 'status');
  document.body.appendChild(flashEl);

  const group = (label: string, el: HTMLElement, into: HTMLElement = controls): HTMLElement => {
    const g = document.createElement('div');
    g.className = 'o-group';
    const l = document.createElement('div');
    l.className = 'o-label';
    l.textContent = label;
    g.append(l, el);
    into.appendChild(g);
    return g;
  };

  const balanceEl = document.createElement('div');
  balanceEl.className = 'o-value';
  group('Saldo', balanceEl, row);

  const levels = m.client.betLevels;
  let betIdx = 0;
  const betBox = document.createElement('div');
  betBox.className = 'o-step';
  const minus = document.createElement('button');
  minus.className = 'o-btn';
  minus.textContent = '−';
  minus.setAttribute('aria-label', 'Bajar la apuesta');
  const betEl = document.createElement('div');
  betEl.className = 'o-value';
  const plus = document.createElement('button');
  plus.className = 'o-btn';
  plus.textContent = '+';
  plus.setAttribute('aria-label', 'Subir la apuesta');
  betBox.append(minus, betEl, plus);
  group('Apuesta', betBox, row);

  const main = document.createElement('button');
  main.className = 'o-main';
  row.appendChild(main);

  const betCbs: ((b: number) => void)[] = [];
  const showBet = () => {
    betEl.textContent = fichas(levels[betIdx]!);
    for (const cb of betCbs) cb(levels[betIdx]!);
  };
  minus.onclick = () => { betIdx = Math.max(0, betIdx - 1); showBet(); };
  plus.onclick = () => { betIdx = Math.min(levels.length - 1, betIdx + 1); showBet(); };
  showBet();

  // El mueble ocupa lo que ocupa: el lienzo se acomoda arriba.
  const fit = () => document.documentElement.style.setProperty('--o-bar', `${bar.offsetHeight}px`);
  new ResizeObserver(fit).observe(bar);
  fit();

  let flashTimer = 0;
  return {
    stage,
    controls,
    main,
    bet: () => levels[betIdx]!,
    setBalance: (n) => { balanceEl.textContent = fichas(n); },
    lock: (locked) => { minus.disabled = locked; plus.disabled = locked; },
    onBetChange: (cb) => { betCbs.push(cb); },
    flash(text, kind = 'info') {
      flashEl.textContent = text;
      flashEl.className = `o-flash o-on o-${kind}`;
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => { flashEl.className = 'o-flash'; }, 2200);
    },
    group: (label, el) => group(label, el),
  };
}

/** Un grupo de botones de los que se elige uno (filas, riesgo). */
export function choice<T extends string | number>(
  options: readonly { value: T; label: string }[],
  initial: T,
  onPick: (v: T) => void,
): { el: HTMLElement; set(v: T): void; disable(d: boolean): void } {
  const el = document.createElement('div');
  el.className = 'o-step';
  const btns = options.map((o) => {
    const b = document.createElement('button');
    b.className = 'o-btn';
    b.textContent = o.label;
    b.onclick = () => { set(o.value); onPick(o.value); };
    el.appendChild(b);
    return b;
  });
  const set = (v: T) => btns.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i]!.value === v)));
  set(initial);
  return { el, set, disable: (d) => btns.forEach((b) => { b.disabled = d; }) };
}
