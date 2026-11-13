import { describe,it,expect } from 'vitest';
import { DEFAULTS,projectJSON,parseProject,type Settings } from '../src/engine';
import { STITCH_DEFAULTS,validateStitch } from '../src/stitch/model';
import { stitchGeometry,stitchSVG } from '../src/stitch/engine';
import { composeStitchPattern } from '../src/stitch/pattern';
const s:Settings={...DEFAULTS,width:600,height:400,minSize:2,maxSize:6,spacingX:14,spacingY:14,stitch:{...STITCH_DEFAULTS,enabled:true,patternEnabled:true,width:40,height:30,patternMargin:1}};
const compose=(v:Settings)=>{const seams=stitchGeometry(v.width,v.height,v.stitch,v);return{...composeStitchPattern(v,seams),seams};};
describe('漸變 Pattern 與車縫合成',()=>{
 it('真正向量孔紋與縫線共存，所有圖案外緣保留設定留白',()=>{const p=compose(s);expect(p.glyphs.length).toBeGreaterThan(100);for(const g of p.glyphs){const radius=Math.max(...g.contours.flat().map(pt=>Math.hypot(pt.x-g.x,pt.y-g.y)));for(const e of p.seams.seams){const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,t=Math.max(0,Math.min(1,((g.x-e.a.x)*dx+(g.y-e.a.y)*dy)/(dx*dx+dy*dy)));expect(Math.hypot(g.x-e.a.x-t*dx,g.y-e.a.y-t*dy)+1e-6).toBeGreaterThanOrEqual(radius+p.margin);}}const svg=stitchSVG(s);expect(svg).toContain('data-stitch-pattern="true"');expect(svg).not.toContain('<image');expect(svg).toContain('stroke-dasharray');},15000);
 it('留白與雙針確實減少孔紋；切換每格重複、尺寸及 Seed 改變合成',()=>{const a=compose(s);expect(compose({...s,stitch:{...s.stitch,patternMargin:8}}).glyphs.length).toBeLessThan(a.glyphs.length);expect(compose({...s,stitch:{...s.stitch,double:true,rowGap:8}}).glyphs.length).toBeLessThan(a.glyphs.length);expect(compose({...s,stitch:{...s.stitch,patternMapping:'cells'}}).glyphs).not.toEqual(a.glyphs);expect(compose({...s,minSize:1,maxSize:3}).glyphs).not.toEqual(a.glyphs);expect(compose({...s,density:50,seed:99}).glyphs).not.toEqual(a.glyphs);});
 it('不規則車縫、JSON 及舊版參數保留相同結果',()=>{const v={...s,stitch:{...s.stitch,layout:'irregular' as const}};expect(compose(v).glyphs.length).toBeGreaterThan(0);expect(compose(parseProject(projectJSON(v))).glyphs).toEqual(compose(v).glyphs);const old={...STITCH_DEFAULTS}as any;delete old.patternEnabled;delete old.patternMapping;delete old.patternMargin;expect(validateStitch(old)).toEqual(STITCH_DEFAULTS);expect(()=>validateStitch({...old,patternMargin:-1})).toThrow();expect(()=>validateStitch({...old,patternMapping:'fake'})).toThrow();});
});
