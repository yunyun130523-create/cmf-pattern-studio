import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { importSVG } from '../src/custom/svg';
import { bounds, signedArea, morphRestriction } from '../src/custom/geometry';
import { readLibrary, saveLibrary } from '../src/custom/storage';
import { DEFAULTS, generatePattern, parseProject, projectJSON, svgDocument, type Settings } from '../src/engine';
import { cadContours } from '../src/exports';
const triangle='<svg viewBox="0 0 100 100"><polygon points="50,0 100,100 0,100"/></svg>';
const donut='<svg viewBox="0 0 100 100"><path fill-rule="evenodd" d="M0 0H100V100H0Z M25 25H75V75H25Z"/></svg>';
describe('自訂圖案第一階段：SVG 幾何與安全處理',()=>{
  it('SVG 三角形轉為封閉幾何，保留比例與原始尺寸',()=>{
    const shape=importSVG(triangle,'測試三角形');expect(shape.contours).toHaveLength(1);expect(shape.contours[0]).toHaveLength(3);expect(shape.sourceWidth).toBe(100);expect(shape.sourceHeight).toBe(100);expect(bounds(shape.contours).width).toBe(1);expect(morphRestriction(shape)).toBeNull();
  });
  it('Path 的相對座標、H/V 與群組 Transform 正確套用',()=>{
    const s=importSVG('<svg viewBox="10 20 200 100" width="400" height="200"><g transform="translate(10 0) rotate(90)"><path d="M0 0h20v10h-20z"/></g></svg>');
    expect(s.sourceWidth).toBeCloseTo(20);expect(s.sourceHeight).toBeCloseTo(40);expect(bounds(s.contours).width/bounds(s.contours).height).toBeCloseTo(.5);
  });
  it('viewBox preserveAspectRatio none 支援非等比例座標轉換',()=>{
    const s=importSVG('<svg width="200" height="50" viewBox="0 0 100 100" preserveAspectRatio="none"><rect width="100" height="100"/></svg>');expect(s.sourceWidth).toBe(200);expect(s.sourceHeight).toBe(50);
  });
  it.each(['<circle cx="50" cy="50" r="20"/>','<ellipse cx="50" cy="50" rx="30" ry="10"/>','<rect x="5" y="5" width="60" height="40" rx="6"/>','<path d="M0 0 C0 30 30 30 30 0 Q15 -10 0 0Z"/>'])('解析曲線與基本幾何 %s',element=>{
    const shape=importSVG('<svg viewBox="0 0 100 100">'+element+'</svg>');expect(shape.contours[0].length).toBeGreaterThan(4);expect(shape.contours[0].every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);
  });
  it('保留多輪廓、孔洞及正確填色面積',()=>{
    const shape=importSVG(donut);expect(shape.contours).toHaveLength(2);expect(shape.contours.reduce((n,c)=>n+signedArea(c),0)).toBeCloseTo(.75);expect(morphRestriction(shape)).toMatch(/多輪廓/);
    const other=importSVG('<svg><rect width="10" height="10"/><circle cx="30" cy="5" r="5"/></svg>');expect(other.contours).toHaveLength(2);
  });
  it('nonzero 反向內圈保留孔洞，同方向重疊輪廓則合併',()=>{
    const hole=importSVG('<svg><path d="M0 0H100V100H0Z M25 25V75H75V25Z"/></svg>');expect(hole.contours).toHaveLength(2);
    const overlap=importSVG('<svg><path d="M0 0H10V10H0Z M5 0H15V10H5Z"/></svg>');expect(overlap.contours).toHaveLength(1);expect(overlap.sourceWidth).toBe(15);
  });
  it('不執行或保留 Script、事件、外部資源或影像',()=>{
    const shape=importSVG('<svg onload="window.bad=1"><script>throw 1</script><image href="https://invalid.example/logo.png"/><foreignObject><p>bad</p></foreignObject><path onclick="bad()" d="M0 0H10V10H0Z"/></svg>');
    const json=JSON.stringify(shape);expect(json).not.toMatch(/onclick|onload|https:|foreignObject|throw 1/);expect(shape.warnings.length).toBeGreaterThan(0);
  });
  it.each(['<!DOCTYPE svg><svg/>','<svg><path d="M0 0L10 10"/></svg>','<svg><rect clip-path="url(#a)" width="10" height="10"/></svg>','<svg><path d="M0 0 L10 10 L0 10 L10 0Z"/></svg>'])('拒絕不安全或錯誤輪廓',svg=>{expect(()=>importSVG(svg)).toThrow();});
});
describe('自訂圖案第一階段：排列、匯出與持久化',()=>{
  const custom=importSVG(donut,'環形');const s:Settings={...DEFAULTS,width:240,height:200,spacingX:25,spacingY:25,customShapes:[custom],shape:custom.id,morph:false,minSize:4,maxSize:14};
  it.each(['horizontal','vertical','radial','irregular'] as const)('%s 以實際多輪廓進行排列與尺寸漸變',mode=>{
    const p=generatePattern({...s,mode});expect(p.glyphs.length).toBeGreaterThan(20);expect(p.glyphs.every(g=>g.contours.length===2)).toBe(true);expect(new Set(p.glyphs.map(g=>g.size)).size).toBeGreaterThan(2);
  });
  it('自訂寬高、旋轉、隨機位置與尺寸確實改變頂點',()=>{
    const a=generatePattern(s),b=generatePattern({...s,customScaleX:1.5,customScaleY:.8,rotation:35,jitter:50,randomSize:20});expect(a).not.toEqual(b);
  });
  it('SVG 是真正向量複合 Path，CAD 亦匯出內外輪廓',()=>{
    const p=generatePattern(s),svg=svgDocument(s,p),doc=new DOMParser().parseFromString(svg,'image/svg+xml');expect(doc.querySelector('parsererror')).toBeNull();expect(doc.querySelectorAll('path')).toHaveLength(p.glyphs.length);expect(doc.querySelector('g')?.getAttribute('fill-rule')).toBe('evenodd');expect(svg).not.toMatch(/<image|<script|data:image/);expect(cadContours(s,p,'mm')).toHaveLength(p.glyphs.length*2);
  });
  it('自訂圖案隨機排列可依 Seed 重現，改 Seed 得到不同幾何',()=>{const random={...s,jitter:70,randomRotation:90,randomSize:40,randomDensity:20,seed:43};expect(generatePattern(random)).toEqual(generatePattern({...random}));expect(generatePattern(random)).not.toEqual(generatePattern({...random,seed:44}));});
  it('JSON 重新匯入可完整還原圖案幾何與排列',()=>{const restored=parseProject(projectJSON(s));expect(restored).toEqual(s);expect(generatePattern(restored)).toEqual(generatePattern(s));});
  it('關閉再開啟本機資料庫仍可讀到圖案，重新命名與刪除可保存',async()=>{
    Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true});await saveLibrary([custom]);expect((await readLibrary()).shapes).toEqual([custom]);
    const renamed={...custom,name:'新的名稱',updatedAt:Date.now()+1};await saveLibrary([renamed]);expect((await readLibrary()).shapes[0].name).toBe('新的名稱');await saveLibrary([]);expect((await readLibrary()).shapes).toEqual([]);
  });
});
