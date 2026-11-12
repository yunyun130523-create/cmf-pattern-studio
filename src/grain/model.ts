import { validateImage, type SampleImage } from '../halftone/model';
export type GrainType='leather'|'fine'|'coarse'|'image';
export type PatternFinish='none'|'emboss'|'deboss'|'inside'|'outside'|'gloss';
export type GrainChannel='color'|'height'|'normal'|'roughness';
export interface GrainSettings {enabled:boolean;type:GrainType;size:number;depth:number;gloss:number;color:string;seed:number;patternMode:PatternFinish;patternDepth:number;patternStrength:number;patternGloss:number;bevel:number;lightAngle:number;lightElevation:number;relief:number;normalStrength:number;scuffs:number;image:SampleImage|null;invert:boolean;tiles:1|2|3;channel:GrainChannel;exportSize:512|1024|2048;dpi:72|96|150|300}
export const GRAIN_DEFAULTS:GrainSettings={enabled:false,type:'leather',size:2.8,depth:.12,gloss:15,color:'#3B3530',seed:7,patternMode:'none',patternDepth:.25,patternStrength:100,patternGloss:75,bevel:.35,lightAngle:135,lightElevation:55,relief:3,normalStrength:1,scuffs:0,image:null,invert:false,tiles:1,channel:'color',exportSize:1024,dpi:300};
export const GRAIN_NAMES:Record<GrainType,string>={leather:'皮紋咬花',fine:'細咬花',coarse:'粗咬花',image:'自訂高度紋理'};
export const FINISH_NAMES:Record<PatternFinish,string>={none:'純咬花材質',emboss:'Pattern 凸起浮雕',deboss:'Pattern 凹刻壓紋',inside:'僅圖案內咬花',outside:'圖案外咬花／圖案留平',gloss:'Pattern 光澤差異'};
export const GRAIN_PRESETS={leather:{type:'leather',size:2.8,depth:.12,gloss:15,color:'#3B3530'},fine:{type:'fine',size:.6,depth:.035,gloss:8,color:'#26282B'},coarse:{type:'coarse',size:4.2,depth:.3,gloss:12,color:'#353936'}} as const;
export function validateGrain(raw:unknown):GrainSettings{
 if(!raw||typeof raw!=='object')throw new Error('咬花材質參數無效。');const r=raw as GrainSettings,out={...GRAIN_DEFAULTS};
 for(const [key,[lo,hi]] of Object.entries({size:[.1,80],depth:[0,1.5],gloss:[0,100],seed:[0,2147483647],patternDepth:[0,2],patternStrength:[0,100],patternGloss:[0,100],bevel:[0,3],lightAngle:[0,360],lightElevation:[10,90],relief:[0,8],normalStrength:[0,4],scuffs:[0,100]})){const n=r[key as keyof GrainSettings];if(typeof n!=='number'||!Number.isFinite(n)||n<lo||n>hi)throw new Error('咬花參數超出範圍：'+key);Object.assign(out,{[key]:n});}
 if(!Number.isInteger(r.seed)||!Object.hasOwn(GRAIN_NAMES,r.type)||!Object.hasOwn(FINISH_NAMES,r.patternMode)||!['color','height','normal','roughness'].includes(r.channel)||![1,2,3].includes(r.tiles)||![512,1024,2048].includes(r.exportSize)||![72,96,150,300].includes(r.dpi)||typeof r.enabled!=='boolean'||typeof r.invert!=='boolean'||!/^#[0-9a-fA-F]{6}$/.test(r.color))throw new Error('咬花類型、配色或匯出設定無效。');
 const image=r.image===null?null:validateImage(r.image);if(r.type==='image'&&!image)throw new Error('自訂咬花缺少高度圖片。');
 return{...out,enabled:r.enabled,type:r.type,patternMode:r.patternMode,color:r.color,image,invert:r.invert,tiles:r.tiles as 1|2|3,channel:r.channel,exportSize:r.exportSize,dpi:r.dpi};
}
