import { parseCADImage, rasterizeCAD } from './cad';
self.onmessage=e=>{try{const {bytes,name,scene,layers,fill,lineWidth}=e.data;self.postMessage({image:rasterizeCAD(scene??parseCADImage(bytes),name,layers,fill,lineWidth)});}catch(e){self.postMessage({error:e instanceof Error?e.message:'CAD 圖像取樣失敗。'});}};
