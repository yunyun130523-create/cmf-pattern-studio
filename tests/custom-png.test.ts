import { describe, expect, it } from 'vitest';
import { PNG } from 'pngjs';
import { defaultTraceOptions, traceRaster, type Raster } from '../src/custom/png';
import { signedArea } from '../src/custom/geometry';
import { DEFAULTS, generatePattern, parseProject, projectJSON, svgDocument } from '../src/engine';
function raster(pixel:(x:number,y:number)=>number[],size=32):Raster{
  const png=new PNG({width:size,height:size});for(let y=0;y<size;y++)for(let x=0;x<size;x++)png.data.set(pixel(x,y),(y*size+x)*4);
  const decoded=PNG.sync.read(PNG.sync.write(png));return{width:size,height:size,data:new Uint8ClampedArray(decoded.data)};
}
const square=(x:number,y:number)=>x>=8&&x<24&&y>=8&&y<24;
describe('PNG 真正輪廓向量化',()=>{
  it('透明 PNG Logo 自動採 Alpha 輪廓，不嵌入影像',()=>{
    const r=raster((x,y)=>[255,0,0,square(x,y)?255:0]),o=defaultTraceOptions(r),s=traceRaster(r,o,'Logo');expect(o.mode).toBe('alpha');expect(s.contours).toHaveLength(1);expect(s.sourceWidth).toBe(16);expect(s.sourceHeight).toBe(16);
    const settings={...DEFAULTS,width:240,height:200,customShapes:[s],shape:s.id,morph:false};const svg=svgDocument(settings);expect(svg).toContain('<path');expect(svg).not.toMatch(/<image|data:image/);expect(generatePattern(settings).glyphs.length).toBeGreaterThan(10);expect(parseProject(projectJSON(settings)).customShapes).toEqual([s]);
  });
  it('白底黑圖與黑底白圖均能自動去背',()=>{for(const dark of [false,true]){const r=raster((x,y)=>{const v=square(x,y)?(dark?255:0):(dark?0:255);return[v,v,v,255];});const o=defaultTraceOptions(r);expect(o.invert).toBe(dark);expect(traceRaster(r,o).sourceWidth).toBe(16);}});
  it('亮度閾值改變幾何輪廓',()=>{const r=raster((x,y)=>{const v=x>5&&x<26&&y>5&&y<26?(square(x,y)?0:180):255;return[v,v,v,255];});const o={...defaultTraceOptions(r),removeBackground:false};expect(traceRaster(r,{...o,threshold:100}).sourceWidth).toBe(16);expect(traceRaster(r,{...o,threshold:210}).sourceWidth).toBe(20);});
  it('保留透明 Logo 內孔及分離輪廓',()=>{const r=raster((x,y)=>[0,0,0,x>=4&&x<28&&y>=4&&y<28&&!square(x,y)?255:0]);const s=traceRaster(r,{...defaultTraceOptions(r),smoothing:0});expect(s.contours).toHaveLength(2);expect(s.contours.reduce((a,c)=>a+signedArea(c),0)).toBeCloseTo((24*24-16*16)/(24*24));});
  it('平滑程度產生連續的近似向量，保留原始比例',()=>{const r=raster((x,y)=>[0,0,0,(x-16)**2+(y-16)**2<100?255:0]);const o=defaultTraceOptions(r);const raw=traceRaster(r,{...o,smoothing:0}),smooth=traceRaster(r,{...o,smoothing:80});expect(smooth.contours[0]).not.toEqual(raw.contours[0]);expect(smooth.contours.flat().every(p=>Number.isFinite(p.x))).toBe(true);});
  it('縮圖向量化保留來源尺寸',()=>{const r=raster((x,y)=>[0,0,0,square(x,y)?255:0]);const s=traceRaster({...r,sourceWidth:320,sourceHeight:320},defaultTraceOptions(r));expect(s.sourceWidth).toBe(160);expect(s.warnings.join()).toMatch(/縮小/);});
  it('空白或過度複雜的影像明確拒絕',()=>{const r=raster(()=>[0,0,0,0]);expect(()=>traceRaster(r,defaultTraceOptions(r))).toThrow(/未辨識/);const noise=raster((x,y)=>[0,0,0,x%2===0&&y%2===0?255:0],40);expect(()=>traceRaster(noise,{...defaultTraceOptions(noise),smoothing:0})).toThrow(/太多/);});
});
describe('PNG 解碼前安全檢查',()=>{
  it('拒絕改名與巨大尺寸，尚未呼叫瀏覽器解碼器',async()=>{
    const {decodePNG}=await import('../src/custom/png');
    const file=(bytes:Uint8Array)=>{const f=new File([bytes],'logo.png');Object.defineProperty(f,'slice',{value:(a:number,b:number)=>({arrayBuffer:async()=>bytes.slice(a,b).buffer})});return f;};
    await expect(decodePNG(file(new Uint8Array([1,2,3])))).rejects.toThrow(/不是有效/);
    const bytes=new Uint8Array(24);bytes.set([137,80,78,71,13,10,26,10]);const v=new DataView(bytes.buffer);v.setUint32(16,100000);v.setUint32(20,100000);await expect(decodePNG(file(bytes))).rejects.toThrow(/尺寸過大/);
  });
});
