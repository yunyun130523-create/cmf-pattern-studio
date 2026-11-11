import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import App from '../src/App';
import { DEFAULTS, projectJSON } from '../src/engine';
import { importSVG } from '../src/custom/svg';
import { saveLibrary, readLibrary } from '../src/custom/storage';
import { UploadDialog } from '../src/custom/UploadDialog';
import * as png from '../src/custom/png';
beforeEach(async()=>{Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true});await saveLibrary([]);localStorage.setItem('cmf-pattern-studio-v1',projectJSON({...DEFAULTS,width:240,height:200,spacingX:30,spacingY:30}));});
afterEach(async()=>{await saveLibrary([]);});
const content='<svg viewBox="0 0 20 20"><polygon points="10,0 20,20 0,20"/></svg>';
function uploadSVG(){const file=new File([content],'triangle.svg',{type:'image/svg+xml'});Object.defineProperty(file,'text',{value:async()=>content});fireEvent.change(screen.getByLabelText('自訂圖案檔案'),{target:{files:[file]}});}
describe('自訂圖案操作',()=>{
 it('＋上傳 SVG、預覽、更名、加入、排列、重新載入與刪除',async()=>{
  const view=render(<App/>);const plus=screen.getByRole('button',{name:'新增自訂圖案'});await waitFor(()=>expect(plus).toBeEnabled());fireEvent.click(plus);uploadSVG();await screen.findByRole('button',{name:'確認加入圖案庫'});expect(screen.getByLabelText('自訂圖案名稱')).toHaveValue('triangle');fireEvent.change(screen.getByLabelText('自訂圖案名稱'),{target:{value:'我的標誌'}});fireEvent.click(screen.getByRole('button',{name:'確認加入圖案庫'}));expect(screen.getByRole('button',{name:'選取自訂圖案 我的標誌'})).toHaveAttribute('aria-pressed','true');expect(screen.getByTestId('pattern-glyphs').querySelectorAll('path').length).toBeGreaterThan(10);
  const before=screen.getByTestId('pattern-glyphs').innerHTML;fireEvent.change(screen.getByRole('spinbutton',{name:'圖案寬度'}),{target:{value:20}});expect(screen.getByTestId('pattern-glyphs').innerHTML).not.toBe(before);
  fireEvent.click(screen.getByRole('button',{name:'重新命名 我的標誌'}));fireEvent.change(screen.getByLabelText('自訂圖案新名稱'),{target:{value:'標誌二'}});fireEvent.click(screen.getByRole('button',{name:'儲存圖案名稱'}));await waitFor(async()=>expect((await readLibrary()).shapes[0].name).toBe('標誌二'));
  view.unmount();const reopened=render(<App/>);await screen.findByRole('button',{name:'選取自訂圖案 標誌二'});fireEvent.click(screen.getByRole('button',{name:'刪除 標誌二'}));expect(screen.queryByRole('button',{name:'選取自訂圖案 標誌二'})).not.toBeInTheDocument();expect(screen.getByRole('button',{name:'圓形',exact:true})).toHaveAttribute('aria-pressed','true');await waitFor(async()=>expect((await readLibrary()).shapes).toHaveLength(0));reopened.unmount();render(<App/>);await waitFor(()=>expect(screen.getByRole('button',{name:'新增自訂圖案'})).toBeEnabled());expect(screen.queryByRole('button',{name:'選取自訂圖案 標誌二'})).not.toBeInTheDocument();
 });
 it('PNG 向量預覽、閾值和平滑控制可操作後加入',async()=>{
  const data=new Uint8ClampedArray(16*16*4);for(let y=4;y<12;y++)for(let x=4;x<12;x++)data.set([0,0,0,255],(y*16+x)*4);vi.spyOn(png,'decodePNG').mockResolvedValue({width:16,height:16,data});const onAdd=vi.fn();render(<UploadDialog onClose={()=>{}} onAdd={onAdd}/>);fireEvent.change(screen.getByLabelText('自訂圖案檔案'),{target:{files:[new File(['png'],'logo.png')]}});await screen.findByRole('button',{name:'確認加入圖案庫'});fireEvent.change(screen.getByLabelText('向量化閾值'),{target:{value:150}});fireEvent.change(screen.getByLabelText('向量平滑程度'),{target:{value:70}});fireEvent.click(screen.getByRole('button',{name:'確認加入圖案庫'}));expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({source:'PNG',contours:expect.any(Array)}));
 });
 it('DWG 上傳連接背景處理器、顯示尺寸並可加入圖案庫',async()=>{
  const cad={...importSVG(content,'CAD 測試'),source:'DWG' as const,sourceWidth:20,sourceHeight:10,unit:'mm' as const};
  const worker={terminate:vi.fn(),onmessage:null as ((e:MessageEvent)=>void)|null,onerror:null,postMessage:vi.fn(function(this:typeof worker){queueMicrotask(()=>this.onmessage?.({data:{shape:cad}} as MessageEvent));})};vi.stubGlobal('Worker',vi.fn(function(){return worker;}));
  try{const onAdd=vi.fn();render(<UploadDialog onClose={()=>{}} onAdd={onAdd}/>);const file=new File(['AC1015'],'closed.dwg');Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('AC1015').buffer});fireEvent.change(screen.getByLabelText('自訂圖案檔案'),{target:{files:[file]}});await screen.findByRole('button',{name:'確認加入圖案庫'});expect(screen.getByText(/20.00 × 10.00 mm/)).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'確認加入圖案庫'}));expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({source:'DWG',unit:'mm'}));expect(worker.terminate).toHaveBeenCalled();}finally{vi.unstubAllGlobals();}
 });
 it('不安全輪廓停用 Morph，但可改選目標回復',async()=>{
 const hole=importSVG('<svg><path fill-rule="evenodd" d="M0 0H20V20H0Z M5 5H15V15H5Z"/></svg>','孔洞');await saveLibrary([hole]);render(<App/>);await screen.findByRole('button',{name:'選取自訂圖案 孔洞'});fireEvent.change(screen.getByRole('combobox',{name:'目標形狀'}),{target:{value:hole.id}});expect(screen.getByRole('switch',{name:'啟用形狀漸變'})).toBeDisabled();fireEvent.change(screen.getByRole('combobox',{name:'目標形狀'}),{target:{value:'triangle'}});expect(screen.getByRole('switch',{name:'啟用形狀漸變'})).toBeEnabled();
 });
});
