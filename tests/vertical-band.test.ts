import {describe,it,expect} from 'vitest';
import {DEFAULTS,parseProject,projectJSON} from '../src/engine';
import {bounds} from '../src/custom/geometry';
import {stitchGeometry,stitchSVG} from '../src/stitch/engine';
import {stitchOperands} from '../src/stitch/merge';
const base={...DEFAULTS,width:600,height:400,stitch:{...DEFAULTS.stitch,enabled:true,layout:'shape' as const,shape:'hexagon' as const,mergeShape:'bandVertical' as const,mergeEnabled:true,mergeUnits:'mm' as const,width:40,height:30,mergeWidth:4,mergeHeight:30,spacing:8,stagger:true}};
describe('直向連續帶',()=>{
 it('正間距下連通整欄，中心不殘留橫向端點縫線',()=>{const p=stitchGeometry(600,400,base.stitch,base);expect(p.cells.length).toBeLessThan(p.sourceCells.length/2);expect(p.cells.some(c=>bounds([c]).height>400)).toBe(true);expect(p.seams.filter(e=>Math.abs(e.a.y-e.b.y)<.001&&Math.min(e.a.x,e.b.x)<300&&Math.max(e.a.x,e.b.x)>300&&e.a.y>0&&e.a.y<400)).toHaveLength(0);const b=bounds(stitchOperands(base)[1]);expect(b.width).toBeCloseTo(4);expect(b.height).toBeCloseTo(30);});
 it('可用於主圖形 A，旋轉後仍保留相同連通性',()=>{const s={...base,stitch:{...base.stitch,shape:'bandVertical' as const,mergeEnabled:false,width:4,height:30,rotation:90}},p=stitchGeometry(600,400,s.stitch,s);expect(p.cells.some(c=>bounds([c]).width>600)).toBe(true);expect(p.seams.filter(e=>Math.abs(e.a.x-e.b.x)<.001&&Math.min(e.a.y,e.b.y)<200&&Math.max(e.a.y,e.b.y)>200&&e.a.x>0&&e.a.x<600)).toHaveLength(0);});
 it('橫帶與直帶能聯集成正交網格，錯位設定不會製造額外的半欄帶',()=>{const s={...base,stitch:{...base.stitch,shape:'band' as const,width:40,height:4,mergeHeight:30}},a=stitchGeometry(600,400,s.stitch,s),off={...s,stitch:{...s.stitch,stagger:false}};expect(a.cells).toEqual(stitchGeometry(600,400,off.stitch,off).cells);expect(a.cells.length).toBeGreaterThan(1);expect(a.cells.some(c=>bounds([c]).height>400&&bounds([c]).width>600)).toBe(true);});
 it('mm、泡棉、SVG 幾何與 JSON 還原保留新方向',()=>{const restored=parseProject(projectJSON(base));expect(restored).toEqual(base);expect(stitchGeometry(600,400,restored.stitch,restored)).toEqual(stitchGeometry(600,400,base.stitch,base));const svg=stitchSVG(base);expect(svg).toContain('data-foam-coverage="whole-sheet"');expect(svg).not.toContain('<image');expect(svg).not.toMatch(/NaN|Infinity/);});
});
