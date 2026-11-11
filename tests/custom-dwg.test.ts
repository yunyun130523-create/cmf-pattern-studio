// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ACadVersion, Arc, CadDocument, Circle, DwgWriter, Line, LwPolyline, LwPolylineVertex, UnitsType, XY, XYZ, type Entity } from '@node-projects/acad-ts';
import { importDWG } from '../src/custom/dwg';
import { signedArea } from '../src/custom/geometry';
function file(entities:Entity[],unit=UnitsType.Millimeters){const doc=new CadDocument();doc.header!.version=ACadVersion.AC1015;doc.header!.insUnits=unit;entities.forEach(e=>doc.modelSpace!.entities.add(e));const b=DwgWriter.writeToBuffer(doc);return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;}
function rect(w=20,h=10){const p=new LwPolyline([[0,0],[w,0],[w,h],[0,h]].map(([x,y])=>new LwPolylineVertex(new XY(x,y))));p.isClosed=true;return p;}
describe('真正 DWG 本機解析',()=>{
 it('匯入封閉 Polyline，保留 20 × 10 mm 及比例',()=>{const s=importDWG(file([rect()]));expect(s.source).toBe('DWG');expect(s.unit).toBe('mm');expect(s.sourceWidth).toBeCloseTo(20);expect(s.sourceHeight).toBeCloseTo(10);expect(s.contours[0]).toHaveLength(4);});
 it('正確將英寸轉成 mm',()=>{const s=importDWG(file([rect(2,1)],UnitsType.Inches));expect(s.sourceWidth).toBeCloseTo(50.8);expect(s.sourceHeight).toBeCloseTo(25.4);});
 it('未指定單位時不假裝成 mm',()=>{const s=importDWG(file([rect()],UnitsType.Unitless));expect(s.unit).toBe('unitless');expect(s.warnings.join()).toMatch(/未指定/);});
 it('Circle 及孔洞轉換成向量閉合輪廓',()=>{const a=new Circle();a.center=new XYZ(0,0,0);a.radius=10;const b=new Circle();b.center=new XYZ(0,0,0);b.radius=5;const s=importDWG(file([a,b]));expect(s.contours).toHaveLength(2);expect(s.sourceWidth).toBeCloseTo(20);expect(s.contours.reduce((n,c)=>n+signedArea(c),0)).toBeCloseTo(Math.PI*.75/4,2);});
 it('接合 Arc 與 Line 成為封閉半圓',()=>{const a=new Arc();a.center=new XYZ(0,0,0);a.radius=10;a.startAngle=0;a.endAngle=Math.PI;const l=new Line();l.startPoint=new XYZ(-10,0,0);l.endPoint=new XYZ(10,0,0);const s=importDWG(file([a,l]));expect(s.sourceWidth).toBeCloseTo(20);expect(s.sourceHeight).toBeCloseTo(10);});
 it('Polyline 的 bulge 曲線確實取樣',()=>{const p=rect();p.vertices[0].bulge=.5;const s=importDWG(file([p]));expect(s.contours[0].length).toBeGreaterThan(4);});
 it('拒絕改副檔名的 DXF 或開放 CAD 輪廓',()=>{expect(()=>importDWG(new TextEncoder().encode('0\nSECTION\n').buffer)).toThrow(/不是有效/);const l=new Line();l.startPoint=new XYZ(0,0,0);l.endPoint=new XYZ(10,0,0);expect(()=>importDWG(file([l]))).toThrow(/未封閉/);});
});
