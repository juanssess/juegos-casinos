import {SYM} from '@casino/math';
/** Plays only server-authored thematic state. No random draws or payout decisions. */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import type { SpinStep, StoryBonusDto } from '@casino/protocol';
import type { PlayContext } from './context.ts';
import { audio } from '../render/audio.ts';
import { dropEvents } from './drop-events.ts';
import type { ClusterBoard } from '../render/cluster-board.ts';
const panels = new WeakMap<PlayContext, Container>();
const legacyLayers=new WeakMap<PlayContext,Container>();
const rivalNames = ['PUERTO', 'CENTRO', 'SUR', 'EL DON'];
function panel(ctx: PlayContext, step: SpinStep, data: StoryBonusDto): void {
    let view = panels.get(ctx);
    if (!view) {
        view = new Container();
        view.label = 'story-bonus-progress';
        ctx.freeCounter.parent!.addChild(view);
        panels.set(ctx, view);
    }
    for (const child of view.removeChildren())
        child.destroy({ children: true });
    view.visible = true;
    ctx.freeCounter.visible = false;
    const w = ctx.cfg.reels * (ctx.profile.cellSize + 6) - 6, color = data.kind === 'hunt' ? 0xff6e67 : 0xf1ca7a;
    const bg = new Graphics().roundRect(-4, -90, w + 8, 78, 10).fill({ color: 0x100b0d, alpha: .94 }).stroke({ color, width: 1, alpha: .65 });
    view.addChild(bg);
    const text = (str: string, x: number, y: number, size: number, fill = color) => { const t = new Text({ text: str, style: { fontFamily: 'Arial', fontSize: size, fontWeight: 'bold', fill } }); t.anchor.set(.5, 0); t.position.set(x, y); view!.addChild(t); return t; };
    text(data.kind === 'hunt' ? 'LA CACERÍA' : 'GUERRA DE FAMILIAS', w / 2, -86, 20);
    text('GIRO ' + step.freeIndex + ' · ' + data.left + ' RESTANTES' + (data.kind === 'war' && data.cashHit ? ' · BÓVEDA ABIERTA' : ''), w / 2, -62, 13, 0xf4eee4);
    if (data.kind === 'hunt') {
        data.hunters.forEach((h, i) => { const x = w * (i === 0 ? .27 : .73); text('INFECTADO ' + (i + 1) + '   ×' + h.power, x, -39, 17); });
    }
    else {
        if(data.cashHit){
          for(let row=0;row<3;row++){const x=w*(row+.5)/3;bg.roundRect(x-w/6+8,-45,w/3-16,24,5).fill({color:0x4a3018,alpha:.8});text('FILA '+(row+1)+'   ×'+(data.safes[row]??'?'),x,-42,15,0xffdf96);}
        }else for (let i = 0; i < 4; i++) {
            const x = w * (i + .5) / 4, hp = data.hp[i] ?? 0;
            text(hp > 0 ? rivalNames[i]! : rivalNames[i] + ' ✓', x, -42, 13, hp > 0 ? color : 0x95d8b2);
            for (let n = 0; n < 6; n++)
                bg.roundRect(x - 32 + n * 11, -24, 8, 5, 2).fill({ color: n < hp ? 0xd74c43 : 0x423838 });
        }
    }
    if (new URLSearchParams(location.search).has('debug'))
        Object.assign(window, { __storyBonus: { data: structuredClone(data), index: step.freeIndex, visible: true, get bounds(){const b=view!.getBounds();return {x:b.x,y:b.y,width:b.width,height:b.height};} } });
}
export function clearStoryBonus(ctx: PlayContext): void {
 const old=legacyLayers.get(ctx);if(old){old.destroy({children:true});legacyLayers.delete(ctx);for(let c=0;c<ctx.cfg.reels*ctx.cfg.rows;c++)ctx.reelSet.cellSprite(Math.floor(c/ctx.cfg.rows),c%ctx.cfg.rows).alpha=1;} const p = panels.get(ctx); if (p)
    p.visible = false; const d = (window as any).__storyBonus; if (d)
    d.visible = false; }
