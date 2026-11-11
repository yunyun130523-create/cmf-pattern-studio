import { Arc, Circle, DwgReader, Line, LwPolyline, Polyline2D, UnitsType } from '@node-projects/acad-ts';
import { bounds, filledGeometry, makeCustomShape, mergeGeometry, type CustomShape } from './geometry';
import type { Point } from '../engine';
export function cadUnitToMm(unit:number):number|null{
  const scale:Record<number,number>={[UnitsType.Inches]:25.4,[UnitsType.Feet]:304.8,[UnitsType.Millimeters]:1,[UnitsType.Centimeters]:10,[UnitsType.Meters]:1000,[UnitsType.Microns]:.001,[UnitsType.Decimeters]:100,[UnitsType.Kilometers]:1000000,[UnitsType.Miles]:1609344,[UnitsType.Yards]:914.4};return scale[unit]??null;
}
function arcPoints(center:{x:number;y:number},radius:number,start:number,end:number):Point[]{
  const tau=2*Math.PI;let sweep=end-start;while(sweep<0)sweep+=tau;if(Math.abs(sweep)<1e-10)sweep=tau;
  const count=Math.max(4,Math.ceil(sweep/tau*128));return Array.from({length:count+1},(_,i)=>({x:center.x+radius*Math.cos(start+sweep*i/count),y:center.y+radius*Math.sin(start+sweep*i/count)}));
}
export function importDWG(bytes:ArrayBuffer,name='CAD 圖案'):CustomShape{
  if(bytes.byteLength>10_000_000)throw new Error('DWG 超過 10 MB，請先保留單一圖案或簡化檔案。');
  const signature=new TextDecoder().decode(new Uint8Array(bytes,0,Math.min(6,bytes.byteLength)));
  if(!/^AC10\d\d$/.test(signature))throw new Error('檔案不是有效 DWG；請勿只修改副檔名。');
  let doc;try{doc=DwgReader.readFromStream(bytes);}catch{throw new Error('DWG 解析失敗。請在 CAD 軟體中另存較早版本，並將區塊炸開為封閉 2D Polyline 後重試。');}
  if(!doc.modelSpace||!doc.header)throw new Error('DWG 沒有可讀取的模型空間。');
  const unit=doc.header.insUnits,factor=cadUnitToMm(unit),warnings:string[]=[];
  if(factor===null)warnings.push('CAD 檔案未指定可換算的長度單位，保留為無單位；請在加入後確認圖案寬高。');
  const closed:Point[][]=[],segments:Point[][]=[];let skipped=0,count=0;
  for(const entity of doc.modelSpace.entities){
    if(++count>10000)throw new Error('CAD 實體過多，請先只保留單一圖案。');
    if('normal' in entity){const n=entity.normal as {x:number;y:number;z:number};if(Math.abs(n.x)>1e-7||Math.abs(n.y)>1e-7||n.z<.999999)throw new Error('目前支援 World XY 平面的 2D 輪廓，請先將斜面或反向法線幾何轉平。');}
    if(entity instanceof Arc){segments.push(arcPoints(entity.center,entity.radius,entity.startAngle,entity.endAngle));}
    else if(entity instanceof Circle){closed.push(arcPoints(entity.center,entity.radius,0,Math.PI*2));}
    else if(entity instanceof LwPolyline||entity instanceof Polyline2D){
      if((entity instanceof LwPolyline&&entity.constantWidth>0)||(entity instanceof LwPolyline?entity.vertices:Array.from(entity.vertices)).some(v=>'startWidth' in v&&((v.startWidth as number)>0||(v.endWidth as number)>0)))throw new Error('Polyline 包含線寬，請先轉成封閉外框。');
      const points=entity.getPoints(128).map(p=>({x:p.x,y:p.y}));if(points.length<2)continue;(entity.isClosed?closed:segments).push(points);
    }else if(entity instanceof Line){if(Math.abs(entity.startPoint.z-entity.endPoint.z)>1e-7)throw new Error('CAD 含有立體線段，請先轉成平面輪廓。');segments.push([{x:entity.startPoint.x,y:entity.startPoint.y},{x:entity.endPoint.x,y:entity.endPoint.y}]);}
    else skipped++;
  }
  if(closed.reduce((n,c)=>n+c.length,0)+segments.reduce((n,c)=>n+c.length,0)>20000)throw new Error('CAD 輪廓節點過多，請先簡化。');
  const b=bounds([...closed,...segments]),tolerance=Math.max(1,b.width,b.height)*1e-7;
  const near=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)<=tolerance;
  const used=new Set<number>();
  for(let i=0;i<segments.length;i++){
    if(used.has(i))continue;used.add(i);const chain=[...segments[i]];
    for(let step=0;step<=segments.length;step++){
      if(near(chain[0],chain.at(-1)!)){closed.push(chain);break;}
      const candidates: {index:number;reverse:boolean}[]=[];
      for(let j=0;j<segments.length;j++)if(!used.has(j)){if(near(chain.at(-1)!,segments[j][0]))candidates.push({index:j,reverse:false});else if(near(chain.at(-1)!,segments[j].at(-1)!))candidates.push({index:j,reverse:true});}
      if(candidates.length!==1)throw new Error('CAD 含有未封閉或分岔的 Arc／Line，請先接合成封閉 Polyline。');
      const next=candidates[0];used.add(next.index);const part=next.reverse?[...segments[next.index]].reverse():segments[next.index];chain.push(...part.slice(1));
    }
  }
  if(skipped)warnings.push(`略過 ${skipped} 個不支援的 CAD 實體（例如文字、標註、區塊或 Hatch）；請確認向量預覽。`);
  warnings.push('曲線以折線近似；CAD 封閉輪廓採奇偶規則解讀孔洞。');
  const scale=factor??1,points=closed.map(c=>c.map(p=>({x:p.x*scale,y:-p.y*scale})));
  return makeCustomShape(mergeGeometry([filledGeometry(points,'evenodd')]),{name,source:'DWG',unit:factor===null?'unitless':'mm',warnings});
}
