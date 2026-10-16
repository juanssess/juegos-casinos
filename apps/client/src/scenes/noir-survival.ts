/** Optional scenery registered by a skin. Never reads or changes a game result. */
import { Assets, Container, Graphics, Rectangle, Sprite, Texture, type Application, type Ticker } from 'pixi.js';
import { audio } from '../render/audio.ts';
type Kind = 'zonamuerta' | 'lafamilia';
const scenes = new Map<string, string>();
export function registerStoryScene(id: Kind, actorsUrl: string): void { scenes.set(id, actorsUrl); }
export async function preloadStoryScene(id: string): Promise<void> { const url = scenes.get(id); if (url)
    await Assets.load(url); }
interface Actor {
    name: string;
    view: Container;
    front: Sprite;
    back: Sprite;
    frames: Texture[];
    height: number;
    row: number;
    pose: number;
}
export function mountStoryScene(app: Application, id: string, background: Sprite): {
    layout(w: number, h: number): void;
    setFree(v: boolean): void;
} | null {
    const url = scenes.get(id);
    if (!url)
        return null;
    const kind = id as Kind, zone = kind === 'zonamuerta', atlas = Assets.get<Texture>(url), layer = new Container(), mist = new Graphics(), lamps = new Graphics();
    layer.eventMode = 'none';
    layer.label = 'story-' + kind;
    app.stage.addChild(layer);
    layer.addChild(lamps);
    const actors: Actor[] = [];
    for (const [row, name] of (zone ? [[1, 'zombie'], [0, 'superviviente']] : [[0, 'mafioso']]) as [
        number,
        string
    ][]) {
        const view = new Container(), cw = atlas.width / 3, ch = atlas.height / (zone ? 2 : 1), frames = Array.from({ length: 3 }, (_, i) => new Texture({ source: atlas.source, frame: new Rectangle(i * cw, row * ch, cw, ch) }));
        const back = new Sprite(frames[0]), front = new Sprite(frames[0]);
        front.anchor.set(.5, 1);
        back.anchor.set(.5, 1);
        view.addChild(back, front);
        layer.addChild(view);
        actors.push({ name, view, front, back, frames, height: ch, row, pose: 0 });
    }
    layer.addChild(mist);
    let W = 0, H = 0, t = 0, free = false, bx = 0, by = 0, layoutSerial = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)'), pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => { pointer.x = (e.clientX / Math.max(1, W) - .5) * 2; pointer.y = (e.clientY / Math.max(1, H) - .5) * 2; };
    window.addEventListener('pointermove', onPointer, { passive: true });
    const music = createStoryMusic(kind);
    const pattern = [0, 1, 0, 2, 0, 1, 0, 0];
    function draw(dt: number): void {
        if (!W || document.hidden)
            return;
        if (!reduced.matches)
            t += Math.min(dt, 80) / 1000;
        const narrow = W / H < 1.05, calm = reduced.matches;
        background.position.set(bx + (calm ? 0 : Math.sin(t * .13) * 3 + pointer.x * 2), by + (calm ? 0 : Math.cos(t * .1) * 2 + pointer.y));
        for (const [i, a] of actors.entries()) {
            const offset = zone ? (a.name === 'zombie' ? 3.1 : 0) : 1.2, period = zone && free ? 3.7 : 6.4, phase = calm ? 0 : (t + offset) / period;
            const at = Math.floor(phase) % pattern.length, next = (at + 1) % pattern.length, blend = calm ? 0 : Math.max(0, ((phase % 1) - .94) / .06);
            a.pose = pattern[at]!;
            a.front.texture = a.frames[a.pose]!;
            a.back.texture = a.frames[pattern[next]!]!;
            a.front.alpha = 1 - blend;
            a.back.alpha = blend;
            const zombie = a.name === 'zombie', height = narrow ? H * .33 : H * (zombie ? .7 : .83), s = height / a.height;
            a.view.scale.set(s, s * (1 + (calm ? 0 : Math.sin(t * (zombie ? 1.6 : 1.1) + i) * .005)));
            const x = zone ? (zombie ? (narrow ? .83 : .88) : (narrow ? .17 : .105)) : (narrow ? .17 : .105);
            a.view.position.set(W * x + (calm ? 0 : Math.sin(t * (zombie ? .83 : .37) + i) * (zombie ? (free ? 11 : 6) : 2)), narrow ? H * .44 : H * .98 + (calm ? 0 : Math.sin(t * 1.3 + i) * 1.4));
            a.view.rotation = calm ? 0 : Math.sin(t * (zombie ? 1.3 : .6) + i) * (zombie ? .015 : .003);
            a.view.alpha = narrow ? .88 : 1;
        }
        lamps.clear();
        mist.clear();
        const pulse = calm ? .7 : .55 + Math.sin(t * 1.8) * .15 + (free ? .2 : 0);
        for (const x of [.04, .96])
            for (let k = 3; k > 0; k--)
                lamps.ellipse(W * x, H * .22, W * .08 * k / 3, H * .24 * k / 3).fill({ color: zone ? (free ? 0xd15c27 : 0x8bc9ae) : 0xe3a14a, alpha: pulse * .035 });
        if (!calm) {
            for (let i = 0; i < (narrow ? 10 : 22); i++) {
                const px = ((i * 97.71 + t * (zone ? 5 : 2) + Math.sin(t * .11 + i) * 19) % (W + 140)) - 70, py = H * (.12 + ((i * 17) % 73) / 100) + Math.sin(t * .12 + i) * 17;
                mist.ellipse(px, py, zone ? W * .14 : W * .07, H * (zone ? .045 : .035)).fill({ color: zone ? 0x8dac9b : 0xb7a591, alpha: zone ? .026 : .018 });
            }
            for (let i = 0; i < (narrow ? 14 : 32); i++) {
                const x = ((i * 131.13 + t * (zone ? 16 : 3)) % (W + 30)) - 15, y = (i * 61.79 + t * (zone ? 58 : -8) + H * 10) % H;
                if (zone)
                    mist.moveTo(x, y).lineTo(x - 2, y + 8).stroke({ width: .7, color: 0xc1d8cb, alpha: .11 });
                else
                    mist.circle(x, y, .6 + i % 2 * .3).fill({ color: 0xf6d38d, alpha: .15 });
            }
        }
        music.update(free, document.hidden);
    }
    const tick = (ticker: Ticker) => draw(ticker.deltaMS);
    app.ticker.add(tick);
    const api = { layout(w: number, h: number) { W = w; H = h; bx = background.x; by = background.y; layoutSerial++; draw(0); }, setFree(v: boolean) { free = v; music.update(v, document.hidden); draw(0); } };
    let cleaned = false;
    const cleanup = () => { if (cleaned)
        return; cleaned = true; app.ticker.remove(tick); window.removeEventListener('pointermove', onPointer); music.destroy(); };
    app.stage.once('destroyed', cleanup);
    window.addEventListener('pagehide', cleanup, { once: true });
    if (new URLSearchParams(location.search).has('debug'))
        Object.assign(window, { __storyScene: { kind, get time() { return t; }, get phase() { return free ? 'bonus' : 'idle'; }, get layouts() { return layoutSerial; }, get actors() { return actors.map(a => ({ name: a.name, x: a.view.x, y: a.view.y, pose: a.pose, height: a.view.height })); }, setFree: api.setFree } });
    return api;
}
/** Original standalone arrangements; an embedded casino keeps its own master mixer. */
function createStoryMusic(kind: Kind): {
    update(free: boolean, hidden: boolean): void;
    destroy(): void;
} {
    const zone = kind === 'zonamuerta';
    let ctx: AudioContext | null = null, master: GainNode | null = null, timer: ReturnType<typeof setInterval> | null = null, free = false, step = 0, next = 0, started = false;
    const embedded = () => { try {
        return window.parent !== window && !!(window.parent as unknown as {
            MC?: {
                sound?: unknown;
            };
        }).MC?.sound;
    }
    catch {
        return false;
    } };
    function tone(f: number, when: number, duration: number, volume: number, type: OscillatorType = 'sine', end = f): void {
        if (!ctx || !master)
            return;
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, when);
        o.frequency.exponentialRampToValueAtTime(Math.max(1, end), when + duration);
        g.gain.setValueAtTime(.0001, when);
        g.gain.exponentialRampToValueAtTime(volume, when + .025);
        g.gain.exponentialRampToValueAtTime(.0001, when + duration);
        o.connect(g).connect(master);
        o.start(when);
        o.stop(when + duration + .02);
    }
    const note = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
    function schedule(): void {
        if (!ctx || !master)
            return;
        const silent = audio.muted || document.hidden;
        master.gain.setTargetAtTime(silent ? 0 : .26, ctx.currentTime, .06);
        if (silent) {
            next = ctx.currentTime + .1;
            return;
        }
        if (next < ctx.currentTime)
            next = ctx.currentTime + .025;
        const bpm = zone ? (free ? 108 : 78) : (free ? 112 : 92), beat = 60 / bpm;
        while (next < ctx.currentTime + .18) {
            const n = step % 16, bar = Math.floor(step / 16) % 4, root = (zone ? [38, 34, 41, 36] : [45, 50, 47, 52])[bar]!;
            if (n === 0) {
                for (const interval of [12, 15, 19])
                    tone(note(root + interval), next, beat * (zone ? 7 : 1.6), zone ? .055 : .08, zone ? 'triangle' : 'sine');
            }
            if (n % 4 === 0)
                tone(note(root + (n === 8 ? 7 : 0)), next, beat * .8, zone ? .13 : .22, 'triangle');
            if (zone) {
                if (n % 8 === 0)
                    tone(54, next, .32, .18, 'sine', 30);
                if ((free || bar % 2 === 0) && n % 4 === 2)
                    tone(note(root + 24 + (n === 10 ? 1 : 7)), next, .18, .038, 'triangle');
            }
            else {
                const melody = [0, -1, 7, 10, -1, 7, 3, -1, 2, -1, 5, 7, -1, 3, 2, -1][n]!;
                if (melody >= 0)
                    tone(note(root + 24 + melody), next + (n % 2 ? beat * .08 : 0), beat * .28, .085, 'triangle');
                if (n % 4 === 2)
                    tone(3900, next, .04, .016, 'triangle', 2400);
            }
            step++;
            next += beat / 4;
        }
    }
    const unlock = () => { if (embedded())
        return; if (started) {
        if (ctx?.state === 'suspended')
            void ctx.resume();
        return;
    } try {
        ctx = new AudioContext();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        next = ctx.currentTime + .04;
        started = true;
        timer = setInterval(schedule, 40);
        schedule();
    }
    catch { /* Audio is optional; the game stays playable. */ } };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return { update(v) { free = v; }, destroy() { if (timer)
            clearInterval(timer); window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock); if (ctx)
            void ctx.close(); } };
}
