import { fastCircle, generatePattern, hash, type Pattern, type Settings } from '../engine';
import { generateHalftone } from '../halftone/engine';
import { imageBytes } from '../halftone/model';
export interface GrainRender {width:number;height:number;color:Uint8ClampedArray;heightMap:Uint8ClampedArray;normal:Uint8ClampedArray;roughness:Uint8ClampedArray;minMm:number;maxMm:number;glyphs:number;limited:boolean;effectiveSizeX:number;effectiveSizeY:number}
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v)),mod=(n:number,p:number)=>(n%p+p)%p,smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export function periodicNoise(x:number,y:number,nx:number,ny:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),u=smooth(x-ix),v=smooth(y-iy),h=(xx:number,yy:number)=>hash(mod(xx,nx),mod(yy,ny),seed);return(h(ix,iy)*(1-u)+h(ix+1,iy)*u)*(1-v)+(h(ix,iy+1)*(1-u)+h(ix+1,iy+1)*u)*v;}
export function cellularGrain(x:number,y:number,nx:number,ny:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y);let first=Infinity,second=Infinity;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const px=ix+xx,py=iy+yy,a=mod(px,nx),b=mod(py,ny),dx=px+.15+.7*hash(a,b,seed)-x,dy=py+.15+.7*hash(a,b,seed+11)-y,d=dx*dx+dy*dy;if(d<first){second=first;first=d;}else if(d<second)second=d;}return{distance:Math.sqrt(first),edge:Math.sqrt(second)-Math.sqrt(first)};}
export function textureField(s:Settings,w:number,h:number):Float32Array{
 const g=s.grain,nx=Math.max(1,Math.round(s.width*25.4/96/g.size)),ny=Math.max(1,Math.round(s.height*25.4/96/g.size)),out=new Float32Array(w*h),im=g.image,bytes=im?imageBytes(im):null,offsetX=hash(0,0,g.seed),offsetY=hash(1,0,g.seed);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const u=(x+.5)/w,v=(y+.5)/h,px=u*nx,py=v*ny;let value=0;
  if(g.type==='image'&&im&&bytes){const xx=mod(px+offsetX,1)*im.width-.5,yy=mod(py+offsetY,1)*im.height-.5,ix=Math.floor(xx),iy=Math.floor(yy),fx=xx-ix,fy=yy-iy;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const k=(mod(iy+dy,im.height)*im.width+mod(ix+dx,im.width))*2,a=bytes[k+1]/255;value+=(bytes[k]/255*a+1-a)*(dx?fx:1-fx)*(dy?fy:1-fy);}}
  else if(g.type==='polished')value=.5;
  else if(g.type==='brushed'){const across=g.brushDirection===90?px:py,along=g.brushDirection===90?py:px,na=g.brushDirection===90?nx:ny,nb=g.brushDirection===90?ny:nx;value=.5+.3*Math.sin(2*Math.PI*across)+.15*(periodicNoise(across*4,0,na*4,1,g.seed)-.5)+.05*(periodicNoise(across,along,na,nb,g.seed+8)-.5);}
  else if(g.type.startsWith('laser-')){const angle=g.laserAngle*Math.PI/180,grid=g.type==='laser-grid',facet=g.type==='laser-facet',ix=Math.round(nx*Math.cos(angle)),iy=Math.round(ny*Math.sin(angle)),jx=Math.round(nx*Math.cos(angle+(facet?Math.PI/3:Math.PI/2))),jy=Math.round(ny*Math.sin(angle+(facet?Math.PI/3:Math.PI/2))),a=u*ix+v*iy,b=u*jx+v*jy,tri=(t:number)=>1-Math.abs(mod(t,1)*2-1),micro=periodicNoise(px*2,py*2,nx*2,ny*2,g.seed+71);if(grid){const aa=mod(a,1),bb=mod(b,1),edge=Math.min(aa,1-aa,bb,1-bb);value=.12+.8*smooth(edge/.14)+.04*(micro-.5);}else if(facet)value=.12+.8*Math.min(tri(a),tri(b),tri(a-b))+.025*(micro-.5);else{const phase=u*Math.round(-nx*Math.sin(angle))+v*Math.round(ny*Math.cos(angle));value=.15+.7*tri(phase)+.06*(micro-.5);}}
  else if(g.type==='fine')value=.55*periodicNoise(px,py,nx,ny,g.seed)+.3*periodicNoise(px*2,py*2,nx*2,ny*2,g.seed+1)+.15*periodicNoise(px*4,py*4,nx*4,ny*4,g.seed+2);
  else{const c=cellularGrain(px,py,nx,ny,g.seed),micro=periodicNoise(px*4,py*4,nx*4,ny*4,g.seed+31);value=g.type==='leather'?.18+.7*smooth(c.edge/.17)+.1*micro:.15+.7*(1-smooth(c.distance/.9))+.15*micro;}
  if(g.scuffs>0){const line=periodicNoise(u*Math.max(1,Math.round(nx*.25)),v*ny*4,Math.max(1,Math.round(nx*.25)),ny*4,g.seed+99);value-=g.scuffs/100*.3*Math.pow(clamp((line-.62)/.38),3);}
  out[y*w+x]=g.invert?1-clamp(value):clamp(value);
 }
 return out;
}
/** Real compound geometry is scan converted using even/odd per glyph; overlapping glyphs form a union. */
export function rasterPattern(p:Pattern,s:Settings,w:number,h:number):Float32Array{
 const mask=new Float32Array(w*h),sx=w/s.width,sy=h/s.height;
 for(const glyph of p.glyphs){
  if(!glyph.contours.length){const cx=glyph.x*sx,cy=glyph.y*sy,rx=glyph.size/2*sx,ry=glyph.size/2*sy;if(rx<=0||ry<=0)continue;for(let y=Math.max(0,Math.ceil(cy-ry-.5));y<Math.min(h,cy+ry);y++){const dy=(y+.5-cy)/ry;if(Math.abs(dy)>1)continue;const reach=rx*Math.sqrt(1-dy*dy);for(let x=Math.max(0,Math.ceil(cx-reach-.5));x<Math.min(w,cx+reach-.5);x++)mask[y*w+x]=1;}continue;}
  const contours=glyph.contours.map(c=>c.map(pt=>({x:pt.x*sx,y:pt.y*sy})));let minY=h,maxY=0;for(const c of contours)for(const p of c){minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  for(let y=Math.max(0,Math.ceil(minY-.5));y<Math.min(h,maxY);y++){const cuts:number[]=[];for(const c of contours)for(let i=0,j=c.length-1;i<c.length;j=i++){const a=c[j],b=c[i];if((a.y>y+.5)!==(b.y>y+.5))cuts.push(a.x+(y+.5-a.y)*(b.x-a.x)/(b.y-a.y));}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2)for(let x=Math.max(0,Math.ceil(cuts[i]-.5));x<Math.min(w,cuts[i+1]-.5);x++)mask[y*w+x]=1;}
 }
 return mask;
}
export function blurMask(source:Float32Array,w:number,h:number,radius:number){const bounded=Math.min(48,Math.max(0,radius)),lo=Math.floor(bounded),hi=Math.ceil(bounded);if(lo!==hi){const a=blurMask(source,w,h,lo),b=blurMask(source,w,h,hi),out=new Float32Array(source.length),t=bounded-lo;for(let i=0;i<out.length;i++)out[i]=a[i]*(1-t)+b[i]*t;return out;}const r=lo;if(!r)return source;const tmp=new Float32Array(source.length),out=new Float32Array(source.length),n=r*2+1;for(let y=0;y<h;y++){let sum=0;for(let k=-r;k<=r;k++)sum+=source[y*w+mod(k,w)];for(let x=0;x<w;x++){tmp[y*w+x]=sum/n;sum+=source[y*w+mod(x+r+1,w)]-source[y*w+mod(x-r,w)];}}for(let x=0;x<w;x++){let sum=0;for(let k=-r;k<=r;k++)sum+=tmp[mod(k,h)*w+x];for(let y=0;y<h;y++){out[y*w+x]=sum/n;sum+=tmp[mod(y+r+1,h)*w+x]-tmp[mod(y-r,h)*w+x];}}return out;}
const srgb=Float32Array.from({length:4097},(_,i)=>{const v=i/4096;return 255*(v<=.0031308?v*12.92:1.055*Math.pow(v,1/2.4)-.055);});
const linear=(v:number)=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);
export function createGrainRenderer(){
 let cachedImage:Settings['grain']['image']=null,cachedPattern:Pattern|null=null,patternRevision=-1,maskKey='',mask:Float32Array|null=null,fieldKey='',field:Float32Array|null=null,patternField:Float32Array|null=null;
 return(s:Settings,w:number,h:number,revision=0):GrainRender=>{
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>4194304)throw new Error('咬花輸出尺寸過大。');const g=s.grain,needsPattern=g.patternMode!=='none';
  if(needsPattern&&patternRevision!==revision){cachedPattern=s.halftone.enabled&&s.halftone.image&&fastCircle(s)?generateHalftone(s,true):generatePattern(s);patternRevision=revision;maskKey='';}
  const mk=[revision,w,h,g.bevel].join('|');if(needsPattern&&maskKey!==mk){mask=blurMask(rasterPattern(cachedPattern!,s,w,h),w,h,g.bevel/(s.width*25.4/96)*w*.5);maskKey=mk;}
  const fk=[w,h,s.width,s.height,g.type,g.size,g.laserAngle,g.patternLaserAngle,g.brushDirection,g.patternTexture,g.patternSize,g.patternBrushDirection,g.seed,g.scuffs,g.invert,g.image?.id].join('|');if(fieldKey!==fk||cachedImage!==g.image){field=textureField(s,w,h);patternField=g.patternTexture!=='inherit'?textureField({...s,grain:{...g,type:g.patternTexture,size:g.patternSize,laserAngle:g.patternLaserAngle,brushDirection:g.patternBrushDirection}},w,h):null;fieldKey=fk;cachedImage=g.image;}
  const heights=new Float32Array(w*h),color=new Uint8ClampedArray(w*h*4),heightMap=new Uint8ClampedArray(w*h*4),normal=new Uint8ClampedArray(w*h*4),roughness=new Uint8ClampedArray(w*h*4);let minMm=Infinity,maxMm=-Infinity;
  for(let i=0;i<heights.length;i++){const raw=(field![i]-.5)*g.depth,m=needsPattern?mask![i]*g.patternStrength/100:0;const target=patternField?(patternField[i]-.5)*g.patternTextureDepth:raw;let z=raw+(target-raw)*m;if(g.patternMode==='emboss')z+=g.patternDepth*m;else if(g.patternMode==='deboss')z-=g.patternDepth*m;else if(g.patternMode==='inside')z=target*m;else if(g.patternMode==='outside')z=target*(1-m);z=z||0;heights[i]=z;minMm=Math.min(minMm,z);maxMm=Math.max(maxMm,z);}
  const base=[1,3,5].map(i=>linear(parseInt(g.color.slice(i,i+2),16)/255)),az=g.lightAngle*Math.PI/180,el=g.lightElevation*Math.PI/180,lx=Math.cos(az)*Math.cos(el),ly=Math.sin(az)*Math.cos(el),lz=Math.sin(el),hl=Math.hypot(lx,ly,lz+1),hx=lx/hl,hy=ly/hl,hz=(lz+1)/hl,dxMm=s.width*25.4/96/w,dyMm=s.height*25.4/96/h;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,k=i*4,dx=(heights[y*w+mod(x+1,w)]-heights[y*w+mod(x-1,w)])/(2*dxMm)*g.normalStrength,dy=(heights[mod(y+1,h)*w+x]-heights[mod(y-1,h)*w+x])/(2*dyMm)*g.normalStrength,nlen=Math.hypot(dx,dy,1),nx=-dx/nlen,ny=dy/nlen,nz=1/nlen;
   normal[k]=(nx*.5+.5)*255;normal[k+1]=(ny*.5+.5)*255;normal[k+2]=(nz*.5+.5)*255;normal[k+3]=255;
   const vlen=Math.hypot(dx*g.relief,dy*g.relief,1),vx=-dx*g.relief/vlen,vy=dy*g.relief/vlen,vz=1/vlen,m=needsPattern?mask![i]*g.patternStrength/100:0,gloss=clamp((g.gloss+(g.patternMode==='gloss'?(g.patternGloss-g.gloss)*m:patternField?(g.patternTextureGloss-g.gloss)*(g.patternMode==='outside'?1-m:m):0))/100),power=8+gloss*gloss*240,diffuse=.32+.78*Math.max(0,vx*lx+vy*ly+vz*lz),spec=.04*(power+2)/8*Math.pow(Math.max(0,vx*hx+vy*hy+vz*hz),power),env=.006+gloss*gloss*.06*Math.pow((1+Math.cos(2*Math.PI*(x+.5)/w))*(1+Math.cos(2*Math.PI*(y+.5)/h))/4,3);
   for(let c=0;c<3;c++)color[k+c]=srgb[Math.round(clamp(base[c]*diffuse+spec+env)*4096)];color[k+3]=255;
   const hv=maxMm-minMm>1e-9?(heights[i]-minMm)/(maxMm-minMm):.5;for(let c=0;c<3;c++){heightMap[k+c]=hv*255;roughness[k+c]=(1-gloss)*255;}heightMap[k+3]=roughness[k+3]=255;
  }
  return{width:w,height:h,color,heightMap,normal,roughness,minMm,maxMm,glyphs:needsPattern?cachedPattern!.glyphs.length:0,limited:needsPattern&&cachedPattern!.limited,effectiveSizeX:s.width*25.4/96/Math.max(1,Math.round(s.width*25.4/96/g.size)),effectiveSizeY:s.height*25.4/96/Math.max(1,Math.round(s.height*25.4/96/g.size))};
 };
}
