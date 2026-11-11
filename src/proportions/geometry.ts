import type { Point, Shape } from '../engine';
import type { ShapeProportions } from './model';
/** Geometry is transformed in local X/Y axes, then rotated around the pattern origin. */
export function proportionalContours(source:Point[][],shape:Shape,aspect:number,p:ShapeProportions):Point[][]{
 let contours=source;
 if(shape==='triangle'){
  const ring=[{x:p.apexX/100*Math.sqrt(3)/4,y:-.5+p.apexY/100*.3},{x:Math.sqrt(3)/4*p.triangleBase/100,y:.25},{x:-Math.sqrt(3)/4*p.triangleBase/100,y:.25}];
  // The centroid remains at the glyph origin, which also guarantees safe radial morph sampling.
  const cx=ring.reduce((n,q)=>n+q.x,0)/3,cy=ring.reduce((n,q)=>n+q.y,0)/3;contours=[ring.map(q=>({x:q.x-cx,y:q.y-cy}))];
 }else if(shape==='hexagon'){
  const offset=p.hexDirection==='flat'?0:-Math.PI/6;contours=[Array.from({length:6},(_,i)=>({x:.5*Math.cos(offset+i*Math.PI/3),y:.5*Math.sin(offset+i*Math.PI/3)}))];
 }else if((shape==='square'||shape==='rectangle')&&p.corner>0){
  const w=1,h=shape==='rectangle'?1/aspect:1,r=Math.min(w,h)*p.corner/100;
  const centers=[{x:w/2-r,y:-h/2+r},{x:w/2-r,y:h/2-r},{x:-w/2+r,y:h/2-r},{x:-w/2+r,y:-h/2+r}];
  const ring:Point[]=[];centers.forEach((center,k)=>{for(let i=0;i<=16;i++){const a=-Math.PI/2+k*Math.PI/2+i*Math.PI/32,q={x:center.x+r*Math.cos(a),y:center.y+r*Math.sin(a)};if(!ring.length||Math.hypot(q.x-ring.at(-1)!.x,q.y-ring.at(-1)!.y)>1e-10)ring.push(q);}});if(Math.hypot(ring[0].x-ring.at(-1)!.x,ring[0].y-ring.at(-1)!.y)<1e-10)ring.pop();contours=[ring];
 }
 const a=p.rotation*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);
 return contours.map(ring=>ring.map(q=>{const x=q.x*p.x/100,y=q.y*p.y/100;return{x:x*c-y*sn,y:x*sn+y*c};}));
}
