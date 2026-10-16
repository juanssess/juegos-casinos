import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Sfc32Rng,SYM,type FastRound} from '../src/index.ts';
import {MANIFEST as m} from '../../games/lafamilia/src/manifest.ts';
import {RIVAL_HP,type WarRecord} from '../../games/lafamilia/src/engine.ts';
import {roundToSteps} from '../../../apps/client/src/rgs/local.ts';
const bet=20;
test('war: detailed/fast totals, spin counts and RNG agree for base and ante',()=>{
 for(const ante of [false,true]){const e=m.engine(),a=new Sfc32Rng(1873),b=new Sfc32Rng(1873);const out:FastRound={baseWin:0,featureWin:0,totalWin:0,triggered:false,freeSpinsPlayed:0,tier:0};for(let i=0;i<30000;i++){const r=e.play(a,bet,ante);e.playFast(b,bet,out,ante);assert.equal(r.totalWin,out.totalWin);assert.equal(r.free.length,out.freeSpinsPlayed);assert.equal(a.nextInt(1e6),b.nextInt(1e6));}}
});
test('war: ammunition damages rivals in order, promotes symbols, awards extra spins and unlocks the vault',()=>{
 const e=m.engine(),rng=new Sfc32Rng(191930);let vaults=0;
 for(let n=0;n<350;n++){const r=e.playBonus(rng,bet);assert.ok(r.triggered);const hp=[RIVAL_HP,RIVAL_HP,RIVAL_HP,RIVAL_HP];let remaining=8;
 for(const rec of r.free as WarRecord[]){const d=rec.story;remaining--;assert.deepEqual(d.before,hp);assert.equal(d.cashHit,hp.every(v=>!v));const defeated:number[]=[];
 for(let i=0;i<d.bullets;i++){const target=hp.findIndex(v=>v>0);if(target<0)break;hp[target]!--;if(hp[target]===0)defeated.push(target);}
 assert.deepEqual(d.defeated,defeated);assert.deepEqual(d.hp,hp);const extra=defeated.reduce((s,i)=>s+(i===3?4:2),0);assert.equal(rec.awarded,extra);remaining+=extra;assert.equal(d.left,remaining);
 const rivals:number[]=[SYM.H2,SYM.H3,SYM.H4,SYM.L1];for(let c=0;c<rec.grid.length;c++){const rival=rivals.indexOf(d.rawGrid[c]!);assert.equal(rec.grid[c],rival>=0&&hp[rival]===0?SYM.H1:d.rawGrid[c]);}
 if(d.cashHit){vaults++;assert.equal(d.safes.length,3);let collect=0;for(let c=0;c<rec.grid.length;c++)if(rec.grid[c]===SYM.H1)collect+=d.safes[c%3]!*bet;assert.equal(d.collect,collect);}else assert.equal(d.collect,0);
 }
 assert.ok(r.totalWin<=5000*bet);assert.equal(r.baseWin+r.featureWin,r.totalWin);assert.equal(roundToSteps(m.game,r).reduce((s,x)=>s+x.win,0),r.totalWin);
 }
 assert.ok(vaults>20);
});
test('war: the rare vault prize respects the round cap and replay sums exactly',()=>{
 const seeded=new Sfc32Rng(7),rng={nextInt:(max:number)=>max===1000?999:max===1e6?0:seeded.nextInt(max)},r=m.engine().playBonus(rng,bet);
 assert.equal(r.totalWin,5000*bet);assert.equal(roundToSteps(m.game,r).reduce((s,x)=>s+x.win,0),r.totalWin);assert.ok((r.free as WarRecord[]).some(s=>s.story.cashHit));
});
