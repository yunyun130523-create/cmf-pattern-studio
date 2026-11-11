import { type Settings, type Pattern, svgDocument } from './engine';

export function downloadBlob(blob: Blob, filename: string) {
  const url=URL.createObjectURL(blob), link=document.createElement('a');
  link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export async function pngBlob(s: Settings, p: Pattern, scale: number): Promise<Blob> {
  return pngSVGBlob(svgDocument(s,p),s.width,s.height,scale);
}
export async function pngSVGBlob(text:string,width:number,height:number,scale:number):Promise<Blob>{
  if(!Number.isFinite(scale)||scale<1||scale>3)throw new Error('PNG 輸出倍率無效。');
  const svg=new Blob([text],{type:'image/svg+xml;charset=utf-8'});
  const url=URL.createObjectURL(svg);
  try {
    const image=new Image();
    await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('無法轉換 PNG，請重試。'));image.src=url;});
    const canvas=document.createElement('canvas');canvas.width=width*scale;canvas.height=height*scale;
    const ctx=canvas.getContext('2d');if(!ctx) throw new Error('瀏覽器不支援 PNG 匯出。');
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG 匯出失敗。')),'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
/** CAD coordinates use a bottom-left origin. 96px maps to 25.4mm. */
export function cadContours(s: Settings, p: Pattern, unit: 'mm'|'px') {
  const factor=unit==='mm'?25.4/96:1;
  return p.glyphs.flatMap(g=>g.contours.map(c=>c.map(pt=>({x:pt.x*factor,y:(s.height-pt.y)*factor}))));
}
export function dxfDocument(s: Settings, p: Pattern, unit: 'mm'|'px') {
  const factor=unit==='mm'?25.4/96:1;
  const lines:(string|number)[]=[0,'SECTION',2,'HEADER',9,'$ACADVER',1,'AC1015',9,'$INSUNITS',70,unit==='mm'?4:0,0,'ENDSEC',0,'SECTION',2,'ENTITIES'];
  const add=(points:{x:number;y:number}[],layer:string)=>{lines.push(0,'LWPOLYLINE',100,'AcDbEntity',8,layer,100,'AcDbPolyline',90,points.length,70,1);points.forEach(pt=>lines.push(10,pt.x.toFixed(6),20,pt.y.toFixed(6)));};
  add([{x:0,y:0},{x:s.width*factor,y:0},{x:s.width*factor,y:s.height*factor},{x:0,y:s.height*factor}],'BOUNDARY');
  cadContours(s,p,unit).forEach(points=>add(points,'PATTERN'));
  lines.push(0,'ENDSEC',0,'EOF');return lines.join('\n')+'\n';
}
