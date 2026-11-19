import {simplifyContour} from '../custom/contours';
import { shapeContours, type Settings } from '../engine';
import type { StitchShape } from './model';
import {unionTouchingCells} from './join';
import { bounds, filledGeometry, mergeGeometry } from '../custom/geometry';
/** Remove subpixel raster stair steps before scaling them into millimetres.
 * Saved geometry is left intact; vector SVG/DWG corners are never simplified. */
export function stitchShapeContours(shape:StitchShape,s:Settings){
 const custom=s.customShapes.find(c=>c.id===shape);
 const resolve=(settings:Settings)=>shapeContours(shape==='band'?'horizontal':shape==='bandVertical'?'vertical':shape,{...settings,morph:false});
 if(!custom||!['PNG','JPEG'].includes(custom.source))return resolve(s);
 const contours=custom.contours.map(r=>{const b=bounds([r]),epsilon=1.3/Math.min(768,Math.max(custom.sourceWidth,custom.sourceHeight));if(Math.min(b.width,b.height)<epsilon*8)return r;const clean=simplifyContour(r,epsilon);return clean.length>=3?clean:r;});
 return resolve({...s,customShapes:s.customShapes.map(c=>c===custom?{...c,contours}:c)});
}
export function rotateStitchContours(rings:ReturnType<typeof stitchShapeContours>,degrees:number){if(!degrees)return rings;const angle=degrees*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);return rings.map(r=>r.map(p=>({x:p.x*c-p.y*s,y:p.x*s+p.y*c})));}
/** Boolean union in a common local coordinate system. Shared interior edges disappear. */
export function stitchOperands(s:Settings){
 const g=s.stitch;
 const box=(shape:StitchShape,w:number,h:number)=>{const c=stitchShapeContours(shape,s),b=bounds(c);return c.map(r=>r.map(p=>({x:(p.x-(b.minX+b.maxX)/2)/Math.max(b.width,1e-9)*w,y:(p.y-(b.minY+b.maxY)/2)/Math.max(b.height,1e-9)*h})));};
 const mm=g.mergeUnits==='mm',a=rotateStitchContours(box(g.shape,mm?g.width:1,mm?g.height:1),g.shapeRotation??0),b=rotateStitchContours(box(g.mergeShape,g.mergeWidth/(mm?1:100),g.mergeHeight/(mm?1:100)),g.mergeRotation??0),ab=bounds(a),bb=bounds(b);let dx=g.mergeOffsetX/(mm?1:100),dy=g.mergeOffsetY/(mm?1:100);
 if(g.mergeAlign!=='center'){const lead=g.mergeAlign==='start';if(g.mergeAxis==='horizontal')dx+=(lead?ab.minX-bb.minX:ab.maxX-bb.maxX);else dy+=(lead?ab.minY-bb.minY:ab.maxY-bb.maxY);}
 return [a,b.map(r=>r.map(p=>({x:p.x+dx,y:p.y+dy})))] as const;
}

export function mergedStitchContours(s:Settings){if(!s.stitch.mergeEnabled){if(s.stitch.mergeUnits==='mm')return stitchOperands(s)[0];return rotateStitchContours(stitchShapeContours(s.stitch.shape,s),s.stitch.shapeRotation??0);}const [a,b]=stitchOperands(s);return s.stitch.mergeUnits==='mm'?unionTouchingCells([...mergeGeometry([filledGeometry(a)]),...mergeGeometry([filledGeometry(b)])]):mergeGeometry([filledGeometry(a),filledGeometry(b)]);}
