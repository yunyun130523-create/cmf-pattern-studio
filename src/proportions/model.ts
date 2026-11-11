import type { Shape } from '../engine';
export interface ShapeProportions {x:number;y:number;locked:boolean;rotation:number;triangleBase:number;apexX:number;apexY:number;hexDirection:'flat'|'pointy';corner:number}
export interface ProportionSettings {start:Record<string,ShapeProportions>;end:Record<string,ShapeProportions>}
export type Endpoint='start'|'end';
export const DEFAULT_PROPORTION:ShapeProportions={x:100,y:100,locked:true,rotation:0,triangleBase:100,apexX:0,apexY:0,hexDirection:'flat',corner:0};
export const DEFAULT_PROPORTIONS:ProportionSettings={start:{},end:{}};
export function getProportion(settings:ProportionSettings,shape:Shape,endpoint:Endpoint='start'):ShapeProportions{return settings[endpoint][shape]??DEFAULT_PROPORTION;}
export function neutralProportion(p:ShapeProportions,shape:Shape):boolean{return p.x===100&&p.y===100&&p.rotation%360===0&&(shape!=='triangle'||p.triangleBase===100&&p.apexX===0&&p.apexY===0)&&(shape!=='hexagon'||p.hexDirection==='flat')&&(!['square','rectangle'].includes(shape)||p.corner===0);}
/** Lock preserves the current X:Y ratio, including when re-locking an asymmetric shape. */
export function resizeProportion(p:ShapeProportions,axis:'x'|'y',value:number):ShapeProportions{const n=Math.min(300,Math.max(10,value));if(!p.locked)return{...p,[axis]:n};const other=axis==='x'?'y':'x',ratio=p[other]/p[axis],actual=Math.min(300,300/ratio,Math.max(10,10/ratio,n));return{...p,[axis]:actual,[other]:actual*ratio};}
export function validateProportions(raw:unknown,shapes:string[]):ProportionSettings{
 if(!raw||typeof raw!=='object')throw new Error('圖形比例資料無效。');const r=raw as ProportionSettings,result:ProportionSettings={start:{},end:{}};
 for(const endpoint of ['start','end'] as const){const bank=r[endpoint];if(!bank||typeof bank!=='object'||Array.isArray(bank)||Object.keys(bank).length>26)throw new Error('圖形比例數量無效。');for(const [shape,p] of Object.entries(bank)){
 if(!shapes.includes(shape)||!p||typeof p!=='object')throw new Error('比例設定指向不存在的圖案。');const limits={x:[10,300],y:[10,300],rotation:[0,360],triangleBase:[10,300],apexX:[-100,100],apexY:[-100,100],corner:[0,50]};for(const [key,[lo,hi]] of Object.entries(limits)){const v=p[key as keyof ShapeProportions];if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw new Error('圖形比例超出範圍：'+key);}if(typeof p.locked!=='boolean'||!['flat','pointy'].includes(p.hexDirection))throw new Error('圖形比例開關或方向無效。');
 result[endpoint][shape]={x:p.x,y:p.y,locked:p.locked,rotation:p.rotation,triangleBase:p.triangleBase,apexX:p.apexX,apexY:p.apexY,hexDirection:p.hexDirection,corner:p.corner};}}
 return result;
}
