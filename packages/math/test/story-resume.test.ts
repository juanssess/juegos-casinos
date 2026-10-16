import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Sfc32Rng} from '../src/index.ts';
import {MANIFEST as zone} from '../../games/zonamuerta/src/manifest.ts';
import {MANIFEST as mafia} from '../../games/lafamilia/src/manifest.ts';
import {LocalRgs} from '../../../apps/client/src/rgs/local.ts';

test('thematic bonus metadata survives storage/reload and resume never debits or resolves again',async()=>{
 const memory=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)}});
 for(const m of [zone,mafia]){
  let resolutions=0;const engine=m.engine(),result=engine.playBonus(new Sfc32Rng(7),20);
  const opts={game:m.game,title:m.theme.TITLE,betLevels:[20],rtp:.965,bonusBuyX:m.bonusBuyX,startingBalance:100000,latencyMs:0,engine:{...engine,playBonus:()=>{resolutions++;return structuredClone(result);}}};
  const original=new LocalRgs(opts),auth={token:'test',gameId:m.id};await original.authenticate(auth);
  const bought=await original.buyBonus({bet:20});assert.equal(resolutions,1);
  assert.equal(bought.balance,100000-Math.round(20*m.bonusBuyX)+result.totalWin);
  await original.acknowledge(bought.round.roundId,1);
  const fresh=new LocalRgs(opts),reloaded=await fresh.authenticate(auth);
  assert.equal(reloaded.balance,bought.balance);assert.deepEqual(reloaded.pendingRound,bought.round);
  assert.ok(reloaded.pendingRound!.steps.slice(1).every(s=>s.story));
  await assert.rejects(()=>fresh.spin({bet:20}),{code:'ROUND_IN_PROGRESS'});
  const resumed=await fresh.resume({roundId:bought.round.roundId});assert.equal(resumed.balance,bought.balance);assert.equal(resolutions,1);assert.equal(resumed.round.acknowledgedStep,1);
  for(let i=2;i<resumed.round.steps.length;i++)await fresh.acknowledge(resumed.round.roundId,i);
  const done=await fresh.authenticate(auth);assert.equal(done.pendingRound,undefined);assert.equal(done.balance,bought.balance);
 }
});
