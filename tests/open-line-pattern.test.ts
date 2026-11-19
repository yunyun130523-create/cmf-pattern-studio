import {it,expect} from 'vitest';
import {DEFAULTS,parseProject,projectJSON,type Settings} from '../src/engine';
import {makeLineShape} from '../src/custom/geometry';
import {stitchGeometry,stitchSVG} from '../src/stitch/engine';
import {gradientModePatch} from '../src/gradient';
import {composeStitchPattern} from '../src/stitch/pattern';
const shape=makeLineShape([[{x:-20,y:0},{x:20,y:0}],[{x:0,y:0},{x:0,y:10}]],{name:'open T',source:'DWG'});
const base:Settings={...DEFAULTS,width:400,height:280,minSize:2,maxSize:5,spacingX:12,spacingY:12,customShapes:[shape],stitch:{...DEFAULTS.stitch,enabled:true,shape:shape.id,layout:'shape',mergeUnits:'mm',width:50,height:30,spacing:8,patternEnabled:true,patternMargin:1}};
function compose(s:Settings){const geometry=stitchGeometry(s.width,s.height,s.stitch,s);return{...composeStitchPattern(s,geometry),geometry};}
it('開放線段不必圍成區塊，即可在整張皮革生成漸變',()=>{const p=compose(base);expect(p.glyphs.length).toBeGreaterThan(100);expect(p.geometry.cells.every(c=>c.length===2)).toBe(true);expect(p.geometry.patternCells?.every(c=>c.length===4)).toBe(true);for(const g of p.glyphs){const radius=Math.max(...g.contours.flat().map(pt=>Math.hypot(pt.x-g.x,pt.y-g.y)));for(const e of p.geometry.seams){const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,t=Math.max(0,Math.min(1,((g.x-e.a.x)*dx+(g.y-e.a.y)*dy)/(dx*dx+dy*dy)));expect(Math.hypot(g.x-e.a.x-t*dx,g.y-e.a.y-t*dy)+.001).toBeGreaterThanOrEqual(radius+p.margin);}}});
it('每格重複與旋轉／錯位都有孔紋，調整方向立即改變漸變',()=>{const s={...base,stitch:{...base.stitch,patternMapping:'cells' as const,rotation:35}},a=compose(s),b=compose({...s,...gradientModePatch(s,'vertical')});expect(a.glyphs.length).toBeGreaterThan(20);expect(b.glyphs.length).toBeGreaterThan(20);expect(a.glyphs).not.toEqual(b.glyphs);expect(a.geometry.seams).toEqual(b.geometry.seams);});
it('雙針與邊緣留白仍會減少孔紋，JSON 及向量匯出保留效果',()=>{const a=compose(base);expect(compose({...base,stitch:{...base.stitch,patternMargin:7,double:true,rowGap:4}}).glyphs.length).toBeLessThan(a.glyphs.length);expect(compose(parseProject(projectJSON(base))).glyphs).toEqual(a.glyphs);const svg=stitchSVG(base);expect(svg).toContain('data-pattern-count="'+a.glyphs.length+'"');expect(svg).not.toMatch(/<image|NaN|Infinity/);});
