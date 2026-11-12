import { imageBytes } from '../halftone/model';
import type { RangeMask } from './model';
const cached=new WeakMap<RangeMask,Map<string,(x:number,y:number)=>{distance:number;t:number}>>();
/** Binary silhouette + two-pass chamfer distance, including holes and transparent edges. */
export function rangeSampler(m:RangeMask,width:number,height:number){
 let entries=cached.get(m);const key=width+':'+height;if(entries?.has(key))return entries.get(key)!;
 const im=m.image;if(!im)return()=>({distance:Infinity,t:1});
 const factor=Math.min(1,512/Math.max(im.width,im.height)),w=Math.max(1,Math.round(im.width*factor)),h=Math.max(1,Math.round(im.height*factor)),bytes=imageBytes(im),d=new Float32Array(w*h);
 let transparent=false;for(let i=1;i<bytes.length;i+=2)if(bytes[i]<250){transparent=true;break;}const alpha=m.source==='alpha'||m.source==='auto'&&transparent;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(Math.min(im.height-1,Math.floor((y+.5)*im.height/h))*im.width+Math.min(im.width-1,Math.floor((x+.5)*im.width/w)))*2;const v=alpha?bytes[k+1]/255:(1-bytes[k]/255)*bytes[k+1]/255;let inside=v>=m.threshold/100;if(m.invert)inside=!inside;d[y*w+x]=inside?Math.min(x+.5,y+.5,w-x-.5,h-y-.5):0;}
 const rt=Math.SQRT2;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;d[i]=Math.min(d[i],x?d[i-1]+1:Infinity,y?d[i-w]+1:Infinity,x&&y?d[i-w-1]+rt:Infinity,x<w-1&&y?d[i-w+1]+rt:Infinity);}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;d[i]=Math.min(d[i],x<w-1?d[i+1]+1:Infinity,y<h-1?d[i+w]+1:Infinity,x<w-1&&y<h-1?d[i+w+1]+rt:Infinity,x&&y<h-1?d[i+w-1]+rt:Infinity);}
 const f=Math.min(width/w,height/h),rw=(m.fit==='stretch'?width:w*f)*m.scale/100,rh=(m.fit==='stretch'?height:h*f)*m.scale/100,ox=(width-rw)/2+m.offsetX/100*width,oy=(height-rh)/2+m.offsetY/100*height,step=Math.min(rw/w,rh/h),fade=Math.min(width,height)*m.feather/100;
 const sample=(x:number,y:number)=>{const u=(x-ox)/rw,v=(y-oy)/rh;if(u<0||u>=1||v<0||v>=1)return{distance:0,t:0};const xx=u*w-.5,yy=v*h-.5,ix=Math.floor(xx),iy=Math.floor(yy),fx=xx-ix,fy=yy-iy;let z=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const px=ix+dx,py=iy+dy;if(px>=0&&px<w&&py>=0&&py<h)z+=d[py*w+px]*(dx?fx:1-fx)*(dy?fy:1-fy);}const distance=z*step,t=Math.max(0,Math.min(1,distance/fade));return{distance,t:t*t*(3-2*t)};};
 if(!entries){entries=new Map();cached.set(m,entries);}entries.set(key,sample);return sample;
}
