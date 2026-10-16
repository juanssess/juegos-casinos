import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Sfc32Rng,SYM,CLUSTER_TIERS,type FastRound} from '../src/index.ts';
import {MANIFEST as m} from '../../games/zonamuerta/src/manifest.ts';
import {HUNT_POWER,type HuntRecord} from '../../games/zonamuerta/src/engine.ts';
import {roundToSteps} from '../../../apps/client/src/rgs/local.ts';
const bet=20;
test('hunt: detailed and fast consume identical RNG and settle identical totals, including ante',()=>{
 for(const ante of [false,true]){const e=m.engine(),a=new Sfc32Rng(1970),b=new Sfc32Rng(1970);const out:FastRound={baseWin:0,featureWin:0,totalWin:0,triggered:false,freeSpinsPlayed:0,tier:0};
 for(let i=0;i<20000;i++){const r=e.play(a,bet,ante);e.playFast(b,bet,out,ante);assert.equal(r.baseWin,out.baseWin);assert.equal(r.featureWin,out.featureWin);assert.equal(r.totalWin,out.totalWin);assert.equal(r.free.length,out.freeSpinsPlayed);assert.equal(a.nextInt(1e6),b.nextInt(1e6));}}
});
test('hunt: hunters persist, consume the nearest radio, grow without merging, and all purchases reset',()=>{
 const e=m.engine(),rng=new Sfc32Rng(20261016);let moved=0;
 for(const v of m.game.bonusVariants??[])for(let n=0;n<120;n++){
 const r=e.playBonus(rng,bet,v);assert.ok(r.triggered);assert.ok(r.totalWin<=m.game.maxWinX*bet);assert.equal(r.free.length,m.game.freeSpinsAwarded+(v.extraSpins??0));
 let previous:{cell:number;power:number}[]|null=null;
 for(const rec of r.free as HuntRecord[]){const d=rec.story;assert.equal(d.hunters.length,2);assert.notEqual(d.hunters[0]!.cell,d.hunters[1]!.cell);
 const start=d.hunters.map(h=>({...h}));for(const move of [...d.moves].reverse()){const h=start.find(h=>h.cell===move.to)!;h.cell=move.from;h.power--;}
 if(previous)assert.deepEqual(start,previous);else assert.ok(start.every(h=>h.power===(v.minMultiplier??1)));
 for(const move of d.moves){const dist=(cell:number)=>Math.abs(Math.floor(cell/5)-Math.floor(move.to/5))+Math.abs(cell%5-move.to%5);const nearest=start[dist(start[0]!.cell)<=dist(start[1]!.cell)?0:1]!;assert.equal(move.from,nearest.cell);assert.equal(d.rawGrid[move.to],SYM.SCATTER);nearest.cell=move.to;nearest.power=Math.min(20,nearest.power+1);assert.equal(nearest.power,move.power);moved++;}
 assert.deepEqual(start,d.hunters);previous=d.hunters;
 for(const h of d.hunters){assert.equal(rec.grid[h.cell],SYM.WILD);assert.equal(rec.mults![h.cell],h.power);assert.ok(h.power<=20);}
 for(const win of rec.result.lineWins){let power=0;for(const h of d.hunters)if(win.cells!.includes(h.cell))power+=h.power;const tier=CLUSTER_TIERS.findIndex(([lo,hi])=>win.count>=lo&&win.count<=hi);const expected=m.game.paytable[win.symbol]![tier]!*(bet/20)*HUNT_POWER*Math.max(1,power);assert.equal(win.amount,expected);}
 }
 const steps=roundToSteps(m.game,r);assert.equal(steps.reduce((a,s)=>a+s.win,0),r.totalWin);assert.deepEqual(JSON.parse(JSON.stringify(steps)).at(-1).story,(r.free.at(-1) as HuntRecord).story);
 }
 assert.ok(moved>1000);
});
