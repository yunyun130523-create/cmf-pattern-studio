// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DEFAULTS } from '../src/engine';
import { GRAIN_DEFAULTS } from '../src/grain/model';
import { imageFromRGBA } from '../src/halftone/model';
describe('真實咬花 Worker',()=>{
 it('在背景執行緒傳輸四張貼圖，重用來源快取並支援不同解析度匯出',async()=>{const dir=mkdtempSync(join(tmpdir(),'cmf-grain-')),file=join(dir,'worker.cjs');execFileSync(process.cwd()+'/node_modules/.bin/esbuild',['src/grain/worker.ts','--bundle','--platform=node','--format=cjs','--outfile='+file],{stdio:'pipe'});const w=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:(data,options)=>parentPort.postMessage(data,options?.transfer)};require(${JSON.stringify(file)});parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});const send=(data:unknown)=>new Promise<any>((resolve,reject)=>{w.once('message',resolve);w.once('error',reject);w.postMessage(data);});
 try{const image=imageFromRGBA(new Uint8Array([0,0,0,255,255,255,255,255]),2,1,{name:'height.png',format:'PNG'}),s={...DEFAULTS,width:240,height:200,morph:false,grain:{...GRAIN_DEFAULTS,enabled:true,type:'image' as const,image,size:12,patternMode:'emboss' as const}},a=await send({id:1,kind:'preview',settings:s,textureId:image.id,revision:1,width:96,height:80});expect(a.error).toBeUndefined();expect(a.result.color).toBeInstanceOf(Uint8ClampedArray);expect(a.result.normal.length).toBe(96*80*4);expect(a.result.glyphs).toBeGreaterThan(10);const b=await send({id:2,kind:'export',settings:{...s,grain:{...s.grain,image:null}},textureId:image.id,revision:1,width:192,height:160});expect(b.result.width).toBe(192);expect(b.result.maxMm).toBeGreaterThan(b.result.minMm);const bad=await send({id:3,kind:'preview',settings:{...s,grain:{...s.grain,image:null}},textureId:'missing',revision:1,width:96,height:80});expect(bad.error).toMatch(/快取遺失/);
 }finally{await w.terminate();rmSync(dir,{recursive:true,force:true});}
 },30000);
});
