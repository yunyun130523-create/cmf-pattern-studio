import {describe,it,expect} from 'vitest';
import {DEFAULTS,parseProject,projectJSON} from '../src/engine';
import {bandSections,bandRelief} from '../src/stitch/BandRelief';
import {stitchGeometry,stitchSVG} from '../src/stitch/engine';
import {stitchSurface} from '../src/stitch/Surface';
const ring=[{x:0,y:0},{x:40,y:0},{x:40,y:15},{x:80,y:15},{x:80,y:0},{x:120,y:0},{x:120,y:40},{x:80,y:40},{x:80,y:25},{x:40,y:25},{x:40,y:40},{x:0,y:40}];
const s={...DEFAULTS,width:600,height:400,stitch:{...DEFAULTS.stitch,enabled:true,layout:'shape' as const,shape:'hexagon' as const,mergeShape:'band' as const,mergeEnabled:true,mergeUnits:'mm' as const,width:60,height:30,mergeWidth:60,mergeHeight:6,puff:180,grain:30,leather:'#999999'}};
describe('連續帶局部蓬鬆高度',()=>{
 it('同一合併輪廓的寬區與窄接帶都使用自己的上下縫邊，輪廓不被拆開',()=>{const columns=bandSections(ring,0,120,5),wide=columns.find(c=>c.x===0)!,neck=columns.find(c=>c.x===40)!;expect(wide.bottom-wide.top).toBe(40);expect(neck.bottom-neck.top).toBe(10);expect((wide.top+wide.bottom)/2).toBe(20);expect((neck.top+neck.bottom)/2).toBe(20);expect(columns.reduce((n,c)=>n+c.width,0)).toBe(120);});
 it('同一高度漸層覆蓋整個合併區塊，亮部方向、皮紋與 SVG 幾何保留',()=>{const p=stitchGeometry(600,400,s.stitch,s),surface=stitchSurface(s,p.cells);expect(surface.body).toContain('data-band-relief="true"');expect(surface.defs).toContain('stop-opacity="1"');expect(surface.defs).toContain('stitch-band-height');expect(surface.defs).toContain('stitch-band-clip');expect(surface.defs).toContain('stitch-fine-leather');const svg=stitchSVG(s);expect(svg).not.toContain('<image');expect(svg).not.toMatch(/NaN|Infinity/);expect(parseProject(projectJSON(s))).toEqual(s);});
 it('旋轉使用相同的局部高度，光源維持畫布方向；關閉蓬鬆沿用平面',()=>{const rotated={...s,stitch:{...s.stitch,rotation:90,lightAngle:30}},p=stitchGeometry(600,400,rotated.stitch,rotated),relief=bandRelief(rotated,p.cells)!;expect(relief.defs).toContain('azimuth="-60"');expect(relief.body).toContain('transform="matrix(');expect(bandRelief({...rotated,stitch:{...rotated.stitch,mergeShape:'horizontal',spacing:0}},p.cells)).not.toBeNull();expect(bandRelief({...s,stitch:{...s.stitch,puff:0}},p.cells)).toBeNull();expect(bandRelief({...s,stitch:{...s.stitch,mergeShape:'horizontal'}},p.cells)).toBeNull();expect(bandRelief({...s,stitch:{...s.stitch,mergeShape:'horizontal',spacing:0}},stitchGeometry(600,400,s.stitch,s).cells)).not.toBeNull();});
});
