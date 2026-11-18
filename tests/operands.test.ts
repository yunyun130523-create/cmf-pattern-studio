import {describe,it,expect} from 'vitest';
import {DEFAULTS,outline,patternContours,generatePattern,projectJSON,parseProject,svgDocument} from '../src/engine';
import {bounds,signedArea,selfIntersects} from '../src/custom/geometry';
import {DEFAULT_PROPORTION} from '../src/proportions/model';
const settings={...DEFAULTS,shape:'horizontal' as const,targetShape:'vertical' as const,combine:true,morph:false,aspect:3,width:200,height:200,spacingX:40,spacingY:40,minSize:18,maxSize:18};
describe('並列相加圖形',()=>{
 it('橫豎長方形有真正不同的方向與完整四角',()=>{const h=bounds([outline('horizontal',3)]),v=bounds([outline('vertical',3)]);expect(h.width/h.height).toBeCloseTo(3);expect(v.height/v.width).toBeCloseTo(3);expect(Math.abs(signedArea(outline('vertical',3)))).toBeCloseTo(1/3,10);});
 it('橫加豎為單一十字外輪廓，重疊部分沒有內部邊線',()=>{const c=patternContours(settings);expect(c).toHaveLength(1);expect(selfIntersects(c[0])).toBe(false);expect(Math.abs(signedArea(c[0]))).toBeCloseTo(2/3-1/9,7);expect(bounds(c).width).toBeCloseTo(1);expect(bounds(c).height).toBeCloseTo(1);});
 it('兩端比例獨立，向量與 JSON 還原保留真實聯集',()=>{const s={...settings,proportions:{start:{horizontal:{...DEFAULT_PROPORTION,x:180,y:60,locked:false}},end:{vertical:{...DEFAULT_PROPORTION,x:70,y:220,locked:false}}}};const pattern=generatePattern(s),svg=svgDocument(s,pattern);expect(pattern.glyphs.length).toBeGreaterThan(0);expect(svg).toContain('<path');expect(svg).not.toContain('<image');expect(parseProject(projectJSON(s))).toEqual(s);expect(generatePattern(parseProject(projectJSON(s)))).toEqual(pattern);expect(bounds(patternContours(s)).width).toBeCloseTo(1.8);expect(bounds(patternContours(s)).height).toBeCloseTo(2.2);});
 it('舊 JSON 保留原 Morph，相加開啟後優先採用聯集',()=>{const old=JSON.parse(projectJSON(DEFAULTS));delete old.settings.combine;expect(parseProject(JSON.stringify(old)).combine).toBe(false);expect(parseProject(JSON.stringify(old)).morph).toBe(DEFAULTS.morph);expect(generatePattern({...settings,morph:true})).toEqual(generatePattern(settings));});
});