const point = (ctx: PlayContext, c: number) => ({ x: Math.floor(c / ctx.cfg.rows) * (ctx.profile.cellSize + 6) + ctx.profile.cellSize / 2, y: c % ctx.cfg.rows * (ctx.profile.cellSize + 6) + ctx.profile.cellSize / 2 });
export async function playStoryStep(ctx: PlayContext, step: SpinStep, bet: number): Promise<void> {
    const data = step.story!;
    ctx.setFreeMode(true);
    ctx.wins.clear();
    ctx.multLayer.clear();
    const shown = data.kind === 'war' ? { ...data, hp: data.before,left:data.left-step.awarded,safes:data.cashHit?[]:data.safes } : data;
    panel(ctx, step, shown);
    audio.spinStart();
    const spun = ctx.reelSet.spinTo(data.rawGrid, dropEvents(ctx, step));
    if (ctx.session.skipRequested)
        ctx.reelSet.stopNow();
    await spun;
    audio.spinEnd();
    audio.anticipationEnd();
    ctx.hud.hideBanner();
    const layer = new Container();
    layer.label='story-spin-overlays';
    layer.eventMode = 'none';
    ctx.freeCounter.parent!.addChild(layer);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
        if (data.kind === 'hunt') {
            for (const move of data.moves) {
                const a = point(ctx, move.from), b = point(ctx, move.to), trail = new Graphics();
                layer.addChild(trail);
                const texture = ctx.reelSet.cellSprite(Math.floor(move.from / ctx.cfg.rows), move.from % ctx.cfg.rows).texture;
                const hunter = new Sprite(texture);
                hunter.anchor.set(.5);
                hunter.width = hunter.height = ctx.profile.cellSize;
                layer.addChild(hunter);
                for (let n = 0; n <= (reduced ? 0 : 8); n++) {
                    const k = reduced ? 1 : n / 8, e = 1 - (1 - k) ** 2;
                    hunter.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e);
                    trail.clear().moveTo(a.x, a.y).lineTo(hunter.x, hunter.y).stroke({ width: 5, color: 0xff354b, alpha: .65 });
                    if (!reduced)
                        await ctx.wait(28 * ctx.tf());
                }
                hunter.destroy();
                audio.scatterHit(Math.min(6, move.power));
                trail.destroy();
            }
            (ctx.reelSet as ClusterBoard).setGrid(step.grid, step.mults);
            window.dispatchEvent(new CustomEvent('story-bonus', { detail: { kind: 'hunt', strength: data.moves.length } }));
        }
        else {
            for (let b = 0; b < data.bullets; b++) {
                audio.drum();
                window.dispatchEvent(new CustomEvent('story-bonus', { detail: { kind: 'war', strength: 1 } }));
                if (!reduced) {
                    const hit = new Graphics().moveTo(0, ctx.profile.cellSize * 1.5).lineTo((b + 1) * 65, 0).stroke({ width: 3, color: 0xffdb88, alpha: .7 });
                    layer.addChild(hit);
                    await ctx.wait(110 * ctx.tf());
                    hit.destroy();
                }
            }
            ctx.reelSet.setGrid(step.grid);
            const glow = new Graphics();
            layer.addChild(glow);
            for (const cell of (data.cashHit?step.grid.map((s,i)=>s===SYM.H1?i:-1).filter(i=>i>=0):data.promoted)) {
                const p = point(ctx, cell);
                glow.roundRect(p.x - ctx.profile.cellSize / 2 + 3, p.y - ctx.profile.cellSize / 2 + 3, ctx.profile.cellSize - 6, ctx.profile.cellSize - 6, 8).stroke({ width: 3, color: 0xffd784, alpha: .8 });
            }
            if (data.defeated.length) {
                audio.climbUp(data.hp.every(v => !v) ? 6 : 3);
                ctx.fx.announce(data.hp.every(v => !v) ? '¡LA CIUDAD ES TUYA!' : 'BANDA DERROTADA', data.hp.every(v => !v) ? 'bóveda abierta · los jefes cobran por fila' : 'símbolos ascendidos · +' + step.awarded + ' giros', 1100);
                await ctx.wait(1000 * ctx.tf());
            }
            if (data.cashHit) {
                panel(ctx,step,data);
                let leftToShow=data.collect,nominalCollect=0;
                for(let cell=0;cell<step.grid.length;cell++)if(step.grid[cell]===SYM.H1){
                  const p=point(ctx,cell),nominal=(data.safes[cell%ctx.cfg.rows]??0)*bet;nominalCollect+=nominal;
                  const credit=Math.min(leftToShow,nominal);leftToShow-=credit;
                  if(nominal>0){const label=new Text({text:credit>0?'+'+credit.toLocaleString('es-AR'):'TOPE',style:{fontFamily:'Arial',fontSize:17,fontWeight:'bold',fill:0xffdf96,stroke:{color:0x1a0907,width:4}}});label.anchor.set(.5);label.position.set(p.x,p.y+ctx.profile.cellSize*.32);layer.addChild(label);}
                }
                ctx.fx.announce(nominalCollect>data.collect?'¡PREMIO MÁXIMO!':'ASALTO A LA BÓVEDA', nominalCollect>data.collect?'Se completa el tope de '+ctx.cfg.maxWinX?.toLocaleString('es-AR')+'×':data.safes.map((v, i) => 'FILA ' + (i + 1) + ' ×' + v).join('   ·   '), 1000);
                if (data.collect > 0) {
                    audio.climbTop();
                    ctx.fx.burst(22);
                }
                await ctx.wait(800 * ctx.tf());
            }
        }
        panel(ctx, step, data);
        if (step.win > 0) {
            ctx.wins.show(step.lineWins);
            const duration = Math.min(1100, 280 + step.win / bet * 9) * ctx.tf();
            ctx.hud.countTo(step.win, duration);
            audio.countTicks(duration);
            audio.win(step.win / bet);
            await ctx.wait(duration + 180 * ctx.tf());
            ctx.wins.clear();
        }
        else
            await ctx.wait(180 * ctx.tf());
    }
    finally {
        layer.destroy({ children: true });
    }
    ctx.trace({ k: 'story-' + data.kind, i: step.freeIndex ?? 0, c: data.kind === 'hunt' ? data.moves.length : data.bullets, t: Math.round(ctx.session.simTime) });
}

