// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULTS, generatePattern, svgDocument } from '../src/engine';
import { HALFTONE_DEFAULTS, imageFromRGBA } from '../src/halftone/model';
describe('真正背景執行緒處理幾何',()=>{
 it('Worker 可傳輸緊密頂點、重用圖片快取並匯出相同 SVG',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'cmf-halftone-')),bundle=join(dir,'worker.cjs');execFileSync(process.cwd()+'/node_modules/.bin/esbuild',['src/halftone/worker.ts','--bundle','--platform=node','--format=cjs','--outfile='+bundle],{stdio:'pipe'});
  const w=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:(data,options)=>parentPort.postMessage(data,options?.transfer)};require(${JSON.stringify(bundle)});parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
  const send=(message:unknown)=>new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('worker timeout')),15000);w.once('message',result=>{clearTimeout(timer);resolve(result);});w.once('error',reject);w.postMessage(message);});
  try{const rgba=new Uint8Array(16*16*4);for(let i=0;i<256;i++)rgba.set([i,i,i,255],i*4);const image=imageFromRGBA(rgba,16,16,{name:'ramp.png',format:'PNG'}),s={...DEFAULTS,width:600,height:400,morph:false,halftone:{...HALFTONE_DEFAULTS,enabled:true,image}},p=generatePattern(s);const first=await send({id:1,kind:'preview',settings:s,imageId:image.id});expect(first.error).toBeUndefined();expect(first.packed.count).toBe(p.glyphs.length);expect(first.packed.coordinates).toBeInstanceOf(Float32Array);expect(first.packed.count).toBeGreaterThan(3000);
  const next={...s,halftone:{...s.halftone,image:null}},svg=await send({id:2,kind:'svg',settings:next,imageId:image.id});expect(svg.text).toBe(svgDocument(s,p));expect(svg.text).not.toContain('<image');const error=await send({id:3,kind:'preview',settings:next,imageId:'missing'});expect(error.error).toMatch(/快取遺失/);
  }finally{await w.terminate();rmSync(dir,{recursive:true,force:true});}
 },30000);
});
