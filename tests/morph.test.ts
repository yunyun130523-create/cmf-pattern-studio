import { describe, expect, it } from 'vitest';
import { DEFAULTS, MORPH_VERTEX_COUNT, SHAPES, generatePattern, interpolateOutline, morphValue, outline, svgDocument, type Point } from '../src/engine';
const area=(points:Point[])=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.y-q.x*p.y;},0))/2;
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function selfIntersects(points:Point[]):boolean {
  for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++) {
    if(i===0&&j===points.length-1)continue;
    const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
    if(cross(a,b,c)*cross(a,b,d)<-1e-16&&cross(c,d,a)*cross(c,d,b)<-1e-16)return true;
  }
  return false;
}
const specimen={...DEFAULTS,width:200,height:200,spacingX:40,spacingY:40,minSize:18,maxSize:18,shape:'hexagon' as const,targetShape:'triangle' as const,morph:true,morphAmount:100,stagger:false,jitter:0};
describe('exact geometric shape morphing',()=>{
  it('uses consistent vertex count, ray correspondence and winding for every shape',()=>{
    for(const aspect of [1,2.3,5]) {
      const shapes=SHAPES.map(shape=>outline(shape,aspect));
      shapes.forEach(points=>expect(points).toHaveLength(MORPH_VERTEX_COUNT));
      for(let k=1;k<shapes.length;k++)for(let i=0;i<MORPH_VERTEX_COUNT;i++){
        const a=shapes[0][i],b=shapes[k][i];expect(Math.abs(a.x*b.y-a.y*b.x)).toBeLessThan(1e-12);
        expect(a.x*b.x+a.y*b.y).toBeGreaterThan(0);
      }
    }
  });
  it('preserves all polygon endpoint areas, including rectangle corners at any ratio',()=>{
    for(const aspect of [1,1.1,2.3,5]){
      const expected={triangle:3*Math.sqrt(3)/16,hexagon:3*Math.sqrt(3)/8,square:1,diamond:.5,rectangle:1/aspect};
      for(const shape of Object.keys(expected) as (keyof typeof expected)[])expect(area(outline(shape,aspect))).toBeCloseTo(expected[shape],10);
      const rect=outline('rectangle',aspect);
      for(const x of [-.5,.5])for(const y of [-.5/aspect,.5/aspect])expect(rect.some(p=>Math.hypot(p.x-x,p.y-y)<1e-10)).toBe(true);
    }
  });
  it('0%, 25%, 50%, 75% and 100% are true weighted intermediate vertices',()=>{
    const from=outline('hexagon',2.3),to=outline('triangle',2.3);
    expect(interpolateOutline(from,to,0)).toEqual(from);expect(interpolateOutline(from,to,1)).toEqual(to);
    for(const t of [.25,.5,.75]) {
      const points=interpolateOutline(from,to,t);expect(points).not.toEqual(from);expect(points).not.toEqual(to);
      points.forEach((p,i)=>{expect(p.x).toBeCloseTo(from[i].x*(1-t)+to[i].x*t,12);expect(p.y).toBeCloseTo(from[i].y*(1-t)+to[i].y*t,12);});
    }
  });
  it.each(SHAPES)('%s morphs to all targets without self-intersections',source=>{
    for(const target of SHAPES)for(const aspect of [1,2.3,5]){
      const a=outline(source,aspect),b=outline(target,aspect);
      for(let i=0;i<=20;i++){const points=interpolateOutline(a,b,i/20);expect(selfIntersects(points)).toBe(false);expect(area(points)).toBeGreaterThan(.04);}
    }
  });
  it('every vertex moves continuously through the old switching boundary',()=>{
    const a=outline('hexagon',2.3),b=outline('triangle',2.3),epsilon=1e-5;
    for(const t of [.01,.25,.5,.75,.99]) {
      const p=interpolateOutline(a,b,t-epsilon),q=interpolateOutline(a,b,t+epsilon);
      p.forEach((v,i)=>expect(Math.hypot(q[i].x-v.x,q[i].y-v.y)).toBeLessThanOrEqual(2*epsilon*Math.hypot(b[i].x-a[i].x,b[i].y-a[i].y)+1e-12));
    }
  });
});
describe('per-element horizontal morph field',()=>{
  it('produces complete hexagon, 25%, 50%, 75%, complete triangle in each row',()=>{
    const pattern=generatePattern(specimen),from=outline('hexagon',specimen.aspect),to=outline('triangle',specimen.aspect);
    const row=pattern.glyphs.filter(g=>g.y===100);expect(row).toHaveLength(5);
    row.forEach((g,i)=>{
      expect(g.morphT).toBe(i/4);const expected=interpolateOutline(from,to,i/4);
      g.points.forEach((p,k)=>{expect((p.x-g.x)/g.size).toBeCloseTo(expected[k].x,4);expect((p.y-g.y)/g.size).toBeCloseTo(expected[k].y,4);});
    });
    expect(new Set(pattern.glyphs.filter(g=>g.x===100).map(g=>g.morphT))).toEqual(new Set([.5]));
  });
  it('shape progress is independent of size-field mode, noise, falloff and seed',()=>{
    const baseline=generatePattern(specimen).glyphs.map(g=>g.morphT);
    for(const mode of ['horizontal','vertical','radial','irregular'] as const) {
      const pattern=generatePattern({...specimen,mode,falloff:3,seed:123,reverse:true,start:{x:.9,y:.1},end:{x:.1,y:.9}});
      expect(pattern.glyphs.map(g=>g.morphT)).toEqual(baseline);
    }
  });
  it('all curve settings preserve exact endpoints and strictly increasing progress',()=>{
    for(const morphAmount of [0,25,50,75,100]){
      const s={...specimen,morphAmount};const values=[20,60,100,140,180].map(x=>morphValue(x,s));
      expect(values[0]).toBe(0);expect(values[4]).toBe(1);
      for(let i=1;i<values.length;i++)expect(values[i]).toBeGreaterThan(values[i-1]);
    }
  });
  it('turning morph off produces only the source outline',()=>{
    const p=generatePattern({...specimen,morph:false});expect(p.glyphs.every(g=>g.morphT===0)).toBe(true);
    const source=outline('hexagon',specimen.aspect);p.glyphs.forEach(g=>g.points.forEach((v,i)=>expect((v.x-g.x)/g.size).toBeCloseTo(source[i].x,4)));
  });
  it('SVG exports one actual interpolated path per element, without cross-fading',()=>{
    const p=generatePattern(specimen),svg=svgDocument(specimen,p);
    expect((svg.match(/<path /g)||[])).toHaveLength(p.glyphs.length);expect(svg).toContain(`d="${p.glyphs.find(g=>g.morphT===.5)!.d}"`);
    expect(svg).not.toContain('<use');expect(svg).not.toContain('opacity="0.5"');
  });
});
