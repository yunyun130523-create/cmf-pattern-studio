import {describe,it,expect} from 'vitest';
import {DEFAULTS,parseProject,projectJSON,type Point} from '../src/engine';
import {foamField,foamContours,foamRelief} from '../src/stitch/FoamRelief';
import {stitchGeometry,stitchSVG} from '../src/stitch/engine';
import {stitchSurface} from '../src/stitch/Surface';
const s={...DEFAULTS,width:200,height:200,stitch:{...DEFAULTS.stitch,enabled:true,layout:'shape' as const,shape:'hexagon' as const,mergeShape:'band' as const,mergeEnabled:true,mergeUnits:'mm' as const,width:40,height:20,mergeWidth:40,mergeHeight:5,puff:100,grain:30,leather:'#e4dfd3'}};
const ring:Point[]=[{x:40,y:30},{x:100,y:30},{x:100,y:110},{x:40,y:110}];
const at=(field:ReturnType<typeof foamField>,x:number,y:number)=>Math.round((y-field.top)/field.step)*field.width+Math.round((x-field.left)/field.step);
describe('整片泡棉壓縫表面',()=>{
 it('縫線壓低，圖案內外與背景間隙都形成弧面，不以圖形 Alpha 留下平面',()=>{const f=foamField(s,[ring]);expect(f.heights[at(f,100,70)]).toBeLessThan(.15);expect(f.heights[at(f,70,70)]).toBeGreaterThan(.7);expect(f.heights[at(f,130,70)]).toBeGreaterThan(.2);expect(f.heights[at(f,145,70)]-f.heights[at(f,107,70)]).toBeGreaterThan(.2);expect([...f.heights].every(v=>Number.isFinite(v)&&v>=0&&v<=1)).toBe(true);});
 it('最近縫線的距離與局部隆起使用真正輪廓；寬區與窄區都可恢復高度',()=>{const neck=[{x:10,y:20},{x:60,y:20},{x:60,y:55},{x:110,y:55},{x:110,y:20},{x:160,y:20},{x:160,y:100},{x:110,y:100},{x:110,y:65},{x:60,y:65},{x:60,y:100},{x:10,y:100}];const f=foamField(s,[neck]);expect(f.heights[at(f,35,60)]).toBeGreaterThan(.8);expect(f.heights[at(f,85,60)]).toBeGreaterThan(.7);expect(f.distance[at(f,85,60)]).toBeLessThan(f.distance[at(f,35,60)]);});
 it('整片高度以封閉向量等高面編碼，沒有嵌入圖片；光源、泡棉強度與細皮紋保留',()=>{const p=stitchGeometry(200,200,s.stitch,s),surface=stitchSurface(s,p.cells),mesh=foamContours(foamField(s,[ring]),8);expect(mesh).toContain('fill-rule="evenodd"');expect(mesh).not.toMatch(/NaN|Infinity/);expect(surface.body).toContain('data-foam-coverage="whole-sheet"');expect(surface.defs).toContain('feDiffuseLighting');expect(surface.defs).toContain('stitch-fine-leather');const svg=stitchSVG(s);expect(svg).not.toContain('<image');expect(svg).not.toContain('data:image');expect(svg).not.toMatch(/NaN|Infinity/);expect(parseProject(projectJSON(s))).toEqual(s);});
 it('泡棉也適用獨立圖案與一般格紋，強度 0 可明確回到平面',()=>{expect(foamRelief({...s,stitch:{...s.stitch,layout:'hex',mergeEnabled:false}},[ring])).not.toBeNull();expect(foamRelief({...s,stitch:{...s.stitch,puff:0}},[ring])).toBeNull();const a=foamRelief(s,[ring])!,b=foamRelief({...s,stitch:{...s.stitch,puff:200,lightAngle:19}},[ring])!;expect(b.body).toEqual(a.body);expect(b.defs).not.toEqual(a.defs);expect(b.defs).toContain('azimuth="19"');});
 it('完整畫布的高度向量維持可互動的資料量，避免過量等高線拖慢預覽',()=>{const p=stitchGeometry(DEFAULTS.width,DEFAULTS.height,DEFAULTS.stitch,DEFAULTS),foam=foamRelief(DEFAULTS,p.cells)!;expect(foam.body.length).toBeLessThan(1500000);expect(foam.body).toContain('whole-sheet');});
});
