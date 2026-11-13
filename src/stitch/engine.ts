import { joinCellGroups,unionTouchingCells } from './join';
import { filletRing,cleanSeamNetwork,joinedSeamPaths,doubleSeamPaths,colorSeamSides } from './paths';
import { stitchSurface } from './Surface';
import { mergedStitchContours } from './merge';
import { composeStitchPattern } from './pattern';
import { hash, type Settings, type Point } from '../engine';
import type { StitchSettings } from './model';
const px=96/25.4,n=(v:number)=>Number(v.toFixed(3));
export interface Seam {a:Point;b:Point}
export function stitchGeometry(width:number,height:number,g:StitchSettings,settings?:Settings){
 const w=g.width*px,h=g.height*px,extent=Math.hypot(width,height)*.6+Math.max(w,h),cx=width/2,cy=height/2,cells:Point[][]=[];
 const add=(source:Point[])=>{const input=source,points=input.filter((p,i)=>Math.hypot(p.x-input[(i+input.length-1)%input.length].x,p.y-input[(i+input.length-1)%input.length].y)>1e-6);if(points.length<3)return;cells.push(points);};
 if(g.layout==='hex')for(let col=Math.floor(-extent/(w*.8));col<=Math.ceil(extent/(w*.8));col++)for(let row=Math.floor(-extent/h);row<=Math.ceil(extent/h);row++){const x=cx+col*w*.8,y=cy+row*h+(col%2)*h/2;add([[-.5,0],[-.3,-.5],[.3,-.5],[.5,0],[.3,.5],[-.3,.5]].map(([a,b])=>({x:x+a*w,y:y+b*h})));}
 else if(g.layout==='square')for(let row=Math.floor(-extent/h);row<=Math.ceil(extent/h);row++)for(let col=Math.floor(-extent/w);col<=Math.ceil(extent/w);col++){const x=cx+col*w,y=cy+row*h;add([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}])}
 // Diamonds tile at half-width / half-height staggered centers.
 if(g.layout==='diamond'){cells.length=0;for(let row=Math.floor(-extent/(h/2));row<=Math.ceil(extent/(h/2));row++)for(let col=Math.floor(-extent/w);col<=Math.ceil(extent/w);col++){const x=cx+col*w+(row%2)*w/2,y=cy+row*h/2;add([{x,y:y-h/2},{x:x+w/2,y},{x,y:y+h/2},{x:x-w/2,y}]);}}
 if(g.layout==='shape'&&settings){const source=mergedStitchContours({...settings,stitch:g}),all=source.flat(),minX=Math.min(...all.map(p=>p.x)),maxX=Math.max(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y)),maxY=Math.max(...all.map(p=>p.y)),sx=w/Math.max(.001,maxX-minX),sy=h/Math.max(.001,maxY-minY),rawX=w+g.spacing*px,rawY=h+g.spacing*px,factor=Math.max(1,Math.sqrt((2*extent/rawX+3)*(2*extent/rawY+3)*all.length*(g.corner>0?8:1)/500000)),dx=rawX*factor,dy=rawY*factor;
 for(let row=Math.floor(-extent/dy);row<=Math.ceil(extent/dy);row++)for(let col=Math.floor(-extent/dx);col<=Math.ceil(extent/dx);col++){const x=cx+col*dx+(g.stagger&&row%2?dx/2:0),y=cy+row*dy;for(const contour of source)add(contour.map(p=>({x:x+(p.x-(minX+maxX)/2)*sx,y:y+(p.y-(minY+maxY)/2)*sy})));}}
 if(g.layout==='irregular'){
 const sites=new Map<string,Point>(),loX=Math.floor(-extent/w)-2,hiX=Math.ceil(extent/w)+2,loY=Math.floor(-extent/h)-2,hiY=Math.ceil(extent/h)+2;
 for(let row=loY;row<=hiY;row++)for(let col=loX;col<=hiX;col++)sites.set(col+','+row,{x:col+(hash(col,row,g.seed)-.5)*.8*g.irregularity/100,y:row+(hash(col,row,g.seed+1)-.5)*.8*g.irregularity/100});
 for(let row=loY+2;row<=hiY-2;row++)for(let col=loX+2;col<=hiX-2;col++){const a=sites.get(col+','+row)!;let polygon=[{x:a.x-2,y:a.y-2},{x:a.x+2,y:a.y-2},{x:a.x+2,y:a.y+2},{x:a.x-2,y:a.y+2}];
 for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){if(!xx&&!yy)continue;const b=sites.get((col+xx)+','+(row+yy))!,nx=b.x-a.x,ny=b.y-a.y,k=(b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2,out:Point[]=[];
 for(let i=0;i<polygon.length;i++){const p=polygon[i],q=polygon[(i+1)%polygon.length],dp=p.x*nx+p.y*ny-k,dq=q.x*nx+q.y*ny-k;if(dp<=1e-7)out.push(p);if((dp<0)!==(dq<0)){const t=dp/(dp-dq);out.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t});}}polygon=out;}if(polygon.length>=3)add(polygon.map(p=>({x:cx+p.x*w,y:cy+p.y*h})));
 }}
 const angle=g.rotation*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle),rotate=(p:Point)=>({x:n(cx+(p.x-cx)*c-(p.y-cy)*s),y:n(cy+(p.x-cx)*s+(p.y-cy)*c)});
 const sourceCells=cells.map(a=>a.map(rotate)),finalCells=(g.layout==='shape'&&g.spacing===0?unionTouchingCells(sourceCells):joinCellGroups(sourceCells,g.joinGroups)).map(c=>filletRing(c,g.corner*px));
 const finalEdges=finalCells.flatMap(c=>c.map((a,i)=>({a,b:c[(i+1)%c.length]})));
 return{cells:finalCells,sourceCells,seams:cleanSeamNetwork(finalEdges)};
}
/** Bounded miter offsets keep closed contour stitches continuous across vertices. */
export function offsetStitchRing(ring:Point[],distance:number):Point[]{return ring.map((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length],la=Math.hypot(p.x-a.x,p.y-a.y)||1,lb=Math.hypot(b.x-p.x,b.y-p.y)||1,nx=-(p.y-a.y)/la-(b.y-p.y)/lb,ny=(p.x-a.x)/la+(b.x-p.x)/lb,l=Math.hypot(nx,ny);if(l<1e-8)return p;const ux=nx/l,uy=ny/l,dot=ux*(-(b.y-p.y)/lb)+uy*((b.x-p.x)/lb),m=Math.min(2,1/Math.max(.1,Math.abs(dot)))*distance;return{x:n(p.x+ux*m),y:n(p.y+uy*m)};});}
const rowCache=new WeakMap<object,Map<string,string[]>>(),centerCache=new WeakMap<object,string>();
export function stitchThreadPaths(p:ReturnType<typeof stitchGeometry>,g:StitchSettings){const key=[g.double,g.rowGap,g.layout,g.thread!==g.thread2].join('|');let entries=rowCache.get(p);const cached=entries?.get(key);if(cached)return cached;const raw=g.double?doubleSeamPaths(p.seams,g.rowGap*px/2):[joinedSeamPaths(p.seams)],rows=g.double&&g.layout!=='shape'&&g.thread!==g.thread2?colorSeamSides(p.seams,raw,g.rowGap*px/2):raw;if(!entries){entries=new Map();rowCache.set(p,entries);}if(entries.size>=4)entries.clear();entries.set(key,rows);return rows;}


