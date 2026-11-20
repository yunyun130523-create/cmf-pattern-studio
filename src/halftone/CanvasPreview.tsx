import { useEffect, useRef, useState } from 'react';
import type { Settings } from '../engine';
import { drawPacked } from './draw';
import type { PackedPattern } from './engine';
export function CanvasPreview({settings:s,packed,bitmap}:{settings:Settings;packed:PackedPattern|null;bitmap:ImageBitmap|null}){
 const ref=useRef<HTMLCanvasElement>(null),buffer=useRef<HTMLCanvasElement|null>(null),layer=useRef<HTMLCanvasElement|null>(null);
 const [error,setError]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const lost=(e:Event)=>{e.preventDefault();setError('預覽暫時中斷，正在等待恢復；設計參數仍保留。');},restored=()=>setRevision(n=>n+1);canvas.addEventListener('contextlost',lost);canvas.addEventListener('contextrestored',restored);return()=>{canvas.removeEventListener('contextlost',lost);canvas.removeEventListener('contextrestored',restored);};},[]);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;
  try{
   const scale=Math.min(2,window.devicePixelRatio||1,2800/Math.max(s.width,s.height)),width=Math.max(1,Math.round(s.width*scale)),height=Math.max(1,Math.round(s.height*scale));
   const frame=buffer.current??(buffer.current=document.createElement('canvas'));if(frame.width!==width)frame.width=width;if(frame.height!==height)frame.height=height;
   const ctx=frame.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.setTransform?.(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.clearRect(0,0,width,height);ctx.scale(scale,scale);
   if(!s.transparentBackground){ctx.fillStyle=s.background;ctx.fillRect(0,0,s.width,s.height);}
   let drawn=false;
   if(bitmap){try{if(bitmap.width>0&&bitmap.height>0){ctx.drawImage(bitmap,0,0,s.width,s.height);drawn=true;}}catch{/* A lost GPU image can still be drawn from its vector data. */}}
   if(!drawn&&packed){const paintCanvas=layer.current??(layer.current=document.createElement('canvas'));if(paintCanvas.width!==width)paintCanvas.width=width;if(paintCanvas.height!==height)paintCanvas.height=height;const paint=paintCanvas.getContext('2d');if(!paint)throw new Error('Canvas unavailable');paint.setTransform?.(1,0,0,1,0,0);paint.clearRect(0,0,width,height);paint.scale(scale,scale);paint.fillStyle=s.foreground;drawPacked(paint,packed);ctx.globalAlpha=s.opacity/100;ctx.drawImage(paintCanvas,0,0,s.width,s.height);drawn=true;}
   if(bitmap&&!drawn)throw new Error('Preview image unavailable');
   const target=canvas.getContext('2d');if(!target)throw new Error('Canvas unavailable');if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;target.setTransform?.(1,0,0,1,0,0);target.globalCompositeOperation='copy';try{target.drawImage(frame,0,0);}finally{target.globalCompositeOperation='source-over';}setError('');
  }catch{setError('預覽暫時無法更新，已保留上一版畫面；請再調整一次參數。');}
 },[s.width,s.height,s.background,s.foreground,s.opacity,s.transparentBackground,packed,bitmap,revision]);
 return <><canvas ref={ref} className="halftone-canvas" data-testid="halftone-canvas" role="img" aria-label="圖片點陣 Canvas 即時預覽"/>{error&&<p className="preview-render-error" role="status">{error}</p>}</>;
}
