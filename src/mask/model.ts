import { validateImage, type SampleImage } from '../halftone/model';
export interface RangeMask {enabled:boolean;image:SampleImage|null;source:'auto'|'alpha'|'dark';threshold:number;invert:boolean;feather:number;gradient:'boundary'|'directional';fit:'contain'|'stretch';scale:number;offsetX:number;offsetY:number}
export const MASK_DEFAULTS:RangeMask={enabled:false,image:null,source:'auto',threshold:50,invert:false,feather:15,gradient:'boundary',fit:'contain',scale:100,offsetX:0,offsetY:0};
export function validateMask(raw:unknown):RangeMask{
 if(!raw||typeof raw!=='object')throw new Error('漸變範圍參數無效。');const r=raw as RangeMask;
 for(const [k,lo,hi] of [['threshold',1,99],['feather',.1,100],['scale',10,300],['offsetX',-150,150],['offsetY',-150,150]] as const)if(!Number.isFinite(r[k])||r[k]<lo||r[k]>hi)throw new Error('範圍參數超出限制：'+k);
 if(typeof r.enabled!=='boolean'||typeof r.invert!=='boolean'||!['auto','alpha','dark'].includes(r.source)||!['boundary','directional'].includes(r.gradient)||!['contain','stretch'].includes(r.fit))throw new Error('範圍設定無效。');
 const image=r.image===null?null:validateImage(r.image);if(r.enabled&&!image)throw new Error('尚未載入漸變範圍圖片。');return{enabled:r.enabled,image,source:r.source,threshold:r.threshold,invert:r.invert,feather:r.feather,gradient:r.gradient,fit:r.fit,scale:r.scale,offsetX:r.offsetX,offsetY:r.offsetY};
}
