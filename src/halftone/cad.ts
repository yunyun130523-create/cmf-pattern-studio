import { Arc, Circle, DwgReader, Line, LwPolyline, Polyline2D } from '@node-projects/acad-ts';
import { cadUnitToMm } from '../custom/dwg';
import { bounds } from '../custom/geometry';
import { imageFromRGBA, type CADScene, type SampleImage } from './model';
import type { Point } from '../engine';
export function parseCADImage(bytes:ArrayBuffer):CADScene{
 if(bytes.byteLength>10000000||!/^AC10\d\d$/.test(new TextDecoder().decode(new Uint8Array(bytes,0,Math.min(6,bytes.byteLength)))))throw new Error('請選擇 10 MB 以下的真正 DWG。');let doc;try{doc=DwgReader.readFromStream(bytes);}catch{throw new Error('DWG 版本無法解析。請以本機 CAD 另存 R2000，或轉成 SVG／DXF 後以向量軟體匯出 PNG 再上傳。');}
 if(!doc.header||!doc.modelSpace)throw new Error('DWG 缺少模型空間。');const f=cadUnitToMm(doc.header.insUnits),paths:CADScene['paths']=[],warnings:string[]=[];let skipped=0,count=0,nodes=0;
 for(const e of doc.modelSpace.entities){if(++count>10000)throw new Error('CAD 實體過多，請先簡化。');if(e.isInvisible||!e.layer.isOn||(e.layer.layerFlags&1))continue;if('normal' in e){const n=e.normal as {x:number;y:number;z:number};if(Math.abs(n.x)>1e-6||Math.abs(n.y)>1e-6||n.z<.999999)throw new Error('目前只取樣 World XY 平面，請先將 CAD 轉平。');}
 let points:Point[]=[],closed=false;
 if(e instanceof Arc){let sweep=e.endAngle-e.startAngle;while(sweep<0)sweep+=Math.PI*2;const count=Math.max(2,Math.ceil(sweep/Math.PI/2*128));points=Array.from({length:count+1},(_,i)=>({x:e.center.x+e.radius*Math.cos(e.startAngle+sweep*i/count),y:e.center.y+e.radius*Math.sin(e.startAngle+sweep*i/count)}));}
 else if(e instanceof Circle){points=Array.from({length:128},(_,i)=>({x:e.center.x+e.radius*Math.cos(i*Math.PI/64),y:e.center.y+e.radius*Math.sin(i*Math.PI/64)}));closed=true;}
 else if(e instanceof LwPolyline||e instanceof Polyline2D){points=e.getPoints(128).map(p=>({x:p.x,y:p.y}));closed=e.isClosed;}
 else if(e instanceof Line){if(Math.abs(e.startPoint.z-e.endPoint.z)>1e-6)throw new Error('CAD 含立體線段，請先轉平。');points=[e.startPoint,e.endPoint].map(p=>({x:p.x,y:p.y}));}
 else{skipped++;continue;}
 nodes+=points.length;if(nodes>30000||paths.length>=2000)throw new Error('CAD 輪廓過多，請只保留需要的圖層。');points=points.map(p=>({x:p.x*(f??1),y:-p.y*(f??1)||0}));if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e12||Math.abs(p.y)>1e12))throw new Error('CAD 座標超出範圍。');if(points.length>=2)paths.push({points,closed,layer:e.layer.name});
 }
 const b=bounds(paths.map(p=>p.points));if(!paths.length||!Number.isFinite(b.width)||Math.max(b.width,b.height)<1e-9)throw new Error('CAD 沒有可顯示的平面幾何。');
 if(skipped)warnings.push(`略過 ${skipped} 個文字、區塊、Hatch 或其他未支援實體。請先炸開區塊並檢查預覽。`);if(f===null)warnings.push('DWG 未指定可換算單位，以無單位顯示。');warnings.push('CAD 曲線以折線近似；關閉及凍結圖層不取樣。');
 return{paths,unit:f===null?'unitless':'mm',warnings};
}
export function rasterizeCAD(scene:CADScene,name:string,selectedLayers?:string[],fill=false,lineWidth=2):SampleImage{
 const layers=[...new Set(scene.paths.map(p=>p.layer))],selected=selectedLayers??layers,b=bounds(scene.paths.map(p=>p.points)),bw=Math.max(b.width,1e-6),bh=Math.max(b.height,1e-6),f=720/Math.max(bw,bh),width=Math.max(16,Math.ceil(bw*f)+32),height=Math.max(16,Math.ceil(bh*f)+32),rgba=new Uint8Array(width*height*4);rgba.fill(255);
 const mapped=scene.paths.filter(p=>selected.includes(p.layer)).map(p=>({...p,points:p.points.map(pt=>({x:(pt.x-b.minX)*f+16,y:(pt.y-b.minY)*f+16}))}));
 const mark=(x:number,y:number)=>{if(x>=0&&y>=0&&x<width&&y<height){const k=(Math.floor(y)*width+Math.floor(x))*4;rgba[k]=rgba[k+1]=rgba[k+2]=0;}};
 if(fill)for(const layer of layers){const contours=mapped.filter(p=>p.closed&&p.layer===layer).map(p=>p.points);for(let y=0;y<height;y++){const cuts:number[]=[];for(const ring of contours)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],c=ring[i];if((a.y>y+.5)!==(c.y>y+.5))cuts.push(a.x+(y+.5-a.y)*(c.x-a.x)/(c.y-a.y));}cuts.sort((a,b)=>a-b);for(let i=0;i+1<cuts.length;i+=2)for(let x=Math.max(0,Math.ceil(cuts[i]-.5));x<Math.min(width,cuts[i+1]-.5);x++)mark(x,y);}}
 for(const path of mapped){const pts=path.closed?[...path.points,path.points[0]]:path.points;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*2));for(let k=0;k<=n;k++){const x=a.x+(b.x-a.x)*k/n,y=a.y+(b.y-a.y)*k/n;for(let yy=Math.floor(y-lineWidth/2);yy<=Math.ceil(y+lineWidth/2);yy++)for(let xx=Math.floor(x-lineWidth/2);xx<=Math.ceil(x+lineWidth/2);xx++)if(Math.hypot(xx+.5-x,yy+.5-y)<=Math.max(.6,lineWidth/2))mark(xx,yy);}}}
 return imageFromRGBA(rgba,width,height,{name,format:'DWG',cad:{unit:scene.unit,width:bw,height:bh,layers,selectedLayers:selected,scene,fill,lineWidth},warnings:scene.warnings});
}