export function stitchMarkup(s:Settings,p=stitchGeometry(s.width,s.height,s.stitch,s)){const g=s.stitch,path=centerCache.get(p)??joinedSeamPaths(p.seams);centerCache.set(p,path);
 const surface=g.surface?stitchSurface(s,p.cells):null;
 const rows=stitchThreadPaths(p,g),pattern=g.patternEnabled?composeStitchPattern(s,p):null,patternLayer=pattern?`<g data-stitch-pattern="true" data-pattern-count="${pattern.glyphs.length}" data-limited="${pattern.limited}" fill="${s.foreground}" fill-rule="evenodd" opacity="${s.opacity/100}">${pattern.glyphs.map(g=>`<path d="${g.d}"/>`).join('')}</g>`:'';
 return `<defs><clipPath id="stitch-clip"><rect width="${s.width}" height="${s.height}"/></clipPath>${surface?.defs??''}</defs><g data-stitch-cells="${p.cells.length}" data-source-cells="${p.sourceCells.length}" clip-path="url(#stitch-clip)"><rect width="${s.width}" height="${s.height}" fill="${g.surface?g.leather:s.background}"/>${g.surface?`${surface!.body}<path d="${path}" fill="none" stroke="black" opacity="${Math.min(.7,.12+g.puff/100*.15)}" stroke-width="${n(px*(1.1+g.puff/100*.35))}" filter="url(#stitch-contact)"/><path d="${path}" fill="none" stroke="black" opacity=".48" stroke-width="${n(px*.7)}" stroke-linejoin="round"/>`:''}${patternLayer}<g data-needle-count="${g.double?2:1}" fill="none" stroke-linecap="round" stroke-linejoin="round">${rows.map((d,i)=>d?`<g data-needle-index="${i+1}"><path d="${d}" stroke="${g.surface?'#000000':i===0?g.thread:g.thread2}" opacity="${g.surface?.7:.2}" stroke-width="${n((g.threadWidth+.3)*px)}" stroke-dasharray="${n(g.pitch*px)} ${n(g.gap*px)}"/><path d="${d}" stroke="${i===0?g.thread:g.thread2}" stroke-width="${n(g.threadWidth*px)}" stroke-dasharray="${n(g.pitch*px)} ${n(g.gap*px)}"/></g>`:'').join('')}</g></g>`;
}
export function stitchSVG(s:Settings){return`<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><title>CMF 電腦車縫設計試用</title>${stitchMarkup(s)}</svg>`;}
