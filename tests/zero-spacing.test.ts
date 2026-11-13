import { describe,it,expect } from 'vitest';
import { DEFAULTS,projectJSON,parseProject } from '../src/engine';
import { STITCH_DEFAULTS } from '../src/stitch/model';
import { stitchGeometry,stitchSVG } from '../src/stitch/engine';
import { unionTouchingCells } from '../src/stitch/join';
import { signedArea } from '../src/custom/geometry';
const s={...DEFAULTS,width:600,height:400,stitch:{...STITCH_DEFAULTS,enabled:true,layout:'shape' as const,shape:'square' as const,width:40,height:25,stagger:false,spacing:0}};
describe('零間距自動合併車縫',()=>{
 it('零間距方形排列合為單一區塊，畫布內完全沒有分隔線段',()=>{const p=stitchGeometry(600,400,s.stitch,s);expect(p.sourceCells.length).toBeGreaterThan(20);expect(p.cells).toHaveLength(1);for(const e of p.seams){const x=(e.a.x+e.b.x)/2,y=(e.a.y+e.b.y)/2;expect(x>0&&x<600&&y>0&&y<400).toBe(false);}expect(stitchSVG(s)).toContain('data-stitch-cells="1"');expect(stitchSVG({...s,stitch:{...s.stitch,double:true,corner:5}})).not.toMatch(/NaN|Infinity/);});
 it('正間距保留獨立區塊，回到零間距再次自動合併，JSON 可重現',()=>{const positive={...s,stitch:{...s.stitch,spacing:2}},p=stitchGeometry(600,400,positive.stitch,positive);expect(p.cells.length).toBe(p.sourceCells.length);expect(p.cells.length).toBeGreaterThan(1);expect(stitchGeometry(600,400,s.stitch,s).cells).toEqual(stitchGeometry(600,400,parseProject(projectJSON(s)).stitch,s).cells);});
 it('聯集合併共邊時保留原有孔洞，不刪除未相接輪廓',()=>{const a=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}],b=a.map(p=>({x:p.x+100,y:p.y})),hole=[{x:20,y:20},{x:20,y:40},{x:40,y:40},{x:40,y:20}],far=a.map(p=>({x:p.x+300,y:p.y})),c=unionTouchingCells([a,b,hole,far]);expect(c.filter(r=>signedArea(r)>0)).toHaveLength(2);expect(c.filter(r=>signedArea(r)<0)).toHaveLength(1);expect(c.reduce((n,r)=>n+signedArea(r),0)).toBeCloseTo(29600);});
 it('六角形加長方形的零間距接合線也會被移除',()=>{const v={...s,stitch:{...s.stitch,shape:'hexagon' as const,mergeEnabled:true,mergeShape:'rectangle' as const,stagger:true}},p=stitchGeometry(600,400,v.stitch,v);expect(p.cells.length).toBeLessThan(p.sourceCells.length);expect(p.seams.length).toBeLessThan(stitchGeometry(600,400,{...v.stitch,spacing:.5},v).seams.length);});
});
