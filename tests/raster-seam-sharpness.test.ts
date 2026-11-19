import {describe,it,expect} from 'vitest';
import {traceRaster,defaultTraceOptions,type Raster} from '../src/custom/png';
import {DEFAULTS} from '../src/engine';
import {stitchShapeContours} from '../src/stitch/merge';
import {stitchGeometry,stitchThreadPaths,stitchSVG} from '../src/stitch/engine';
function diamond():Raster{const width=240,height=120,data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const inside=Math.abs(x-120)/105+Math.abs(y-60)/42<1;data.set([0,0,0,inside?255:0],(y*width+x)*4);}return{width,height,data};}
describe('圖片車縫直線清晰度',()=>{
 it('預設向量化把像素階梯還原為四條斜直線，保留四個尖角',()=>{const r=diamond(),raw=traceRaster(r,{...defaultTraceOptions(r),smoothing:0}),clean=traceRaster(r,defaultTraceOptions(r));expect(raw.contours[0].length).toBeGreaterThan(100);expect(clean.contours[0].length).toBeLessThanOrEqual(8);expect(clean.contours[0].filter((p,i,r)=>Math.hypot(p.x-r[(i+1)%r.length].x,p.y-r[(i+1)%r.length].y)>.3)).toHaveLength(4);expect(clean.sourceWidth/raw.sourceWidth).toBeCloseTo(1,1);expect(clean.sourceHeight/raw.sourceHeight).toBeCloseTo(1,1);});
 it('已保存的階梯圖片在車縫時去除細碎折線，不修改圖案庫；SVG 原生向量不受影響',()=>{const r=diamond(),shape=traceRaster(r,{...defaultTraceOptions(r),smoothing:0}),original=JSON.stringify(shape),s={...DEFAULTS,customShapes:[shape]};const clean=stitchShapeContours(shape.id,s);expect(clean[0].length).toBeLessThan(shape.contours[0].length/4);expect(JSON.stringify(shape)).toBe(original);const vector={...shape,source:'SVG' as const};expect(stitchShapeContours(shape.id,{...s,customShapes:[vector]})).toEqual(shape.contours);});
 it('尖角輪廓實際生成單／雙針，輸出有限座標及真正向量',()=>{const r=diamond(),shape=traceRaster(r,defaultTraceOptions(r));for(const double of [false,true]){const s={...DEFAULTS,width:320,height:180,customShapes:[shape],stitch:{...DEFAULTS.stitch,enabled:true,layout:'shape' as const,shape:shape.id,width:50,height:20,spacing:4,corner:0,double}};const p=stitchGeometry(s.width,s.height,s.stitch,s),rows=stitchThreadPaths(p,s.stitch);expect(rows).toHaveLength(double?2:1);expect(rows.every(d=>d.length>10&&!/NaN|Infinity/.test(d))).toBe(true);expect(stitchSVG(s)).not.toMatch(/<image|data:image/);}});
});
