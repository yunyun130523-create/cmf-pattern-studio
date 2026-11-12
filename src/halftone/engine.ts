import { rangeSampler } from '../mask/engine';
import { fastCircle, clamp, fieldValue, hash, interpolateOutline, morphOutlines, morphValue, shapeContours, type Pattern, type Point, type Settings } from '../engine';
import { imageBytes, type HalftoneSettings, type SampleImage } from './model';
import { signedArea } from '../custom/geometry';
export function imageRect(h:HalftoneSettings,width:number,height:number){const im=h.image!;const cw=im.width*h.crop.width,ch=im.height*h.crop.height,base=(h.fit==='cover'?Math.max:Math.min)(width/cw,height/ch),w=cw*base*h.zoom,hh=ch*base*(h.aspectLock?h.zoom:h.zoomY);return{x:(width-w)/2+h.offsetX/100*width,y:(height-hh)/2+h.offsetY/100*height,width:w,height:hh};}
interface Grid{w:number;h:number;light:Float32Array;alpha:Float32Array}
let cachedImage:SampleImage|null=null,cachedDetail=0,cachedGrid:Grid|null=null;
function grid(im:SampleImage,detail:number):Grid{
 if(cachedImage===im&&cachedDetail===detail&&cachedGrid)return cachedGrid;
 const factor=Math.min(1,detail/Math.max(im.width,im.height)),w=Math.max(1,Math.round(im.width*factor)),h=Math.max(1,Math.round(im.height*factor));const light=new Float32Array(w*h),alpha=new Float32Array(w*h),count=new Uint32Array(w*h),bytes=imageBytes(im);
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const p=y*im.width+x,k=Math.min(h-1,Math.floor(y*h/im.height))*w+Math.min(w-1,Math.floor(x*w/im.width)),a=bytes[p*2+1]/255;light[k]+=bytes[p*2]/255*a+(1-a);alpha[k]+=a;count[k]++;}
 for(let i=0;i<light.length;i++){light[i]/=count[i]||1;alpha[i]/=count[i]||1;}cachedImage=im;cachedDetail=detail;return cachedGrid={w,h,light,alpha};
}
export function adjustedDarkness(light:number,h:HalftoneSettings){let v=clamp((light-.5)*h.contrast+.5+h.brightness/100);v=Math.pow(v,1/h.gamma);return h.invert?v:1-v;}
export function sampler(h:HalftoneSettings,width:number,height:number){const im=h.image!,g=grid(im,h.detail),r=imageRect(h,width,height);
 return(x:number,y:number)=>{const u=(x-r.x)/r.width,v=(y-r.y)/r.height;if(u<0||u>1||v<0||v>1)return null;const xx=(h.crop.x+u*h.crop.width)*g.w-.5,yy=(h.crop.y+v*h.crop.height)*g.h-.5,x0=Math.floor(xx),y0=Math.floor(yy),fx=xx-x0,fy=yy-y0;
 let light=0,alpha=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const k=Math.round(clamp(y0+dy,0,g.h-1))*g.w+Math.round(clamp(x0+dx,0,g.w-1)),weight=(dx?fx:1-fx)*(dy?fy:1-fy);light+=g.light[k]*weight;alpha+=g.alpha[k]*weight;}
 return alpha<.01?null:adjustedDarkness(light,h);};
}
function simplified(c:Point[]):Point[]{return c.filter((p,i)=>{const a=c[(i+c.length-1)%c.length],b=c[(i+1)%c.length];return Math.abs((p.x-a.x)*(b.y-p.y)-(p.y-a.y)*(b.x-p.x))>1e-9;});}
export function generateHalftone(s:Settings,compactCircles=false):Pattern{
 const h=s.halftone;if(!h.image)return{glyphs:[],effectiveSpacingX:h.spacingX,effectiveSpacingY:h.spacingY,limited:false,coverage:0};
 let source=shapeContours(s.shape,s);if(fastCircle(s))source=[Array.from({length:32},(_,i)=>({x:Math.cos(i*Math.PI/16)*.5,y:Math.sin(i*Math.PI/16)*.5}))];else if(!s.morph)source=source.map(c=>{const simple=simplified(c);return simple.length>=3?simple:c;});
 const pair=s.morph?morphOutlines(s):null,n=pair?pair[0].length:source.reduce((a,c)=>a+c.length,0),cap=Math.min(60000,Math.floor(1800000/n));
 const sx=h.spacingX/Math.sqrt(h.density/100),sy=h.spacingY/Math.sqrt(h.density/100)*(h.layout==='hex'?Math.sqrt(3)/2:1),estimated=s.width/sx*s.height/sy,factor=Math.max(1,Math.sqrt(estimated/Math.max(1,cap))),dx=sx*factor,dy=sy*factor;
 const sample=sampler(h,s.width,s.height),glyphs:Pattern['glyphs']=[];let area=0;
 const extent=Math.max(...(pair?[...pair[0],...pair[1]]:source.flat()).map(p=>Math.hypot(p.x,p.y)));
 for(let row=0,y=dy/2;y<s.height;row++,y+=dy)for(let col=0,x=dx/2+(h.layout==='stagger'||h.layout==='hex'?row%2*dx/2:0);x<s.width;col++,x+=dx){
 const jitter=h.jitter,gx=x+(hash(col,row,s.seed+21)-.5)*dx*jitter/100,gy=y+(hash(col,row,s.seed+22)-.5)*dy*jitter/100,d=sample(gx,gy);if(d===null||h.skipWhite&&d<=1-h.whiteThreshold/255)continue;
 const maskSample=s.rangeMask.enabled&&s.rangeMask.image?rangeSampler(s.rangeMask,s.width,s.height)(gx,gy):null;if(maskSample&&maskSample.distance<=0)continue;
 const field=h.layout==='gradient'||s.rangeMask.enabled&&s.rangeMask.gradient==='boundary'?fieldValue(gx,gy,s):1;if(h.mode==='sparse'&&hash(col,row,s.seed+23)>=d*field)continue;
 const size=(h.minSize+(h.maxSize-h.minSize)*Math.sqrt(Math.max(0,d)))*(1+(hash(col,row,s.seed+24)*2-1)*h.randomSize/100)*field;
 if(maskSample&&maskSample.distance<size*extent)continue;
 if(size<.05||gx-size*extent<0||gy-size*extent<0||gx+size*extent>s.width||gy+size*extent>s.height)continue;
 const m=s.morph?morphValue(gx,s,dx,gy,dy):0,rotation=s.rotation+(hash(col,row,s.seed+25)*2-1)*h.randomRotation+(s.rotationGradient?s.rotationStart+(s.rotationEnd-s.rotationStart)*m:0),a=rotation*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
 const circle=fastCircle(s),contours=compactCircles&&circle?[]:(pair?[interpolateOutline(pair[0],pair[1],m)]:source).map(c=>c.map(p=>({x:Math.round((gx+(p.x*ca-p.y*sa)*size)*1000)/1000,y:Math.round((gy+(p.x*sa+p.y*ca)*size)*1000)/1000})));
 area+=circle?Math.PI*(size/2)**2:Math.abs(contours.reduce((sum,c)=>sum+signedArea(c),0));glyphs.push({x:gx,y:gy,size,t:d,morphT:m,rotation,randomT:jitter/100,points:contours[0]??[],contours,d:contours.map(c=>'M'+c.map(p=>`${p.x},${p.y}`).join('L')+'Z').join(' ')});
 }
 return{glyphs,effectiveSpacingX:dx,effectiveSpacingY:dy,limited:factor>1,coverage:area/s.width/s.height*100};
}
export interface PackedPattern {circles?:Float32Array;coordinates:Float32Array;offsets:Uint32Array;glyphEnds:Uint32Array;count:number;effectiveSpacingX:number;effectiveSpacingY:number;coverage:number;limited:boolean}
export function packPattern(p:Pattern,circles=false):PackedPattern{if(circles)return{circles:new Float32Array(p.glyphs.flatMap(g=>[g.x,g.y,g.size/2])),coordinates:new Float32Array(),offsets:new Uint32Array(),glyphEnds:new Uint32Array(),count:p.glyphs.length,effectiveSpacingX:p.effectiveSpacingX,effectiveSpacingY:p.effectiveSpacingY,coverage:p.coverage,limited:p.limited};const coords:number[]=[],offsets=[0],ends:number[]=[];for(const g of p.glyphs){for(const c of g.contours){for(const pt of c)coords.push(pt.x,pt.y);offsets.push(coords.length/2);}ends.push(offsets.length-1);}return{coordinates:new Float32Array(coords),offsets:new Uint32Array(offsets),glyphEnds:new Uint32Array(ends),count:p.glyphs.length,effectiveSpacingX:p.effectiveSpacingX,effectiveSpacingY:p.effectiveSpacingY,coverage:p.coverage,limited:p.limited};}
