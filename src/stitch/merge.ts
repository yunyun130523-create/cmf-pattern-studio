import { shapeContours, type Settings, type Shape } from '../engine';
import { bounds, filledGeometry, mergeGeometry } from '../custom/geometry';
/** Boolean union in a common local coordinate system. Shared interior edges disappear. */
export function mergedStitchContours(s:Settings){
 const g=s.stitch,base=shapeContours(g.shape,{...s,shape:g.shape,morph:false});if(!g.mergeEnabled)return base;
 const box=(shape:Shape,w:number,h:number)=>{const c=shapeContours(shape,{...s,shape,morph:false}),b=bounds(c);return c.map(r=>r.map(p=>({x:(p.x-(b.minX+b.maxX)/2)/b.width*w,y:(p.y-(b.minY+b.maxY)/2)/b.height*h})));};
 const a=box(g.shape,1,1),b=box(g.mergeShape,g.mergeWidth/100,g.mergeHeight/100),ab=bounds(a),bb=bounds(b);let dx=g.mergeOffsetX/100,dy=g.mergeOffsetY/100;
 if(g.mergeAlign!=='center'){const lead=g.mergeAlign==='start';if(g.mergeAxis==='horizontal')dx+=(lead?ab.minX-bb.minX:ab.maxX-bb.maxX);else dy+=(lead?ab.minY-bb.minY:ab.maxY-bb.maxY);}
 return mergeGeometry([filledGeometry(a),filledGeometry(b.map(r=>r.map(p=>({x:p.x+dx,y:p.y+dy}))))]);
}
