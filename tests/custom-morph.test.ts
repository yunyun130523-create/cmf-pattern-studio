import { describe, expect, it } from 'vitest';
import { importSVG } from '../src/custom/svg';
import { bounds, morphRestriction, selfIntersects, signedArea } from '../src/custom/geometry';
import { DEFAULTS, generatePattern, interpolateOutline, morphIssue, morphOutlines, outline, parseProject, projectJSON, type Shape } from '../src/engine';
const a=importSVG('<svg><polygon points="0,0 20,0 30,10 20,20 0,20 -10,10"/></svg>','六邊標誌');
const b=importSVG('<svg><polygon points="0,-20 20,20 -20,20"/></svg>','三角標誌');
describe('自訂向量輪廓插值',()=>{
  it.each(['circle','triangle',b.id] as Shape[])('自訂輪廓 → %s：端點完全正確且中間連續無交叉',targetShape=>{
    const s={...DEFAULTS,shape:a.id,targetShape,customShapes:[a,b]};expect(morphIssue(s)).toBeNull();const [from,to]=morphOutlines(s);expect(from.length).toBe(to.length);expect(from.length).toBeGreaterThanOrEqual(96);
    expect(interpolateOutline(from,to,0)).toEqual(from);expect(interpolateOutline(from,to,1)).toEqual(to);
    expect(Math.abs(signedArea(from))).toBeCloseTo(Math.abs(signedArea(a.contours[0])),8);
    if(targetShape===b.id)expect(Math.abs(signedArea(to))).toBeCloseTo(Math.abs(signedArea(b.contours[0])),8);
    else expect(Math.abs(signedArea(to))).toBeCloseTo(Math.abs(signedArea(outline(targetShape as 'circle'|'triangle',s.aspect))),3);
    for(let i=0;i<=100;i++){const p=interpolateOutline(from,to,i/100);expect(selfIntersects(p)).toBe(false);expect(p.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y))).toBe(true);if(i){const prev=interpolateOutline(from,to,(i-1)/100);expect(Math.max(...p.map((q,j)=>Math.hypot(q.x-prev[j].x,q.y-prev[j].y)))).toBeLessThan(.02);}}
  });
  it('每一個位置計算不同 Morph，並可 JSON 完整重現',()=>{const s={...DEFAULTS,width:260,height:200,spacingX:25,spacingY:25,shape:a.id,targetShape:b.id,customShapes:[a,b],minSize:12,maxSize:12};const p=generatePattern(s);expect(new Set(p.glyphs.map(g=>g.morphT)).size).toBeGreaterThan(5);expect(p.glyphs[0].morphT).toBe(0);expect(p.glyphs.some(g=>g.morphT===1)).toBe(true);expect(generatePattern(parseProject(projectJSON(s)))).toEqual(p);});
  it('凹形、孔洞與多輪廓明確限制 Morph，仍可排列',()=>{for(const xml of ['<path d="M0 0H20V10H10V20H0Z"/>','<path fill-rule="evenodd" d="M0 0H20V20H0Z M5 5H15V15H5Z"/>']){const c=importSVG('<svg>'+xml+'</svg>');expect(morphRestriction(c)).toBeTruthy();const s={...DEFAULTS,shape:c.id,customShapes:[c],morph:false};expect(generatePattern(s).glyphs.length).toBeGreaterThan(10);expect(()=>parseProject(projectJSON({...s,morph:true}))).toThrow();}});
  it('自訂寬高及旋轉真正影響幾何，不改變內建圖案',()=>{const s={...DEFAULTS,width:240,height:200,shape:b.id,customShapes:[b],morph:false,minSize:10,maxSize:10,stagger:false};const p=generatePattern(s).glyphs[0],q=generatePattern({...s,customScaleX:2,customScaleY:3}).glyphs[0];expect(bounds(q.contours).width/bounds(p.contours).width).toBeCloseTo(2);expect(bounds(q.contours).height/bounds(p.contours).height).toBeCloseTo(3);expect(generatePattern({...s,rotation:45}).glyphs[0].d).not.toBe(p.d);const old={...s,shape:'hexagon' as const};expect(generatePattern(old)).toEqual(generatePattern({...old,customScaleX:4,customScaleY:5}));});
});
