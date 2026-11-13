import { hash, type Point } from '../engine';
import type { StitchSettings } from './model';
/** Periodic cellular grooves, sized in mm; 6×6 cells repeat with matched boundaries. */
export function fineLeatherPattern(g:StitchSettings){const size=g.grainSize*96/25.4,tile=size*6,mod=(v:number)=>(v%6+6)%6,site=(x:number,y:number)=>({x:x+.15+.7*hash(mod(x),mod(y),7),y:y+.15+.7*hash(mod(x),mod(y),19)}),paths:string[]=[];
 for(let y=-1;y<=6;y++)for(let x=-1;x<=6;x++){const a=site(x,y);let ring:Point[]=[{x:a.x-2,y:a.y-2},{x:a.x+2,y:a.y-2},{x:a.x+2,y:a.y+2},{x:a.x-2,y:a.y+2}];
 for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){if(!xx&&!yy)continue;const b=site(x+xx,y+yy),nx=b.x-a.x,ny=b.y-a.y,k=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2,out:Point[]=[];for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],dp=p.x*nx+p.y*ny-k,dq=q.x*nx+q.y*ny-k;if(dp<=1e-8)out.push(p);if((dp<0)!==(dq<0)){const t=dp/(dp-dq);out.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});}}ring=out;}
 if(ring.length>=3)paths.push('M'+ring.map(p=>`${(p.x*size).toFixed(3)},${(p.y*size).toFixed(3)}`).join('L')+'Z');}
 const d=paths.join(''),angle=g.lightAngle*Math.PI/180,dx=-Math.cos(angle)*size*.04,dy=-Math.sin(angle)*size*.04;
 return`<pattern id="stitch-fine-leather" patternUnits="userSpaceOnUse" width="${tile}" height="${tile}"><path d="${d}" fill="none" stroke="black" stroke-width="${size*.055}" opacity=".65"/><path d="${d}" transform="translate(${dx} ${dy})" fill="none" stroke="white" stroke-width="${size*.028}" opacity=".4"/></pattern>`;
}
