import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import App from '../src/App';
import { DEFAULTS, generatePattern, parseProject, projectJSON, svgDocument, type Settings } from '../src/engine';
import { HALFTONE_DEFAULTS, imageFromRGBA, type SampleImage } from '../src/halftone/model';
import { packPattern } from '../src/halftone/engine';
import * as decode from '../src/halftone/image';
import * as exports from '../src/exports';
import { saveLibrary } from '../src/custom/storage';
let cached:SampleImage|null=null;const requests:any[]=[],results:any[]=[];
const context={scale:vi.fn(),fillRect:vi.fn(),clearRect:vi.fn(),drawImage:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),closePath:vi.fn(),fill:vi.fn(),putImageData:vi.fn(),createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)})};
class TestWorker{onmessage:((e:MessageEvent)=>void)|null=null;onerror:null=null;terminated=false;terminate(){this.terminated=true;}postMessage(data:any){requests.push(data);queueMicrotask(()=>{if(this.terminated)return;if(data.settings.halftone.image)cached=data.settings.halftone.image;const settings={...data.settings,halftone:{...data.settings.halftone,image:cached}} as Settings;const p=generatePattern(settings);const result=data.kind==='preview'?{id:data.id,kind:data.kind,packed:packPattern(p)}:{id:data.id,kind:data.kind,text:svgDocument(settings,p)};results.push(result);this.onmessage?.({data:result} as MessageEvent);});}}
const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++)data.set([x*8,x*8,x*8,255],(y*32+x)*4);const image=imageFromRGBA(data,32,32,{name:'mountain.jpg',format:'JPEG'});
beforeEach(async()=>{cached=null;requests.length=0;results.length=0;Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true});await saveLibrary([]);localStorage.setItem('cmf-pattern-studio-v1',projectJSON({...DEFAULTS,width:240,height:200}));vi.stubGlobal('Worker',TestWorker);vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);vi.spyOn(decode,'decodePhotograph').mockResolvedValue(image);vi.spyOn(exports,'downloadBlob').mockImplementation(()=>{});});
afterEach(()=>{vi.unstubAllGlobals();});
async function upload(){fireEvent.click(screen.getByRole('button',{name:'圖片轉點陣'}));fireEvent.change(screen.getByLabelText('點陣來源圖片檔案'),{target:{files:[new File(['jpg'],'mountain.jpg',{type:'image/jpeg'})]}});await screen.findByLabelText('圖片轉換模式');await waitFor(()=>expect(results.some(x=>x.packed)).toBe(true));}
const slider=(name:string,value:number)=>fireEvent.change(screen.getByRole('slider',{name}),{target:{value}});
describe('圖片點陣完整操作',()=>{
 it('上傳 JPG、Canvas 預覽、尺寸密度對比與兩模式切換、三角形、SVG 匯出',async()=>{
  render(<App/>);await upload();expect(decode.decodePhotograph).toHaveBeenCalled();expect(screen.getByTestId('halftone-canvas')).toBeInTheDocument();await waitFor(()=>expect(context.fill).toHaveBeenCalled());const first=results.at(-1).packed.count;
  slider('最大點尺寸',4);slider('點陣密度',60);slider('圖片對比',1.7);fireEvent.change(screen.getByLabelText('圖片轉換模式'),{target:{value:'sparse'}});fireEvent.change(screen.getByLabelText('點陣形狀'),{target:{value:'triangle'}});
  await waitFor(()=>expect(requests.at(-1).settings.shape).toBe('triangle'));expect(requests.at(-1).settings.halftone.contrast).toBe(1.7);expect(results.at(-1).packed.count).toBeLessThan(first);
  fireEvent.click(screen.getByRole('button',{name:'匯出 SVG'}));fireEvent.click(screen.getByRole('button',{name:'下載 SVG'}));await waitFor(()=>expect(exports.downloadBlob).toHaveBeenCalled());const blob=vi.mocked(exports.downloadBlob).mock.calls.at(-1)![0];const text=await new Promise<string>(resolve=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.readAsText(blob);});expect(text).toContain('<path d="M');expect(text).not.toContain('<image');
 });
 it('裁切、縮放、位置、等比例與五種排列皆可操作，移除後回到幾何模式',async()=>{
  render(<App/>);await upload();slider('圖片縮放',2);slider('圖片位置 X',12);slider('圖片位置 Y',-8);slider('裁切起點 X',20);slider('裁切寬度',60);fireEvent.click(screen.getByRole('checkbox',{name:'圖片等比例縮放'}));slider('圖片垂直縮放',1.5);
  for(const layout of ['matrix','stagger','hex','random','gradient']){fireEvent.change(screen.getByLabelText('點陣排列方式'),{target:{value:layout}});expect(screen.getByLabelText('點陣排列方式')).toHaveValue(layout);}
  for(const [name,value] of [['點陣位置隨機程度',45],['點陣旋轉隨機程度',60],['點陣尺寸隨機程度',25],['圖片亮度',10],['Gamma',1.5],['細節保留程度',128]] as const)slider(name,value);
  fireEvent.click(screen.getByRole('checkbox',{name:'黑白反轉'}));await waitFor(()=>expect(requests.at(-1).settings.halftone.invert).toBe(true));expect(requests.at(-1).settings.halftone.crop.width).toBe(.6);fireEvent.click(screen.getByRole('button',{name:'移除點陣來源圖片'}));expect(screen.queryByTestId('halftone-canvas')).not.toBeInTheDocument();expect(screen.getByTestId('pattern-glyphs').querySelectorAll('path').length).toBeGreaterThan(0);
 });
 it('HEX／RGB、透明背景可用，JSON 匯入保留圖片、參數與 Seed',async()=>{
  render(<App/>);await upload();fireEvent.change(screen.getByRole('spinbutton',{name:'圖案顏色 R'}),{target:{value:255}});expect(screen.getByLabelText('圖案顏色色碼')).toHaveValue('#ff1d1f');fireEvent.click(screen.getByRole('checkbox',{name:'透明背景'}));const design={...DEFAULTS,width:240,height:200,shape:'hexagon' as const,morph:false,seed:876,foreground:'#123456',transparentBackground:true,halftone:{...HALFTONE_DEFAULTS,enabled:true,image,mode:'sparse' as const,contrast:1.8}};const file=new File([projectJSON(design)],'halftone.json');Object.defineProperty(file,'text',{value:async()=>projectJSON(design)});fireEvent.change(screen.getByLabelText('選擇 JSON 專案檔'),{target:{files:[file]}});await waitFor(()=>expect(screen.getByLabelText('點陣形狀')).toHaveValue('hexagon'));expect(screen.getByLabelText('點陣隨機種子')).toHaveValue(876);expect(screen.getByLabelText('圖片轉換模式')).toHaveValue('sparse');await waitFor(()=>expect(requests.at(-1).settings.seed).toBe(876));expect(parseProject(projectJSON(design)).halftone.image!.pixels).toBe(image.pixels);
 });
 it('上傳錯誤會保留既有設計並提示，不會產生假預覽',async()=>{vi.mocked(decode.decodePhotograph).mockRejectedValue(new Error('圖片解碼失敗'));render(<App/>);fireEvent.click(screen.getByRole('button',{name:'圖片轉點陣'}));fireEvent.change(screen.getByLabelText('點陣來源圖片檔案'),{target:{files:[new File(['bad'],'bad.jpg')]}});await screen.findByRole('alert');expect(screen.getByRole('alert')).toHaveTextContent('圖片解碼失敗');expect(screen.queryByTestId('halftone-canvas')).not.toBeInTheDocument();});
});
