import type { Settings, Point } from '../engine';
import { pathData } from '../custom/geometry';
export interface BandSection {x:number;width:number;top:number;bottom:number}
/** Local cross-sections keep the crest at full height even through a narrow bridge. */
export function bandSections(ring:Point[],minX:number,maxX:number,step:number):BandSection[]{
 const sections:BandSection[]=[];
 for(let x=minX;x<maxX;x+=step){const width=Math.min(step,maxX-x),sample=x+width/2,hits:number[]=[];
  for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];if((a.x<=sample&&b.x>sample)||(b.x<=sample&&a.x>sample))hits.push(a.y+(sample-a.x)/(b.x-a.x)*(b.y-a.y));}
  hits.sort((a,b)=>a-b);
  for(let i=0;i+1<hits.length;i+=2){const top=hits[i],bottom=hits[i+1];if(bottom-top<.1)continue;const last=sections[sections.length-1];if(last&&Math.abs(last.x+last.width-x)<1e-5&&Math.abs(last.top-top)<.01&&Math.abs(last.bottom-bottom)<.01)last.width+=width;else sections.push({x,width,top,bottom});}
 }
 return sections;
}
const n=(v:number)=>Number(v.toFixed(3));
export function bandRelief(s:Settings,cells:Point[][]):{defs:string;body:string}|null{
 const g=s.stitch;if(g.puff<=0||g.layout!=='shape')return null;
 const angle=g.rotation*Math.PI/180,c=Math.cos(angle),sn=Math.sin(angle),cx=s.width/2,cy=s.height/2,local=(p:Point)=>({x:(p.x-cx)*c+(p.y-cy)*sn,y:-(p.x-cx)*sn+(p.y-cy)*c});
 const joined=(g.spacing===0||g.joinGroups.length>0)&&cells.some(cell=>{const ring=cell.map(local),xs=ring.map(p=>p.x),ys=ring.map(p=>p.y);return Math.max(...xs)-Math.min(...xs)>4*(Math.max(...ys)-Math.min(...ys));});
 if(!(g.shape==='band'||g.mergeEnabled&&g.mergeShape==='band'||joined))return null;
 const viewport=[{x:0,y:0},{x:s.width,y:0},{x:s.width,y:s.height},{x:0,y:s.height}].map(local),left=Math.min(...viewport.map(p=>p.x))-48,right=Math.max(...viewport.map(p=>p.x))+48,top=Math.min(...viewport.map(p=>p.y))-48,bottom=Math.max(...viewport.map(p=>p.y))+48,step=Math.max(1.5,(right-left)/800);
 const scale=96/25.4*(1.5+Math.sqrt(g.edgeWidth)*.7)*g.puff/100,blur=Math.min(4,Math.max(2,g.edgeWidth*96/25.4*.2));
 const gradient='<linearGradient id="stitch-band-height" x1="0%" y1="0%" x2="0%" y2="100%">'+Array.from({length:65},(_,i)=>i/64).map(t=>`<stop offset="${t}" stop-color="white" stop-opacity="${n(Math.sin(Math.PI*t)**.85)}"/>`).join('')+'</linearGradient>';
 const filter=`<filter id="stitch-band-relief" x="-10%" y="-25%" width="120%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${n(blur)}" result="height"/><feFlood flood-color="${g.leather}" result="leather"/><feDiffuseLighting in="height" surfaceScale="${n(scale)}" diffuseConstant=".85" lighting-color="white" result="light"><feDistantLight azimuth="${g.lightAngle-g.rotation}" elevation="50"/></feDiffuseLighting><feComposite in="light" in2="leather" operator="arithmetic" k1="1" k2="0" k3=".35" k4="0" result="lit"/><feSpecularLighting in="height" surfaceScale="${n(scale)}" specularConstant=".12" specularExponent="18" lighting-color="white" result="glint"><feDistantLight azimuth="${g.lightAngle-g.rotation}" elevation="50"/></feSpecularLighting><feBlend in="lit" in2="glint" mode="screen"/></filter>`;
 const clips:string[]=[],rows:string[]=[];
 for(const cell of cells){const ring=cell.map(local),xs=ring.map(p=>p.x),ys=ring.map(p=>p.y),lo=Math.max(left,Math.min(...xs)),hi=Math.min(right,Math.max(...xs));if(hi<=lo||Math.max(...ys)<top||Math.min(...ys)>bottom)continue;
  const sections=bandSections(ring,lo,hi,step);if(!sections.length)continue;const id='stitch-band-clip-'+clips.length;clips.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${pathData([ring])}"/></clipPath>`);
  rows.push(`<g clip-path="url(#${id})"><g filter="url(#stitch-band-relief)" shape-rendering="crispEdges" fill="url(#stitch-band-height)">${sections.map(a=>`<rect x="${n(a.x)}" y="${n(a.top)}" width="${n(a.width)}" height="${n(a.bottom-a.top)}"/>`).join('')}</g></g>`);
 }
 return {defs:gradient+filter+clips.join(''),body:`<g data-band-relief="true" transform="matrix(${c} ${sn} ${-sn} ${c} ${cx} ${cy})">${rows.join('')}</g>`};
}
