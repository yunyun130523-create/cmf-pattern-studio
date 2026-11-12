import { beforeEach,describe,it,expect,vi } from 'vitest';
import { render,screen,fireEvent,waitFor } from '@testing-library/react';
import { IDBFactory } from 'fake-indexeddb';
import App from '../src/App';
import { DEFAULTS,projectJSON,parseProject } from '../src/engine';
import { imageFromRGBA } from '../src/halftone/model';
import * as photo from '../src/halftone/image';
import { saveLibrary } from '../src/custom/storage';
beforeEach(async()=>{Object.defineProperty(globalThis,'indexedDB',{value:new IDBFactory(),configurable:true});await saveLibrary([]);localStorage.setItem('cmf-pattern-studio-v1',projectJSON(DEFAULTS));vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({createImageData:(w:number,h:number)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:vi.fn()} as unknown as CanvasRenderingContext2D);});
describe('範圍控制面板',()=>{
 it('色彩與畫布在第一個分頁；上傳、調整、儲存、移除正常操作',async()=>{const image=imageFromRGBA(new Uint8Array([0,0,0,255]),1,1,{name:'range.png',format:'PNG'});vi.spyOn(photo,'decodePhotograph').mockResolvedValue(image);render(<App/>);expect(document.querySelector('.sidebar-tabs button')?.textContent).toBe('色彩與畫布');fireEvent.click(screen.getByRole('button',{name:'色彩與畫布',exact:true}));fireEvent.change(screen.getByLabelText('漸變範圍檔案'),{target:{files:[new File(['x'],'range.png')]}});await screen.findByText('range.png');expect(screen.getByRole('checkbox',{name:'啟用範圍限制'})).toBeChecked();fireEvent.change(screen.getByRole('slider',{name:'輪廓漸變寬度'}),{target:{value:25}});await waitFor(()=>expect(parseProject(localStorage.getItem('cmf-pattern-studio-v1')!).rangeMask.feather).toBe(25));fireEvent.change(screen.getByLabelText('範圍漸變方式'),{target:{value:'directional'}});expect(screen.queryByRole('slider',{name:'輪廓漸變寬度'})).not.toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'移除漸變範圍'}));expect(screen.queryByText('range.png')).not.toBeInTheDocument();});
});
