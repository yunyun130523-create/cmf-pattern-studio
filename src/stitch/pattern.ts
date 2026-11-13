import { generatePattern, type Glyph, type Point, type Settings } from '../engine';
import type { Seam } from './engine';
const px=96/25.4;
function inside(p:Point,c:Point[]){let yes=false;for(let i=0,j=c.length-1;i<c.length;j=i++){const a=c[i],b=c[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
function distance(p:Point,e:Seam){const dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-e.a.x)*dx+(p.y-e.a.y)*dy)/den)):0;return Math.hypot(p.x-e.a.x-t*dx,p.y-e.a.y-t*dy);}
/** Spatial index limits clearance queries to nearby seam segments and cell rings. */
export function composeStitchPattern(s:Settings,p:{cells:Point[][];seams:Seam[]}){
 const bucket=96,edgeGrid=new Map<string,Seam[]>(),cellGrid=new Map<string,Point[][]>(),key=(x:number,y:number)=>x+','+y;
 const insert=<T,>(map:Map<string,T[]>,item:T,x0:number,y0:number,x1:number,y1:number)=>{for(let y=Math.floor(Math.max(-bucket,y0)/bucket);y<=Math.floor(Math.min(s.height+bucket,y1)/bucket);y++)for(let x=Math.floor(Math.max(-bucket,x0)/bucket);x<=Math.floor(Math.min(s.width+bucket,x1)/bucket);x++){const k=key(x,y),a=map.get(k);if(a)a.push(item);else map.set(k,[item]);}};
 const bounds=p.cells.map(c=>({x:Math.min(...c.map(p=>p.x)),y:Math.min(...c.map(p=>p.y)),right:Math.max(...c.map(p=>p.x)),bottom:Math.max(...c.map(p=>p.y))}));
 p.cells.forEach((c,i)=>{const b=bounds[i];insert(cellGrid,c,b.x,b.y,b.right,b.bottom);});
 for(const e of p.seams)insert(edgeGrid,e,Math.min(e.a.x,e.b.x),Math.min(e.a.y,e.b.y),Math.max(e.a.x,e.b.x),Math.max(e.a.y,e.b.y));
 const margin=(s.stitch.patternMargin+(s.stitch.double?s.stitch.rowGap/2:0)+s.stitch.threadWidth/2)*px,glyphs:Glyph[]=[],cap=12000;let limited=false;
 const accept=(g:Glyph)=>{if(glyphs.length>=cap){limited=true;return;}const radius=Math.max(...g.contours.flat().map(pt=>Math.hypot(pt.x-g.x,pt.y-g.y)));if(g.x-radius<0||g.y-radius<0||g.x+radius>s.width||g.y+radius>s.height)return;
 const rings=cellGrid.get(key(Math.floor(g.x/bucket),Math.floor(g.y/bucket)))??[];if(rings.reduce((n,c)=>n+(inside(g,c)?1:0),0)%2===0)return;
 const r=radius+margin,seen=new Set<Seam>();for(let yy=Math.floor((g.y-r)/bucket);yy<=Math.floor((g.y+r)/bucket);yy++)for(let xx=Math.floor((g.x-r)/bucket);xx<=Math.floor((g.x+r)/bucket);xx++)for(const e of edgeGrid.get(key(xx,yy))??[]){if(seen.has(e))continue;seen.add(e);if(distance(g,e)<r)return;}glyphs.push(g);};
 const input={...s,halftone:{...s.halftone,enabled:false}};
 if(s.stitch.patternMapping==='canvas'){const source=generatePattern(input);limited=source.limited;for(const g of source.glyphs)accept(g);}
 else for(let i=0;i<p.cells.length;i++){if(limited&&glyphs.length>=cap)break;const b=bounds[i];if(b.right<0||b.bottom<0||b.x>s.width||b.y>s.height||b.right-b.x<1||b.bottom-b.y<1)continue;const source=generatePattern({...input,width:b.right-b.x,height:b.bottom-b.y});limited||=source.limited;for(const g of source.glyphs){const x=g.x+b.x,y=g.y+b.y;if(!inside({x,y},p.cells[i]))continue;const contours=g.contours.map(c=>c.map(pt=>({x:pt.x+b.x,y:pt.y+b.y})));accept({...g,x,y,contours,points:contours[0],d:contours.map(c=>'M'+c.map(pt=>`${Number(pt.x.toFixed(3))},${Number(pt.y.toFixed(3))}`).join('L')+'Z').join(' ')});}}
 return{glyphs,limited,margin};
}
