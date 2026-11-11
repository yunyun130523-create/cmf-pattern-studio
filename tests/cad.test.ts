// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DwgReader, LwPolyline, UnitsType } from '@node-projects/acad-ts';
import { LibreDwg, Dwg_File_Type } from '@mlightcad/libredwg-web';
import { dwgBytes } from '../src/cad';
import { DEFAULTS, generatePattern } from '../src/engine';
const settings={...DEFAULTS,width:240,height:200,spacingX:35,spacingY:35};
describe('real DWG R2000 export',()=>{
  it('writes genuine DWG with closed contours, boundary and mm units',()=>{
    const bytes=dwgBytes(settings,'mm');expect(new TextDecoder().decode(bytes.slice(0,6))).toBe('AC1015');
    const doc=DwgReader.readFromStream(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer);
    expect(doc.header?.insUnits).toBe(UnitsType.Millimeters);
    const entities=Array.from(doc.modelSpace!.entities);expect(entities).toHaveLength(generatePattern(settings).glyphs.length+1);
    expect(entities.every(e=>e instanceof LwPolyline && e.isClosed)).toBe(true);
    const boundary=entities[0] as LwPolyline;expect(boundary.vertices[1].location.x).toBeCloseTo(settings.width*25.4/96,5);
  });
  it('independently reads the exported DWG with LibreDWG',async()=>{
    const bytes=dwgBytes(settings,'px');
    const lib=await LibreDwg.create(new URL('../node_modules/@mlightcad/libredwg-web/wasm/',import.meta.url).pathname);
    const ptr=lib.dwg_read_data(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer,Dwg_File_Type.DWG);
    expect(ptr).toBeTruthy();if(!ptr)throw new Error('Independent DWG reader failed');
    try {const db=lib.convert(ptr);expect(db.entities.length).toBeGreaterThanOrEqual(generatePattern(settings).glyphs.length+1);}
    finally{lib.dwg_free(ptr);}
  },30000);
});
