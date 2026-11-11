import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { decode } from 'jpeg-js';
import { generateHalftone } from '../src/halftone/engine';
import { DEFAULTS, generatePattern, projectJSON, svgDocument } from '../src/engine';
import { HALFTONE_DEFAULTS, imageFromRGBA } from '../src/halftone/model';
import { performance } from 'node:perf_hooks';
const root=new URL('../work/halftone-examples/',import.meta.url);await mkdir(root,{recursive:true});
const jpg=await readFile(new URL('../src/halftone/mountain.jpg',import.meta.url)),photo=decode(jpg,{useTArray:true});
const image=imageFromRGBA(photo.data,photo.width,photo.height,{name:'mountain-sample.jpg',format:'JPEG'});
const settings={...DEFAULTS,width:960,height:640,shape:'circle' as const,morph:false,foreground:'#1D1D1F',background:'#F4F0E7',halftone:{...HALFTONE_DEFAULTS,enabled:true,image,maxSize:4.4,spacingX:5,spacingY:5,contrast:1.15}};
const demos={full:settings,sparse:{...settings,halftone:{...settings.halftone,mode:'sparse' as const}},triangle:{...settings,shape:'triangle' as const},transparent:{...settings,transparentBackground:true}};
const fastStart=performance.now(),fast=generateHalftone(settings,true);const coldMs=Math.round(performance.now()-fastStart);const warmStart=performance.now();generateHalftone(settings,true);const warmMs=Math.round(performance.now()-warmStart);const stats:Record<string,unknown>={warmCirclePreviewMs:warmMs,circlePreview:{elements:fast.glyphs.length,generationMs:coldMs,note:'compact circle geometry used by preview and SVG worker; excludes Canvas drawing'}};
for(const [name,s] of Object.entries(demos)){const start=performance.now(),pattern=generatePattern(s);stats[name]={elements:pattern.glyphs.length,generationMs:Math.round(performance.now()-start),limited:pattern.limited};await writeFile(new URL(name+'.svg',root),svgDocument(s,pattern));await writeFile(new URL(name+'.json',root),projectJSON(s));}
const preview={...settings,width:720,height:480,halftone:{...settings.halftone,spacingX:5,spacingY:5,maxSize:4.5}},svg=svgDocument(preview).replace(/<\?xml[^>]*>\s*/, '');
await writeFile(new URL('Mountain-Halftone-Verification.svg',root),svg);
await writeFile(new URL('mountain-sample.jpg',root),jpg);
await writeFile(new URL('benchmark.json',root),JSON.stringify(stats,null,2));console.log(JSON.stringify(stats));
