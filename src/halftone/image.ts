import { imageFromRGBA, type SampleImage } from './model';
export async function decodePhotograph(file:File):Promise<SampleImage>{
 if(file.size>15_000_000)throw new Error('圖片超過 15 MB，請先縮小。');const header=new Uint8Array(await file.slice(0,65536).arrayBuffer());
 const png=header.slice(0,8).join(',')==='137,80,78,71,13,10,26,10',jpeg=header[0]===255&&header[1]===216;
 if(!png&&!jpeg)throw new Error('檔案內容不是有效 JPG 或 PNG，請勿只更改副檔名。');
 let w=0,h=0;if(png&&header.length>=24){const v=new DataView(header.buffer);w=v.getUint32(16);h=v.getUint32(20);}else if(jpeg){for(let i=2;i<header.length-9;){if(header[i]!==255){i++;continue;}const marker=header[i+1];if(marker===0xda||marker===0xd9)break;if(marker===0xd8||marker>=0xd0&&marker<=0xd7){i+=2;continue;}const len=(header[i+2]<<8)+header[i+3];if(len<2)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){h=(header[i+5]<<8)+header[i+6];w=(header[i+7]<<8)+header[i+8];break;}i+=len+2;}}
 if(w>16384||h>16384||w*h>32000000)throw new Error('圖片尺寸過大，請縮至 3200 萬像素以下。');
 let image:CanvasImageSource,width:number,height:number,release=()=>{};
 if(typeof createImageBitmap==='function'){const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});image=bitmap;width=bitmap.width;height=bitmap.height;release=()=>bitmap.close();}
 else{const url=URL.createObjectURL(file),img=new Image();try{await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(new Error('瀏覽器無法解碼此圖片。'));img.src=url;});}finally{URL.revokeObjectURL(url);}image=img;width=img.naturalWidth;height=img.naturalHeight;}
 try{if(width<1||height<1||width>16384||height>16384||width*height>32000000)throw new Error('圖片尺寸無效或過大。');const f=Math.min(1,1024/Math.max(width,height)),cw=Math.max(1,Math.round(width*f)),ch=Math.max(1,Math.round(height*f));const canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('瀏覽器不支援圖片取樣。');ctx.drawImage(image,0,0,cw,ch);return imageFromRGBA(ctx.getImageData(0,0,cw,ch).data,cw,ch,{name:file.name,format:png?'PNG':'JPEG',originalWidth:width,originalHeight:height,warnings:width>1024||height>1024?['已保留最長邊 1024 px 的灰階取樣資料供點陣與 JSON 還原，原始照片不會嵌入 SVG。']:[]});}finally{release();}
}
