import {describe,it,expect} from 'vitest';
import {DEFAULTS,parseProject,projectJSON} from '../src/engine';
import {bounds} from '../src/custom/geometry';
import {stitchOperands,mergedStitchContours} from '../src/stitch/merge';
import {millimetreStitch} from '../src/stitch/units';
import {stitchGeometry,stitchSVG} from '../src/stitch/engine';
const px=96/25.4;
const base={...DEFAULTS,width:600,height:400,stitch:{...DEFAULTS.stitch,enabled:true,layout:'shape' as const,shape:'diamond' as const,mergeShape:'band' as const,mergeEnabled:true,mergeUnits:'mm' as const,width:40,height:30,mergeWidth:40,mergeHeight:4,mergeOffsetX:0,mergeOffsetY:0,spacing:8,stagger:false}};
describe('實際 mm 車縫與連續帶',()=>{
 it('連續帶沿整列合併，正間距下也沒有中間垂直端點縫線',()=>{const p=stitchGeometry(600,400,base.stitch,base);expect(p.cells.length).toBeLessThan(p.sourceCells.length/2);const interior=p.seams.filter(e=>Math.min(e.a.x,e.b.x)>0&&Math.max(e.a.x,e.b.x)<600&&Math.abs(e.a.y-200)<px&&Math.abs(e.b.y-200)<px);expect(interior).toHaveLength(0);expect(p.cells.some(c=>bounds([c]).width>600)).toBe(true);});
 it('橫與豎使用實際獨立寬高，合併不再把 B 拉回 A 外框',()=>{const s={...base,stitch:{...base.stitch,mergeShape:'horizontal' as const,mergeWidth:60,mergeHeight:5}};const [a,b]=stitchOperands(s);expect(bounds(a).width).toBeCloseTo(40);expect(bounds(b).width).toBeCloseTo(60);expect(bounds(b).height).toBeCloseTo(5);const p=stitchGeometry(600,400,s.stitch,s),cell=p.sourceCells.find(c=>Math.abs((bounds([c]).minX+bounds([c]).maxX)/2-300)<.01&&Math.abs((bounds([c]).minY+bounds([c]).maxY)/2-200)<.01)!;expect(bounds([cell]).width/px).toBeCloseTo(60,2);expect(bounds([cell]).height/px).toBeCloseTo(30,2);});
 it('舊百分比專案轉換成 mm 時維持外框與實際 B 尺寸',()=>{const old={...base,stitch:{...DEFAULTS.stitch,layout:'shape' as const,shape:'hexagon' as const,mergeEnabled:true,mergeWidth:130,mergeHeight:55}};const g=millimetreStitch(old),s={...old,stitch:g},box=bounds(mergedStitchContours(s));expect(box.width).toBeCloseTo(old.stitch.width);expect(box.height).toBeCloseTo(old.stitch.height);expect(bounds(stitchOperands(s)[1]).width).toBeCloseTo(75);expect(g.mergeUnits).toBe('mm');expect(parseProject(projectJSON(s))).toEqual(s);});
 it('連續帶、實體尺寸、位移與 SVG 向量完整保存',()=>{const s={...base,stitch:{...base.stitch,mergeOffsetY:3.5}};expect(parseProject(projectJSON(s))).toEqual(s);const svg=stitchSVG(s);expect(svg).toContain('<path');expect(svg).not.toContain('<image');expect(stitchGeometry(600,400,parseProject(projectJSON(s)).stitch,s)).toEqual(stitchGeometry(600,400,s.stitch,s));});
});
