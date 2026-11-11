import { drawPacked } from './draw';
import { generatePattern, svgDocument, type Settings } from '../engine';
import { dxfDocument } from '../exports';
import { generateHalftone, packPattern } from './engine';
import type { SampleImage } from './model';
let cached:SampleImage|null=null;
self.onmessage=async(e:MessageEvent<{id:number;kind:'preview'|'svg'|'dxf';settings:Settings;imageId:string;unit?:'mm'|'px'}>)=>{const {id,kind,settings,imageId}=e.data;try{
 if(settings.halftone.image)cached=settings.halftone.image;if(!cached||cached.id!==imageId)throw new Error('圖片取樣快取遺失，請重新載入圖片。');const s={...settings,halftone:{...settings.halftone,image:cached}},pattern=kind!=='dxf'&&s.shape==='circle'&&!s.morph?generateHalftone(s,true):generatePattern(s);
 if(kind==='preview'){const packed=packPattern(pattern,s.shape==='circle'&&!s.morph);let bitmap:ImageBitmap|null=null;
 if(typeof OffscreenCanvas!=='undefined'){try{const scale=Math.min(2,2800/Math.max(s.width,s.height)),width=Math.round(s.width*scale),height=Math.round(s.height*scale),canvas=new OffscreenCanvas(width,height),layer=new OffscreenCanvas(width,height),ctx=canvas.getContext('2d'),paint=layer.getContext('2d');if(ctx&&paint){paint.scale(scale,scale);paint.fillStyle=s.foreground;drawPacked(paint,packed);ctx.scale(scale,scale);if(!s.transparentBackground){ctx.fillStyle=s.background;ctx.fillRect(0,0,s.width,s.height);}ctx.globalAlpha=s.opacity/100;ctx.drawImage(layer,0,0,s.width,s.height);bitmap=canvas.transferToImageBitmap();}}catch{/* Packed Canvas fallback remains available. */}}
 const transfer:Transferable[]=[packed.coordinates.buffer,packed.offsets.buffer,packed.glyphEnds.buffer];if(packed.circles)transfer.push(packed.circles.buffer);if(bitmap)transfer.push(bitmap);self.postMessage({id,kind,packed,bitmap},{transfer});}
 else self.postMessage({id,kind,text:kind==='svg'?svgDocument(s,pattern):dxfDocument(s,pattern,e.data.unit??'mm')});
 }catch(e){self.postMessage({id,kind,error:e instanceof Error?e.message:'圖片點陣運算失敗。'});}};
