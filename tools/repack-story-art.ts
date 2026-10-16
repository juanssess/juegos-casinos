/** Deterministically pack existing generated assets; does not generate or paint artwork. */
import {readFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
const id=process.argv[2];
if(id!=='zonamuerta'&&id!=='lafamilia')throw new Error('Uso: node tools/repack-story-art.ts zonamuerta|lafamilia');
const dir=resolve('packages/games',id,'art');
const meta=JSON.parse(readFileSync(resolve(dir,'prompts.json'),'utf8'));
const atlas=meta.derivatives?.actionAtlas;
if(atlas){
 if(atlas.frames.length!==16)throw new Error('Se requieren dieciséis fotogramas');
 const composites=[];
 for(const [i,frame] of atlas.frames.entries())composites.push({input:await sharp(resolve(dir,atlas.source)).extract(frame).png().toBuffer(),left:i%atlas.cols*atlas.cell+Math.floor((atlas.cell-frame.width)/2),top:Math.floor(i/atlas.cols)*atlas.cell+atlas.baseline-frame.height});
 await sharp({create:{width:atlas.cols*atlas.cell,height:4*atlas.cell,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toFile(resolve(dir,'chase.png'));
}
const symbol=meta.derivatives?.bonusSymbol;
if(symbol){
 const art=JSON.parse(readFileSync(resolve(dir,'art.json'),'utf8')),cell=art.symbols.cell,cols=art.symbols.cols;
 const image=await sharp(resolve(dir,art.symbols.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const sx=symbol.symbol%cols*cell,sy=Math.floor(symbol.symbol/cols)*cell;
 for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){const p=((sy+y)*image.info.width+sx+x)*4;image.data.fill(0,p,p+4);}
 const icon=await sharp(resolve(dir,symbol.source)).extract(symbol.crop).trim().resize(264,264,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
 const tmp=resolve(dir,'symbols-repacked.png');
 await sharp(image.data,{raw:{width:image.info.width,height:image.info.height,channels:4}}).composite([{input:icon,left:sx+28,top:sy+28}]).png().toFile(tmp);
 renameSync(tmp,resolve(dir,art.symbols.file));
}
console.log('Repacked '+id+' using its recorded crops.');