/** Finish a persisted pre-upgrade Hold & Win without replacing its outcome or charging again. */
export async function playLegacyStoryHold(ctx:PlayContext,step:SpinStep,bet:number):Promise<void>{
 ctx.setFreeMode(true);ctx.wins.clear();ctx.multLayer.clear();
 let layer=legacyLayers.get(ctx);if(!layer){layer=new Container();ctx.freeCounter.parent!.addChild(layer);legacyLayers.set(ctx,layer);}
 for(const child of layer.removeChildren())child.destroy({children:true});
 ctx.freeCounter.text='GOLPE ANTERIOR · '+step.hold!.left+' RE-GIROS';ctx.freeCounter.visible=true;
 ctx.reelSet.setGrid(step.grid.map(s=>s<0?SYM.L5:s));
 for(let c=0;c<step.grid.length;c++){
 const sprite=ctx.reelSet.cellSprite(Math.floor(c/ctx.cfg.rows),c%ctx.cfg.rows);sprite.alpha=step.grid[c]!<0?0:1;
 if((step.mults?.[c]??0)>0){const p=point(ctx,c),label=new Text({text:((step.mults![c]??0)*bet).toLocaleString('es-AR'),style:{fontFamily:'Arial',fontSize:18,fontWeight:'bold',fill:0xffdf96,stroke:{color:0x180a10,width:4}}});label.anchor.set(.5);label.position.set(p.x,p.y+ctx.profile.cellSize*.3);layer.addChild(label);}
 }
 audio.reelStop();await ctx.wait(700*ctx.tf());
 if(step.win>0){ctx.hud.countTo(step.win,450*ctx.tf());audio.win(step.win/bet);await ctx.wait(650*ctx.tf());}
}
