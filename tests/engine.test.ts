import { describe, expect, it } from 'vitest';
import DxfParser from 'dxf-parser';
import { DEFAULTS, MODES, PRESETS, SHAPES, MORPH_VERTEX_COUNT, fieldValue, generatePattern, morphValue, outline, parseProject, presetSettings, projectJSON, svgDocument } from '../src/engine';
import { cadContours, dxfDocument } from '../src/exports';
const small={...DEFAULTS,width:240,height:200,spacingX:20,spacingY:20};
describe('shape geometry',()=>{
  it.each(SHAPES)('%s has finite closed outline samples',shape=>{
    const points=outline(shape,2.3);expect(points).toHaveLength(MORPH_VERTEX_COUNT);
    points.forEach(p=>{expect(Number.isFinite(p.x)).toBe(true);expect(Number.isFinite(p.y)).toBe(true);expect(Math.abs(p.x)).toBeLessThanOrEqual(.50001);});
  });
  it('circle to triangle, rectangle and hexagon morphs are distinct and finite',()=>{
    const circle=generatePattern({...small,morph:false});
    for(const targetShape of ['triangle','rectangle','hexagon'] as const){
      const result=generatePattern({...small,targetShape,morph:true,morphAmount:100});
      expect(result.glyphs.map(g=>g.d)).not.toEqual(circle.glyphs.map(g=>g.d));
      expect(result.glyphs.some(g=>g.d.includes('NaN')||g.d.includes('Infinity'))).toBe(false);
    }
  });
  it('zero linearity still morphs continuously and keeps complete endpoints',()=>{
    expect(morphValue(small.spacingX/2,{...small,morphAmount:0})).toBe(0);
    expect(morphValue(small.width-small.spacingX/2,{...small,morphAmount:0})).toBe(1);
    expect(generatePattern({...small,morphAmount:0}).glyphs.some(g=>g.morphT>0&&g.morphT<1)).toBe(true);
  });
});
describe('gradient and deterministic generation',()=>{
  it.each(MODES)('%s produces finite gradients',mode=>{
    const result=generatePattern({...small,mode,jitter:100});
    expect(result.glyphs.length).toBeGreaterThan(0);
    result.glyphs.forEach(g=>{expect(g.t).toBeGreaterThanOrEqual(0);expect(g.t).toBeLessThanOrEqual(1);expect(g.size).toBeGreaterThanOrEqual(small.minSize);expect(g.size).toBeLessThanOrEqual(small.maxSize);});
  });
  it('linear field maps endpoints to zero and one',()=>{
    expect(fieldValue(small.start.x*small.width,small.start.y*small.height,small)).toBeCloseTo(0);
    expect(fieldValue(small.end.x*small.width,small.end.y*small.height,small)).toBeCloseTo(1);
  });
  it('radial field is largest at center and zero at radius',()=>{
    const s={...small,mode:'radial' as const};
    expect(fieldValue(s.center.x*s.width,s.center.y*s.height,s)).toBeCloseTo(1);
    expect(fieldValue(s.center.x*s.width+s.radius*Math.min(s.width,s.height),s.center.y*s.height,s)).toBeCloseTo(0);
  });
  it('reverses the field and safely handles coincident points',()=>{
    expect(fieldValue(100,80,{...small,reverse:true})).toBeCloseTo(1-fieldValue(100,80,small));
    expect(Number.isFinite(fieldValue(100,80,{...small,end:small.start}))).toBe(true);
  });
  it('same seed reproduces irregular pattern and changed seed changes it',()=>{
    const s={...small,mode:'irregular' as const,jitter:50,density:70};
    expect(generatePattern(s)).toEqual(generatePattern(s));
    expect(generatePattern({...s,seed:s.seed+1})).not.toEqual(generatePattern(s));
  });
  it('density zero is empty and increasing density does not reduce count',()=>{
    expect(generatePattern({...small,density:0}).glyphs).toHaveLength(0);
    expect(generatePattern({...small,density:0,seed:0}).glyphs).toHaveLength(0);
    expect(generatePattern({...small,density:40}).glyphs.length).toBeLessThan(generatePattern({...small,density:100}).glyphs.length);
  });
  it('limits extreme density without changing export geometry',()=>{
    const s={...DEFAULTS,width:2400,height:1800,spacingX:7,spacingY:7};const p=generatePattern(s);
    expect(p.limited).toBe(true);expect(p.glyphs.length).toBeLessThanOrEqual(12150);
    const svg=svgDocument(s,p);expect((svg.match(/<path /g)||[]).length).toBe(p.glyphs.length);
  });
  it.each(PRESETS)('preset $id is a valid restorable project',p=>{
    const settings=presetSettings(p);expect(parseProject(projectJSON(settings))).toEqual(settings);
  });
});
describe('file integrity',()=>{
  it('round-trips every parameter, including control points',()=>{expect(parseProject(projectJSON(DEFAULTS))).toEqual(DEFAULTS);});
  it.each([
    {foreground:'url(https://invalid.example)'},{width:Infinity},{spacingX:0},{seed:-1},{seed:1.5},{start:{x:2,y:0}},{minSize:30,maxSize:5},{shape:'script'},{density:101}
  ])('rejects unsafe or invalid settings %j',patch=>{expect(()=>parseProject(JSON.stringify({app:'cmf-pattern-studio',version:1,settings:{...DEFAULTS,...patch}}))).toThrow();});
  it('rejects unrelated JSON and unknown versions',()=>{expect(()=>parseProject('{}')).toThrow();expect(()=>parseProject('{"app":"cmf-pattern-studio","version":2,"settings":{}}')).toThrow();});
  it('SVG is valid XML with exact preview paths and no controls',()=>{
    const p=generatePattern(small),svg=svgDocument(small,p),doc=new DOMParser().parseFromString(svg,'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();expect(doc.querySelectorAll('path')).toHaveLength(p.glyphs.length);
    expect(doc.querySelector('path')?.getAttribute('d')).toBe(p.glyphs[0].d);expect(doc.querySelector('g')?.getAttribute('fill')).toBe(small.foreground);
    expect(svg).not.toContain('control-handle');
  });
  it('DXF independently parses all closed paths and uses mm conversion',()=>{
    const p=generatePattern(small),parser=new DxfParser(),doc=parser.parseSync(dxfDocument(small,p,'mm'))!;
    expect(doc.entities).toHaveLength(p.glyphs.length+1);expect(doc.entities[0].type).toBe('LWPOLYLINE');
    const boundary=doc.entities[0] as unknown as {vertices:{x:number;y:number}[];shape:boolean};
    expect(boundary.vertices[1].x).toBeCloseTo(small.width*25.4/96,5);expect(boundary.shape).toBe(true);
    const contours=cadContours(small,p,'mm');expect(contours[0][0].y).toBeCloseTo((small.height-p.glyphs[0].points[0].y)*25.4/96,5);
  });
});
