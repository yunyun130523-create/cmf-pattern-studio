import { ACadVersion, CadDocument, DwgWriter, Layer, LwPolyline, LwPolylineVertex, XY, UnitsType } from '@node-projects/acad-ts';
import { generatePattern, type Settings } from './engine';
import { cadContours } from './exports';

export function dwgBytes(settings: Settings, unit:'mm'|'px'): Uint8Array {
  const doc=new CadDocument();
  if(!doc.header||!doc.layers||!doc.modelSpace)throw new Error('無法初始化 CAD 文件。');
  doc.header.version=ACadVersion.AC1015;
  doc.header.insUnits=unit==='mm'?UnitsType.Millimeters:UnitsType.Unitless;
  const patternLayer=new Layer('PATTERN'), boundaryLayer=new Layer('BOUNDARY');
  doc.layers.add(patternLayer);doc.layers.add(boundaryLayer);
  const pattern=generatePattern(settings), factor=unit==='mm'?25.4/96:1;
  const add=(points:{x:number;y:number}[],layer:Layer)=>{
    const poly=new LwPolyline(points.map(p=>new LwPolylineVertex(new XY(p.x,p.y))));
    poly.isClosed=true;poly.layer=layer;doc.modelSpace!.entities.add(poly);
  };
  add([{x:0,y:0},{x:settings.width*factor,y:0},{x:settings.width*factor,y:settings.height*factor},{x:0,y:settings.height*factor}],boundaryLayer);
  cadContours(settings,pattern,unit).forEach(points=>add(points,patternLayer));
  const bytes=DwgWriter.writeToBuffer(doc);
  if(new TextDecoder().decode(bytes.slice(0,6))!=='AC1015')throw new Error('DWG 檔案驗證失敗。');
  return bytes;
}
