import { shapeContours, type Settings } from '../engine';
import type { StitchShape } from './model';
import {unionTouchingCells} from './join';
import { bounds, filledGeometry, mergeGeometry } from '../custom/geometry';
/** Boolean union in a common local coordinate system. Shared interior edges disappear. */
export function stitchOperands(s:Settings){
 const g=s.stitch;
 const box=(shape:StitchShape,w:number,h:number)=>{const c=shapeContours(shape==='band'?'horizontal':shape,{...s,morph:false}),b=bounds(c);return c.map(r=>r.map(p=>({x:(p.x-(b.minX+b.maxX)/2)/b.width*w,y:(p.y-(b.minY+b.maxY)/2)/b.height*h})));};
 const mm=g.mergeUnits==='mm',a=box(g.shape,mm?g.width:1,mm?g.height:1),b=box(g.mergeShape,g.mergeWidth/(mm?1:100),g.mergeHeight/(mm?1:100)),ab=bounds(a),bb=bounds(b);let dx=g.mergeOffsetX/(mm?1:100),dy=g.mergeOffsetY/(mm?1:100);
 if(g.mergeAlign!=='center'){const lead=g.mergeAlign==='start';if(g.mergeAxis==='horizontal')dx+=(lead?ab.minX-bb.minX:ab.maxX-bb.maxX);else dy+=(lead?ab.minY-bb.minY:ab.maxY-bb.maxY);}
 return [a,b.map(r=>r.map(p=>({x:p.x+dx,y:p.y+dy})))] as const;
}

export function mergedStitchContours(s:Settings){if(!s.stitch.mergeEnabled){if(s.stitch.mergeUnits==='mm')return stitchOperands(s)[0];return shapeContours(s.stitch.shape==='band'?'horizontal':s.stitch.shape,{...s,morph:false});}const [a,b]=stitchOperands(s);return s.stitch.mergeUnits==='mm'?unionTouchingCells([...mergeGeometry([filledGeometry(a)]),...mergeGeometry([filledGeometry(b)])]):mergeGeometry([filledGeometry(a),filledGeometry(b)]);}
