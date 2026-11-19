import {it,expect} from 'vitest';
import {DEFAULTS,projectJSON,parseProject} from '../src/engine';
import {makeLineShape} from '../src/custom/geometry';
import {stitchGeometry} from '../src/stitch/engine';
import {stitchSpacing,validateStitch} from '../src/stitch/model';
const shape=makeLineShape([[{x:-10,y:-5},{x:10,y:-5},{x:10,y:5},{x:-10,y:5},{x:-10,y:-5}]],{name:'rectangle paths',source:'DWG'});
const base={...DEFAULTS,width:400,height:300,customShapes:[shape],stitch:{...DEFAULTS.stitch,layout:'shape' as const,shape:shape.id,mergeUnits:'mm' as const,width:40,height:20,spacing:5,stagger:false}};
function periods(x:number,y:number){const s={...base,stitch:{...base.stitch,spacingX:x,spacingY:y}},p=stitchGeometry(s.width,s.height,s.stitch,s);const cells=p.patternCells!;const near=cells.find(c=>Math.abs((c[0].x+c[2].x)/2-200)<.01&&Math.abs((c[0].y+c[2].y)/2-150)<.01)!;return{width:near[1].x-near[0].x,height:near[2].y-near[1].y,p};}
it('開放 CAD 的橫直間距獨立，0 時以原線外框真正貼齊',()=>{const a=periods(0,0),b=periods(6,0),c=periods(0,7);expect(a.width).toBeCloseTo(40*96/25.4,2);expect(a.height).toBeCloseTo(20*96/25.4,2);expect(b.height).toBe(a.height);expect(b.width-a.width).toBeCloseTo(6*96/25.4,2);expect(c.width).toBe(a.width);expect(c.height-a.height).toBeCloseTo(7*96/25.4,2);});
it('負值可上下重疊靠攏，單位與 JSON 保存不變',()=>{const a=periods(0,0),b=periods(0,-4);expect(a.height-b.height).toBeCloseTo(4*96/25.4,2);const s={...base,stitch:{...base.stitch,spacingX:2,spacingY:-4}};expect(parseProject(projectJSON(s)).stitch).toMatchObject({spacingX:2,spacingY:-4});});
it('舊 spacing 專案繼續同時控制兩軸，非法軸間距被拒絕',()=>{expect(stitchSpacing(validateStitch(base.stitch))).toEqual({x:5,y:5});for(const spacingX of [NaN,Infinity,-41,41,'2'])expect(()=>validateStitch({...base.stitch,spacingX})).toThrow();});
it('封閉幾何單軸貼齊會合併，另一軸維持指定間距',()=>{const s={...base,stitch:{...base.stitch,shape:'square' as const,spacingX:5,spacingY:0}},p=stitchGeometry(s.width,s.height,s.stitch,s);expect(p.cells.length).toBeGreaterThan(1);expect(p.cells.length).toBeLessThan(p.sourceCells.length);});
