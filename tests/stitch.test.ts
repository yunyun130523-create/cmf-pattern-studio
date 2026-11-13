import { describe,it,expect } from 'vitest';
import { DEFAULTS,projectJSON,parseProject } from '../src/engine';
import { STITCH_DEFAULTS,validateStitch } from '../src/stitch/model';
import { stitchGeometry,stitchSVG } from '../src/stitch/engine';
describe('車縫設計試用幾何',()=>{
 it.each(['hex','diamond','square']as const)('%s 有共邊去重且可重現',layout=>{const g={...STITCH_DEFAULTS,layout},a=stitchGeometry(1200,800,g);expect(a.cells.length).toBeGreaterThan(20);expect(a.seams.length).toBeLessThan(a.cells.length*(layout==='hex'?6:4));const keys=a.seams.map(({a,b})=>[`${a.x},${a.y}`,`${b.x},${b.y}`].sort().join('|'));expect(new Set(keys).size).toBe(keys.length);expect(stitchGeometry(1200,800,g)).toEqual(a);});
 it('格寬高與旋轉真正改變座標，雙排、針目與色彩寫入 SVG',()=>{const a=stitchGeometry(1200,800,STITCH_DEFAULTS);expect(stitchGeometry(1200,800,{...STITCH_DEFAULTS,width:90})).not.toEqual(a);expect(stitchGeometry(1200,800,{...STITCH_DEFAULTS,rotation:30})).not.toEqual(a);const s={...DEFAULTS,stitch:{...STITCH_DEFAULTS,enabled:true,double:true,pitch:4,thread:'#123456'}};const svg=stitchSVG(s);expect(svg).toContain('stroke="#123456"');expect(svg).toContain('stroke-dasharray="15.118');expect(svg).not.toContain('<image');expect(stitchSVG({...s,stitch:{...s.stitch,surface:false}})).not.toContain('<polygon');expect(parseProject(projectJSON(s))).toEqual(s);const old=JSON.parse(projectJSON(s));delete old.settings.stitch;expect(parseProject(JSON.stringify(old)).stitch).toEqual(STITCH_DEFAULTS);});
 it('錯誤參數不能載入',()=>{for(const p of [{pitch:0},{width:1},{leather:'url(x)'},{layout:'fake'},{double:'yes'}])expect(()=>validateStitch({...STITCH_DEFAULTS,...p})).toThrow();});
});
