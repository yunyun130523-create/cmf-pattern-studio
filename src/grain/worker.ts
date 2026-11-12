import { createGrainRenderer } from './engine';
import type { Settings } from '../engine';
import type { SampleImage } from '../halftone/model';
let photo:SampleImage|null=null,texture:SampleImage|null=null;const render=createGrainRenderer();
self.onmessage=(e:MessageEvent<{id:number;kind:'preview'|'export';settings:Settings;revision:number;width:number;height:number;photoId?:string;textureId?:string}>)=>{const {id,kind,settings,revision,width,height,photoId,textureId}=e.data;try{
 if(settings.halftone.image)photo=settings.halftone.image;if(settings.grain.image)texture=settings.grain.image;if(photoId&&photo?.id!==photoId||textureId&&texture?.id!==textureId)throw new Error('材質圖片快取遺失，請重新載入圖片。');
 const s={...settings,halftone:{...settings.halftone,image:photoId?photo:null},grain:{...settings.grain,image:textureId?texture:null}},result=render(s,width,height,revision);
 self.postMessage({id,kind,result},{transfer:[result.color.buffer,result.heightMap.buffer,result.normal.buffer,result.roughness.buffer]});
 }catch(e){self.postMessage({id,kind,error:e instanceof Error?e.message:'咬花材質運算失敗。'});}};
