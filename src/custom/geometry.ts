import polygonClipping from 'polygon-clipping';
import type { Point } from '../engine';
export interface CustomShape {
  id: `custom:${string}`; name: string; source: 'SVG'|'PNG'|'DWG';
  contours: Point[][]; sourceWidth: number; sourceHeight: number;
  unit: 'px'|'mm'|'unitless'; warnings: string[]; updatedAt: number;
}
export const MAX_POINTS=5000, MAX_CONTOURS=128, MAX_SHAPES=20;
export function signedArea(p:Point[]):number{return p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y;},0)/2;}
export function pathData(contours:Point[][]):string{return contours.map(p=>'M'+p.map(q=>`${Number(q.x.toFixed(6))},${Number(q.y.toFixed(6))}`).join('L')+'Z').join(' ');}
export function bounds(contours:Point[][]){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const p of contours.flat()){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}
  return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY};
}
export function pointInside(p:Point,ring:Point[]):boolean{
  let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }return inside;
}
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
export function selfIntersects(ring:Point[]):boolean{
  for(let i=0;i<ring.length;i++)for(let j=i+2;j<ring.length;j++){
    if(i===0&&j===ring.length-1)continue;
    const a=ring[i],b=ring[(i+1)%ring.length],c=ring[j],d=ring[(j+1)%ring.length];
    if(Math.max(a.x,b.x)<Math.min(c.x,d.x)||Math.max(c.x,d.x)<Math.min(a.x,b.x)||Math.max(a.y,b.y)<Math.min(c.y,d.y)||Math.max(c.y,d.y)<Math.min(a.y,b.y))continue;
    if(cross(a,b,c)*cross(a,b,d)<-1e-18&&cross(c,d,a)*cross(c,d,b)<-1e-18)return true;
  }return false;
}
export function cleanRing(input:Point[]):Point[]{
  const result:Point[]=[];
  for(const p of input){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e9||Math.abs(p.y)>1e9)throw new Error('圖案包含無效或過大的座標。');if(!result.length||Math.hypot(p.x-result.at(-1)!.x,p.y-result.at(-1)!.y)>1e-9)result.push({x:p.x,y:p.y});}
  if(result.length>1&&Math.hypot(result[0].x-result.at(-1)!.x,result[0].y-result.at(-1)!.y)<1e-9)result.pop();
  if(result.length<3||Math.abs(signedArea(result))<1e-12)throw new Error('輪廓沒有有效的封閉面積。');
  if(selfIntersects(result))throw new Error('輪廓有自我交叉，請先在向量軟體中簡化或合併路徑。');
  return result;
}
type Multi=polygonClipping.MultiPolygon;
const geometry=(ring:Point[]):Multi=>[[[...ring.map(p=>[p.x,p.y] as [number,number]),[ring[0].x,ring[0].y]]]];
export function filledGeometry(input:Point[][],rule:'evenodd'|'nonzero'='evenodd'):Multi{
  const rings=input.map(cleanRing);let result:Multi=[];
  if(rule==='evenodd'){
    for(const ring of rings){const g=geometry(ring);result=result.length?polygonClipping.difference(polygonClipping.union(result,g),polygonClipping.intersection(result,g)):g;}
    return result;
  }
  // Nonzero nested rings: only transitions between zero and nonzero winding change fill.
  const sorted=rings.map(r=>({ring:r,area:Math.abs(signedArea(r)),sign:Math.sign(signedArea(r)),winding:0})).sort((a,b)=>b.area-a.area);
  if(sorted.every(r=>r.sign===sorted[0]?.sign))return sorted.length?polygonClipping.union(geometry(sorted[0].ring),...sorted.slice(1).map(r=>geometry(r.ring))):[];
  for(let i=0;i<rings.length;i++)for(let j=i+1;j<rings.length;j++)for(let a=0;a<rings[i].length;a++)for(let b=0;b<rings[j].length;b++){
    const p=rings[i][a],q=rings[i][(a+1)%rings[i].length],r=rings[j][b],s=rings[j][(b+1)%rings[j].length];
    if(cross(p,q,r)*cross(p,q,s)<-1e-16&&cross(r,s,p)*cross(r,s,q)<-1e-16)throw new Error('同一路徑有交叉且方向不同的輪廓，請先布林合併或改用 evenodd 填色規則。');
  }
  for(let i=0;i<sorted.length;i++){
    const item=sorted[i];let parent=-1;
    for(let j=i-1;j>=0;j--)if(pointInside(item.ring[0],sorted[j].ring)){parent=j;break;}
    const before=parent<0?0:sorted[parent].winding;item.winding=before+item.sign;
    const g=geometry(item.ring);
    if(before===0)result=result.length?polygonClipping.union(result,g):g;
    else if(item.winding===0)result=polygonClipping.difference(result,g);
  }
  return result;
}
export function mergeGeometry(items:Multi[]):Point[][]{
  const nonempty=items.filter(g=>g.length);if(!nonempty.length)throw new Error('沒有可匯入的封閉填色輪廓。');
  const merged=nonempty.length===1?nonempty[0]:polygonClipping.union(nonempty[0],...nonempty.slice(1));
  const contours:Point[][]=[];
  for(const polygon of merged)polygon.forEach((r,i)=>{
    const ring=cleanRing(r.map(p=>({x:p[0],y:p[1]})));
    if((signedArea(ring)>0)!==(i===0))ring.reverse();contours.push(ring);
  });return contours;
}
export function makeCustomShape(contours:Point[][],meta:{name:string;source:CustomShape['source'];unit?:CustomShape['unit'];warnings?:string[]}):CustomShape{
  if(contours.length>MAX_CONTOURS||contours.reduce((n,c)=>n+c.length,0)>MAX_POINTS)throw new Error('圖案太複雜，請減少輪廓或節點後重新匯入。');
  const clean=contours.map(cleanRing),b=bounds(clean),scale=Math.max(b.width,b.height);
  if(!Number.isFinite(scale)||scale<=1e-9)throw new Error('圖案尺寸無效。');
  const cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;
  const normalized=clean.map(c=>c.map(p=>({x:(p.x-cx)/scale,y:(p.y-cy)/scale})));
  return{id:`custom:${crypto.randomUUID()}`,name:meta.name.trim().slice(0,80)||'自訂圖案',source:meta.source,unit:meta.unit??'px',sourceWidth:b.width,sourceHeight:b.height,contours:normalized,warnings:(meta.warnings??[]).slice(0,20),updatedAt:Date.now()};
}
export function validateCustomShape(raw:unknown):CustomShape{
  if(!raw||typeof raw!=='object')throw new Error('自訂圖案格式錯誤。');
  const s=raw as CustomShape;
  if(!/^custom:[a-zA-Z0-9_-]{1,64}$/.test(s.id)||typeof s.name!=='string'||!s.name.trim()||s.name.length>80||!['SVG','PNG','DWG'].includes(s.source)||!['px','mm','unitless'].includes(s.unit))throw new Error('自訂圖案識別資料錯誤。');
  if(!Number.isFinite(s.sourceWidth)||!Number.isFinite(s.sourceHeight)||s.sourceWidth<=0||s.sourceHeight<=0||!Number.isFinite(s.updatedAt))throw new Error('自訂圖案尺寸錯誤。');
  if(!Array.isArray(s.contours)||!s.contours.length||s.contours.length>MAX_CONTOURS||s.contours.reduce((n,c)=>n+(Array.isArray(c)?c.length:MAX_POINTS+1),0)>MAX_POINTS)throw new Error('自訂圖案太複雜。');
  const contours=s.contours.map(c=>{if(!Array.isArray(c))throw new Error('輪廓格式錯誤。');for(const p of c)if(!p||typeof p.x!=='number'||typeof p.y!=='number'||Math.abs(p.x)>.500001||Math.abs(p.y)>.500001)throw new Error('自訂圖案座標錯誤。');return cleanRing(c);});
  return{id:s.id,name:s.name,source:s.source,unit:s.unit,sourceWidth:s.sourceWidth,sourceHeight:s.sourceHeight,updatedAt:s.updatedAt,contours,warnings:Array.isArray(s.warnings)?s.warnings.filter(w=>typeof w==='string').map(w=>w.slice(0,250)).slice(0,20):[]};
}
export function morphRestriction(shape:CustomShape):string|null{
  if(shape.contours.length!==1)return'多輪廓或含孔洞圖案可正常排列，但目前不支援安全形狀變形。';
  const ring=shape.contours[0];if(ring.length>1024)return'輪廓節點過多，請簡化後再啟用形狀變形。';
  let sign=0;
  for(let i=0;i<ring.length;i++){const c=cross(ring[i],ring[(i+1)%ring.length],ring[(i+2)%ring.length]);if(Math.abs(c)<1e-10)continue;const next=Math.sign(c);if(sign&&next!==sign)return'此圖案為凹形；目前只對單一凸封閉輪廓進行安全變形，可繼續使用排列與漸變。';sign=next;}
  return pointInside({x:0,y:0},ring)?null:'圖案中心不在輪廓內，無法保證安全插值。';
}
export function rayRadius(ring:Point[],angle:number):number{
  const dx=Math.cos(angle),dy=Math.sin(angle);let r=Infinity;
  for(let i=0;i<ring.length;i++){const p=ring[i],q=ring[(i+1)%ring.length],ex=q.x-p.x,ey=q.y-p.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-12)continue;const t=(p.x*ey-p.y*ex)/den,u=(p.x*dy-p.y*dx)/den;if(t>=-1e-9&&u>=-1e-9&&u<=1+1e-9)r=Math.min(r,Math.max(0,t));}
  if(!Number.isFinite(r)||r<1e-10)throw new Error('無法建立安全的共同輪廓取樣。');return r;
}
export function compatibleOutlines(from:Point[],to:Point[]):[Point[],Point[]]{
  const angles:number[]=[];const tau=2*Math.PI;
  for(const p of [...from,...to]){const a=((Math.atan2(p.y,p.x)+Math.PI/2)%tau+tau)%tau;if(!angles.some(b=>Math.abs(a-b)<1e-9||Math.abs(Math.abs(a-b)-tau)<1e-9))angles.push(a);}
  for(let i=0;i<96;i++){const a=i*tau/96;if(!angles.some(b=>Math.abs(a-b)<1e-9))angles.push(a);}
  angles.sort((a,b)=>a-b);
  const sample=(ring:Point[])=>angles.map(a=>{const theta=a-Math.PI/2,r=rayRadius(ring,theta);return{x:Math.cos(theta)*r,y:Math.sin(theta)*r};});
  return[sample(from),sample(to)];
}
