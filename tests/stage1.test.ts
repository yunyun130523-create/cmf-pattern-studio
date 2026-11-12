import { describe, expect, it } from 'vitest';
import { DEFAULTS, densityProbability, fieldValue, generatePattern, hash, morphValue, parseProject, projectJSON, randomWeight, svgDocument, type Settings } from '../src/engine';
import { controlPatch, controlPositions, type ControlKey } from '../src/controls';
const base:Settings={...DEFAULTS,width:200,height:200,spacingX:40,spacingY:40,minSize:4,maxSize:4,stagger:false,jitter:0,shape:'hexagon',targetShape:'triangle'};
const centerGlyph=(s:Settings)=>generatePattern(s).glyphs.find(g=>g.x>80&&g.x<120&&g.y>80&&g.y<120)!;
describe('第一階段：多方向向量變形',()=>{
  it('水平及垂直均在五個網格位置產生 0/25/50/75/100% 連續比例',()=>{
    for(const direction of ['horizontal','vertical'] as const){
      const p=generatePattern({...base,morphDirection:direction});const row=p.glyphs.filter(g=>direction==='horizontal'?g.y===100:g.x===100);
      expect(row.map(g=>g.morphT)).toEqual([0,.25,.5,.75,1]);
      expect(new Set(row.map(g=>g.d)).size).toBe(5);
    }
  });
  it('自訂斜線使用位置投影並完整保留兩端',()=>{
    const s={...base,morphDirection:'custom' as const,morphStart:{x:.1,y:.1},morphEnd:{x:.9,y:.9}};
    for(const t of [0,.25,.5,.75,1])expect(morphValue(20+160*t,s,40,20+160*t)).toBeCloseTo(t,10);
    const p=generatePattern(s);expect(p.glyphs.find(g=>g.x===20&&g.y===20)?.morphT).toBe(0);expect(p.glyphs.find(g=>g.x===180&&g.y===180)?.morphT).toBe(1);
  });
  it('0～100% 控制可固定中間形態或反向變形',()=>{
    expect(generatePattern({...base,morphRangeStart:50,morphRangeEnd:50}).glyphs.every(g=>g.morphT===.5)).toBe(true);
    expect(generatePattern({...base,morphRangeStart:0,morphRangeEnd:0}).glyphs.every(g=>g.morphT===0)).toBe(true);
    const p=generatePattern({...base,morphRangeStart:100,morphRangeEnd:0});expect(p.glyphs.filter(g=>g.y===100).map(g=>g.morphT)).toEqual([1,.75,.5,.25,0]);
  });
  it('起終旋轉實際旋轉輪廓頂點',()=>{
    const s={...base,rotationGradient:true,rotationStart:0,rotationEnd:90};const p=generatePattern(s);
    const left=p.glyphs.find(g=>g.x===20&&g.y===100)!,middle=p.glyphs.find(g=>g.x===100&&g.y===100)!,right=p.glyphs.find(g=>g.x===180&&g.y===100)!;
    expect([left.rotation,middle.rotation,right.rotation]).toEqual([0,45,90]);
    const noRotation=generatePattern(base).glyphs.find(g=>g.x===180&&g.y===100)!;
    right.points.forEach((v,i)=>{const q=noRotation.points[i];expect(v.x-right.x).toBeCloseTo(-(q.y-noRotation.y),2);expect(v.y-right.y).toBeCloseTo(q.x-noRotation.x,2);});
  });
  it('端點尺寸使用自己的尺寸場，不被形狀方向或比例改變',()=>{
    const s={...base,endpointSize:true,sizeStart:4,sizeEnd:20};const a=generatePattern(s),b=generatePattern({...s,morphDirection:'vertical',morphRangeStart:30,morphRangeEnd:70});
    expect(a.glyphs.map(g=>g.size)).toEqual(b.glyphs.map(g=>g.size));
    a.glyphs.forEach(g=>expect(g.size).toBeCloseTo(4+16*fieldValue(g.x,g.y,s),10));
  });
  it('兩個自訂控制點重合不產生 NaN 或不封閉輪廓',()=>{
    const p=generatePattern({...base,morphDirection:'custom',morphStart:{x:.5,y:.5},morphEnd:{x:.5,y:.5}});
    expect(p.glyphs.length).toBeGreaterThan(0);expect(p.glyphs.every(g=>!g.d.includes('NaN')&&g.d.endsWith('Z'))).toBe(true);
  });
});
describe('第一階段：不規則幾何運算',()=>{
  const random={...base,mode:'irregular' as const,jitter:80,randomRotation:70,randomSize:60,randomDensity:35,randomness:100};
  it('相同 Seed 完整重現，不同 Seed 改變位置、尺寸與旋轉',()=>{
    expect(generatePattern(random)).toEqual(generatePattern(random));
    const a=generatePattern(random),b=generatePattern({...random,seed:random.seed+1});expect(a).not.toEqual(b);
    expect(a.glyphs.map(g=>g.rotation)).not.toEqual(b.glyphs.map(g=>g.rotation));expect(a.glyphs.map(g=>g.size)).not.toEqual(b.glyphs.map(g=>g.size));
  });
  it('0% 混合回到規則網格及固定尺寸，沒有隨機旋轉',()=>{
    const a=generatePattern({...random,randomness:0}),b=generatePattern({...random,randomness:0,seed:9876});
    expect(a).toEqual(b);expect(a.glyphs).toHaveLength(25);expect(a.glyphs.every(g=>g.size===4&&g.rotation===0&&g.randomT===0)).toBe(true);
  });
  it('位置、旋轉與尺寸在混合量 0/50/100% 間連續插值',()=>{
    const s={...random,mode:'horizontal' as const,randomDensity:0};
    const a=centerGlyph({...s,randomness:0}),b=centerGlyph({...s,randomness:50}),c=centerGlyph({...s,randomness:100});
    expect(b.x).toBeCloseTo((a.x+c.x)/2,10);expect(b.y).toBeCloseTo((a.y+c.y)/2,10);expect(b.size).toBeCloseTo((a.size+c.size)/2,10);expect(b.rotation).toBeCloseTo((a.rotation+c.rotation)/2,10);
  });
  it('隨機參數各有獨立 Seed 通道與實際幾何結果',()=>{
    const g=centerGlyph({...base,jitter:50,randomRotation:80,randomSize:60});
    expect(g.x).toBeCloseTo(100+(hash(2,2,base.seed+1)-.5)*40*.5,10);
    expect(g.rotation).toBeCloseTo((hash(2,2,base.seed+4)*2-1)*80,10);
    expect(g.size).toBeCloseTo(4*(1+(hash(2,2,base.seed+3)*2-1)*.6),10);
  });
  it('方向場由起點規則排列，朝終點增加隨機性',()=>{
    const s={...random,randomEnvelope:'directional' as const,start:{x:.1,y:.5},end:{x:.9,y:.5}};
    expect(randomWeight(20,100,s)).toBe(0);expect(randomWeight(180,100,s)).toBe(1);expect(randomWeight(100,100,s)).toBeCloseTo(.5);
  });
  it('中心密集、外圍稀疏，同時增加位置擾動',()=>{
    const s={...random,randomEnvelope:'radial' as const,densityMode:'radial' as const,randomDensity:0,center:{x:.5,y:.5},radius:.4};
    expect(randomWeight(100,100,s)).toBe(0);expect(randomWeight(180,100,s)).toBe(1);
    expect(densityProbability(100,100,s)).toBe(1);expect(densityProbability(180,100,s)).toBeCloseTo(.15);
  });
  it('密度方向獨立於形狀方向，隨機密度以幾何移除元素',()=>{
    const s={...base,densityMode:'directional' as const,densityStart:100,densityEnd:0};
    expect(densityProbability(0,100,s)).toBe(1);expect(densityProbability(200,100,s)).toBe(0);
    expect(generatePattern({...random,randomDensity:100}).glyphs.length).toBeLessThan(generatePattern({...random,randomDensity:0}).glyphs.length);
    expect(densityProbability(80,80,s)).toEqual(densityProbability(80,80,{...s,morphDirection:'vertical'}));
  });
});
describe('第一階段：控制點與儲存',()=>{
  it.each(['start','end','morphStart','morphEnd','center','radius','randomness'] as ControlKey[])('%s 控制點產生有效參數',key=>{
    const s={...base,randomEnvelope:'radial' as const};const patch=controlPatch(s,key,{x:.8,y:.7}),next={...s,...patch};
    expect(parseProject(projectJSON(next))).toEqual(next);expect(controlPositions(next)[key]).toBeTruthy();
  });
  it('中心與半徑拖曳實際改變中心密度場，非裝飾點',()=>{
    const s={...base,densityMode:'radial' as const};const before=generatePattern(s);
    const moved={...s,...controlPatch(s,'center',{x:.2,y:.2})};expect(generatePattern(moved)).not.toEqual(before);
    const resized={...s,...controlPatch(s,'radius',{x:.95,y:.5})};expect(resized.radius).not.toBe(s.radius);expect(generatePattern(resized)).not.toEqual(before);
  });
  it('不規則點拖曳以距離改變隨機強度',()=>{
    const s={...base,jitter:70,randomness:0};const patch=controlPatch(s,'randomness',{x:.7,y:.5});
    expect(patch.randomness).toBeCloseTo(50);expect(generatePattern({...s,...patch})).not.toEqual(generatePattern(s));
  });
  it('v2 JSON 還原所有新增參數與控制點',()=>{
    const s={...base,morphDirection:'custom' as const,morphStart:{x:.2,y:.1},morphEnd:{x:.9,y:.6},randomRotation:44,randomSize:56,randomDensity:22,randomEnvelope:'radial' as const,rotationGradient:true,rotationStart:-30,rotationEnd:75,endpointSize:true,sizeStart:8,sizeEnd:17};
    expect(parseProject(projectJSON(s))).toEqual(s);expect(generatePattern(parseProject(projectJSON(s)))).toEqual(generatePattern(s));
  });
  it('舊 v1 專案自動補入新欄位，保留原有參數',()=>{
    const keys='shape targetShape morph morphAmount width height spacingX spacingY minSize maxSize density rotation aspect mode start end falloff reverse stagger jitter noiseScale seed foreground background opacity'.split(' ');
    const legacy=Object.fromEntries(keys.map(k=>[k,base[k as keyof Settings]]));const restored=parseProject(JSON.stringify({app:'cmf-pattern-studio',version:1,settings:legacy}));
    expect(restored).toEqual(base);
  });
  it('拒絕無效 v2 參數與未來格式',()=>{
    const doc=JSON.parse(projectJSON(base));doc.settings.randomSize=1000;expect(()=>parseProject(JSON.stringify(doc))).toThrow();
    doc.version=7;expect(()=>parseProject(JSON.stringify(doc))).toThrow();
  });
  it('舊版寬畫布的超出畫布半徑可完整遷移',()=>{
    const doc=JSON.parse(projectJSON({...base,width:2400,height:200,mode:'radial',start:{x:.5,y:.5},end:{x:1,y:.5}}));doc.version=1;delete doc.settings.center;delete doc.settings.radius;
    const restored=parseProject(JSON.stringify(doc));expect(restored.radius).toBe(6);expect(fieldValue(2400,100,restored)).toBeCloseTo(0);expect(parseProject(projectJSON(restored))).toEqual(restored);
  });
  it('SVG 只含向量幾何，不含控制點、UI 線或來源圖片',()=>{
    const s={...base,morphDirection:'custom' as const,randomRotation:30,jitter:50};const p=generatePattern(s),svg=svgDocument(s,p);
    expect((svg.match(/<path /g)||[])).toHaveLength(p.glyphs.length);expect(svg).not.toMatch(/<image|control-handle|<line|var\(--ui/);expect(svg).toContain(p.glyphs[0].d);
  });
});
