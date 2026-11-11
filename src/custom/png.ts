import { filledGeometry, makeCustomShape, mergeGeometry, type CustomShape } from './geometry';
import type { Point } from '../engine';
export interface Raster {width:number;height:number;data:Uint8ClampedArray;sourceWidth?:number;sourceHeight?:number}
export interface TraceOptions {mode:'alpha'|'threshold';threshold:number;invert:boolean;removeBackground:boolean;smoothing:number}
export function defaultTraceOptions(r:Raster):TraceOptions{
  let transparent=0;for(let i=3;i<r.data.length;i+=4)if(r.data[i]<250)transparent++;
  const ids=[0,r.width-1,(r.height-1)*r.width,r.width*r.height-1];
  const light=ids.reduce((n,id)=>n+(.2126*r.data[id*4]+.7152*r.data[id*4+1]+.0722*r.data[id*4+2]),0)/4;
  return{mode:transparent>r.width*r.height*.01?'alpha':'threshold',threshold:128,invert:transparent===0&&light<128,removeBackground:true,smoothing:15};
}
function simplify(points:Point[],epsilon:number):Point[]{
  function rdp(p:Point[],depth=0):Point[]{if(depth>40)throw new Error('輪廓太複雜，請先簡化圖片。');if(p.length<=2)return p;const a=p[0],b=p.at(-1)!,dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;let best=-1,index=0;
    for(let i=1;i<p.length-1;i++){const t=den?Math.max(0,Math.min(1,((p[i].x-a.x)*dx+(p[i].y-a.y)*dy)/den)):0;const d=Math.hypot(p[i].x-a.x-t*dx,p[i].y-a.y-t*dy);if(d>best){best=d;index=i;}}
    return best>epsilon?[...rdp(p.slice(0,index+1),depth+1).slice(0,-1),...rdp(p.slice(index),depth+1)]:[a,b];}
  let opposite=1;for(let i=2;i<points.length;i++)if(Math.hypot(points[i].x-points[0].x,points[i].y-points[0].y)>Math.hypot(points[opposite].x-points[0].x,points[opposite].y-points[0].y))opposite=i;
  return[...rdp(points.slice(0,opposite+1)).slice(0,-1),...rdp([...points.slice(opposite),points[0]]).slice(0,-1)];
}
function smooth(ring:Point[]):Point[]{return ring.flatMap((p,i)=>{const q=ring[(i+1)%ring.length];return[{x:p.x*.75+q.x*.25,y:p.y*.75+q.y*.25},{x:p.x*.25+q.x*.75,y:p.y*.25+q.y*.75}];});}
export function traceRaster(r:Raster,options:TraceOptions,name='PNG 向量圖案'):CustomShape{
  const {width:w,height:h,data}=r;
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>1048576||data.length!==w*h*4)throw new Error('PNG 點陣尺寸無效或過大。');
  if(!Number.isFinite(options.threshold)||options.threshold<0||options.threshold>255||!Number.isFinite(options.smoothing)||options.smoothing<0||options.smoothing>100)throw new Error('向量化參數無效。');
  const mask=new Uint8Array(w*h),bg=new Uint8Array(w*h);
  if(options.removeBackground&&options.mode==='threshold'){
    const corners=[0,w-1,(h-1)*w,w*h-1],color=[0,1,2].map(k=>corners.reduce((n,id)=>n+data[id*4+k],0)/4);
    const matches=(id:number)=>data[id*4+3]<16||Math.hypot(data[id*4]-color[0],data[id*4+1]-color[1],data[id*4+2]-color[2])<45;
    const queue:number[]=[];const add=(id:number)=>{if(!bg[id]&&matches(id)){bg[id]=1;queue.push(id);}};
    for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
    for(let i=0;i<queue.length;i++){const id=queue[i],x=id%w,y=Math.floor(id/w);if(x)add(id-1);if(x<w-1)add(id+1);if(y)add(id-w);if(y<h-1)add(id+w);}
  }
  let filled=0;
  for(let i=0;i<mask.length;i++){
    const alpha=data[i*4+3],brightness=.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2];
    let on=options.mode==='alpha'?alpha>options.threshold:alpha>16&&(options.invert?brightness>=options.threshold:brightness<options.threshold);
    if(options.mode==='alpha'&&options.invert)on=!on;
    mask[i]=on&&!bg[i]?1:0;filled+=mask[i];
  }
  if(!filled)throw new Error('未辨識到圖案，請調整閾值、反轉或去背設定。');
  type Edge={a:number;b:number;dir:number;used:boolean};const edges:Edge[]=[],at=new Map<number,number[]>(),stride=w+1;
  const edge=(x:number,y:number,xx:number,yy:number,dir:number)=>{if(edges.length>100000)throw new Error('圖片太複雜，請使用較簡單的單色 Logo 或先縮小圖片。');const a=y*stride+x,b=yy*stride+xx,index=edges.length;edges.push({a,b,dir,used:false});const list=at.get(a)??[];list.push(index);at.set(a,list);};
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){
    if(!y||!mask[(y-1)*w+x])edge(x,y,x+1,y,0);if(x===w-1||!mask[y*w+x+1])edge(x+1,y,x+1,y+1,1);if(y===h-1||!mask[(y+1)*w+x])edge(x+1,y+1,x,y+1,2);if(!x||!mask[y*w+x-1])edge(x,y+1,x,y,3);
  }
  const contours:Point[][]=[];
  for(let first=0;first<edges.length;first++){
    if(edges[first].used)continue;const loop:Point[]=[];let index=first,closed=false;
    for(let steps=0;steps<=edges.length;steps++){
      const current=edges[index];if(current.used)break;current.used=true;loop.push({x:current.a%stride,y:Math.floor(current.a/stride)});
      if(current.b===edges[first].a){closed=true;break;}
      const choices=(at.get(current.b)??[]).filter(i=>!edges[i].used);if(!choices.length)break;
      const rank=(dir:number)=>{const turn=(dir-current.dir+4)%4;return turn===1?0:turn===0?1:turn===3?2:3;};choices.sort((a,b)=>rank(edges[a].dir)-rank(edges[b].dir));index=choices[0];
    }
    if(!closed)throw new Error('無法建立封閉輪廓，請簡化圖片。');
    let ring=simplify(loop,options.smoothing/100*2.5);if(ring.length<3)continue;
    if(options.smoothing>60)ring=smooth(ring);
    contours.push(ring.map(p=>({x:p.x*(r.sourceWidth??w)/w,y:p.y*(r.sourceHeight??h)/h})));
    if(contours.length>128)throw new Error('圖片包含太多零碎輪廓，請先清除雜訊或簡化圖案。');
  }
  return makeCustomShape(mergeGeometry([filledGeometry(contours,'evenodd')]),{name,source:'PNG',warnings:[...(w!==(r.sourceWidth??w)||h!==(r.sourceHeight??h)?['已縮小點陣進行向量化；匯出的是輪廓路徑，不含原始 PNG。']:[]),'PNG 為輪廓近似，平滑處理會改變細小尖角；確認預覽後再加入圖案庫。']});
}
export async function decodePNG(file:File):Promise<Raster>{
  if(file.size>10_000_000)throw new Error('PNG 超過 10 MB，請先縮小。');
  const signature=new Uint8Array(await file.slice(0,8).arrayBuffer());if(signature.join(',')!=='137,80,78,71,13,10,26,10')throw new Error('檔案內容不是有效的 PNG。');
  const header=new Uint8Array(await file.slice(0,24).arrayBuffer());if(header.length<24)throw new Error('PNG 檔案不完整。');const view=new DataView(header.buffer),hw=view.getUint32(16),hh=view.getUint32(20);if(!hw||!hh||hw>8192||hh>8192||hw*hh>16777216)throw new Error('PNG 尺寸過大，請縮至 8192 px 以下且不超過 1600 萬像素。');
  let image:CanvasImageSource,sourceWidth:number,sourceHeight:number,release=()=>{};
  if(typeof createImageBitmap==='function'){const bitmap=await createImageBitmap(file);image=bitmap;sourceWidth=bitmap.width;sourceHeight=bitmap.height;release=()=>bitmap.close();}
  else{const url=URL.createObjectURL(file),img=new Image();try{await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('PNG 無法解碼。'));img.src=url;});}finally{URL.revokeObjectURL(url);}image=img;sourceWidth=img.naturalWidth;sourceHeight=img.naturalHeight;}
  try{if(sourceWidth<1||sourceHeight<1||sourceWidth>8192||sourceHeight>8192)throw new Error('PNG 尺寸超過支援範圍，請縮至 8192 px 以下。');const scale=Math.min(1,768/Math.max(sourceWidth,sourceHeight)),width=Math.max(1,Math.round(sourceWidth*scale)),height=Math.max(1,Math.round(sourceHeight*scale)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)throw new Error('瀏覽器不支援點陣讀取。');context.drawImage(image,0,0,width,height);return{width,height,data:context.getImageData(0,0,width,height).data,sourceWidth,sourceHeight};}finally{release();}
}
