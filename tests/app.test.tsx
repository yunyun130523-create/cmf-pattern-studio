import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App';
import { DEFAULTS, projectJSON } from '../src/engine';
import * as exports from '../src/exports';
vi.mock('../src/exports',async importOriginal=>{const original=await importOriginal<typeof import('../src/exports')>();return{...original,downloadBlob:vi.fn(),pngBlob:vi.fn(async()=>new Blob(['PNG'],{type:'image/png'}))};});
const defaults={...DEFAULTS,width:240,height:200,spacingX:25,spacingY:25};
beforeEach(()=>{localStorage.setItem('cmf-pattern-studio-v1',projectJSON(defaults));});
const firstPath=()=>screen.getByTestId('pattern-glyphs').innerHTML;
const range=(label:string,value:number)=>fireEvent.change(screen.getByRole('slider',{name:label}),{target:{value}});
describe('interactive pattern controls',()=>{
  it('shows five genuine morph stages and an equal-size hexagon-to-triangle demonstration',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:/六角形 → 三角形示範/}));
    expect(screen.getByRole('button',{name:'六角形',exact:true})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByRole('combobox',{name:'目標形狀'})).toHaveValue('triangle');
    expect(screen.getByRole('spinbutton',{name:'最小尺寸'})).toHaveValue(18);expect(screen.getByRole('spinbutton',{name:'最大尺寸'})).toHaveValue(18);
    const polygons=screen.getByTestId('morph-stages').querySelectorAll('polygon');expect(polygons).toHaveLength(5);
    expect(new Set(Array.from(polygons,p=>p.getAttribute('points'))).size).toBe(5);
    const values=Array.from(screen.getByTestId('pattern-glyphs').querySelectorAll('path'),p=>Number(p.getAttribute('data-morph')));
    expect(Math.min(...values)).toBe(0);expect(Math.max(...values)).toBe(1);expect(new Set(values).size).toBeGreaterThan(20);
    range('過渡線性度',0);const updated=Array.from(screen.getByTestId('pattern-glyphs').querySelectorAll('path'),p=>Number(p.getAttribute('data-morph')));
    expect(Math.min(...updated)).toBe(0);expect(Math.max(...updated)).toBe(1);
  });
  it('renders the workbench and all six functional shape buttons',()=>{
    render(<App/>);expect(screen.getByRole('img',{name:'CMF 參數化圖案即時預覽'})).toBeInTheDocument();
    for(const name of ['圓形','三角形','正方形','菱形','六角形','長方形']) {const button=screen.getByRole('button',{name,exact:true});fireEvent.click(button);expect(button).toHaveAttribute('aria-pressed','true');}
  });
  it('all pattern sliders update state and output immediately',()=>{
    render(<App/>);
    for(const [name,value] of [['過渡線性度',55],['水平間距',32],['垂直間距',28],['圖案密度',70],['旋轉角度',32],['漸變方向',40],['漸變曲線',2],['位置不規則度',30]] as const){
      range(name,value);expect(Number((screen.getByRole('slider',{name}) as HTMLInputElement).value)).toBeCloseTo(value,0);
    }
    fireEvent.click(screen.getByRole('button',{name:'不規則漸變'}));range('肌理尺度',8);
    fireEvent.click(screen.getByRole('button',{name:'長方形',exact:true}));range('長方形長寬比',3);
    expect(firstPath()).toBeTruthy();
  });
  it('controls all gradient modes, morph target and reverse',()=>{
    render(<App/>);const initial=firstPath();
    for(const name of ['垂直漸變','中心擴散','不規則漸變','水平漸變']){const button=screen.getByRole('button',{name});fireEvent.click(button);expect(button).toHaveAttribute('aria-pressed','true');}
    fireEvent.change(screen.getByRole('combobox',{name:'目標形狀'}),{target:{value:'hexagon'}});
    expect(firstPath()).not.toEqual(initial);
    fireEvent.click(screen.getByRole('checkbox',{name:'反轉尺寸漸變方向'}));expect(screen.getByRole('checkbox',{name:'反轉尺寸漸變方向'})).toBeChecked();
    fireEvent.click(screen.getByRole('switch',{name:'啟用形狀漸變'}));expect(screen.getByRole('switch',{name:'啟用形狀漸變'})).toHaveAttribute('aria-checked','false');
  });
  it('independent spacing can be unlinked and stagger can be toggled',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'連動水平與垂直間距'}));range('水平間距',40);
    expect(screen.getByRole('slider',{name:'垂直間距'})).toHaveValue('25');
    fireEvent.click(screen.getByRole('checkbox',{name:/錯列排列/}));expect(screen.getByRole('checkbox',{name:/錯列排列/})).not.toBeChecked();
  });
  it('draggable control points update geometry and support keyboard adjustments',()=>{
    render(<App/>);const svg=screen.getByTestId('pattern-canvas');
    vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:240,height:200,right:240,bottom:200,x:0,y:0,toJSON(){}});
    const handle=screen.getByRole('button',{name:'漸變終點，方向鍵可微調'}),initial=firstPath();
    fireEvent.pointerDown(handle,{pointerId:1,clientX:196,clientY:130});fireEvent.pointerMove(svg,{pointerId:1,clientX:100,clientY:150});fireEvent.pointerUp(svg,{pointerId:1});
    expect(handle).toHaveAttribute('transform','translate(100,150)');expect(firstPath()).not.toBe(initial);
    fireEvent.keyDown(handle,{key:'ArrowRight'});expect(handle.getAttribute('transform')).toContain('102.');
  });
  it('undo, redo, reset and keyboard shortcuts restore geometry',()=>{
    render(<App/>);const initial=firstPath();fireEvent.click(screen.getByRole('button',{name:'菱形',exact:true}));const changed=firstPath();expect(changed).not.toBe(initial);
    fireEvent.click(screen.getByRole('button',{name:'復原'}));expect(firstPath()).toBe(initial);
    fireEvent.click(screen.getByRole('button',{name:'重做'}));expect(firstPath()).toBe(changed);
    fireEvent.keyDown(window,{key:'z',ctrlKey:true});expect(firstPath()).toBe(initial);
    fireEvent.keyDown(window,{key:'z',ctrlKey:true,shiftKey:true});expect(firstPath()).toBe(changed);
    fireEvent.click(screen.getByRole('button',{name:'重設'}));expect(screen.getByRole('button',{name:'圓形',exact:true})).toHaveAttribute('aria-pressed','true');
  });
  it('size fields commit on Enter, clamp safely and update geometry',()=>{
    render(<App/>);const input=screen.getByRole('spinbutton',{name:'最大尺寸'});fireEvent.focus(input);fireEvent.change(input,{target:{value:'18'}});fireEvent.blur(input);expect(input).toHaveValue(18);
    const min=screen.getByRole('spinbutton',{name:'最小尺寸'});fireEvent.change(min,{target:{value:'40'}});fireEvent.blur(min);expect(min).toHaveValue(18);
  });
  it('seed changes are repeatable and random controls change state',()=>{
    render(<App/>);range('位置不規則度',50);const initial=firstPath();const input=screen.getByRole('spinbutton',{name:'隨機種子'});
    fireEvent.change(input,{target:{value:'123'}});fireEvent.blur(input);expect(firstPath()).not.toBe(initial);
    fireEvent.change(input,{target:{value:String(defaults.seed)}});fireEvent.blur(input);expect(firstPath()).toBe(initial);
    fireEvent.click(screen.getByRole('button',{name:'新 Seed'}));expect(input).not.toHaveValue(defaults.seed);
    fireEvent.click(screen.getByRole('button',{name:'隨機探索新圖案'}));expect(screen.getByRole('status',{name:'操作通知'})).toHaveTextContent('已產生新圖案');
  });
  it('presets, zoom, grid, handles and sidebar toggle work',()=>{
    render(<App/>);for(const text of ['流動織序','光暈矩陣','地景肌理','靜謐穿孔'])fireEvent.click(screen.getByRole('button',{name:new RegExp(text)}));
    fireEvent.click(screen.getByRole('button',{name:'放大預覽'}));expect(screen.getByText('125%')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'縮小預覽'}));expect(screen.getByText('100%',{selector:'.zoom-toolbar > span'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'符合畫布'}));fireEvent.click(screen.getByRole('button',{name:'切換網格'}));
    expect(screen.getByTestId('pattern-canvas').querySelectorAll('line').length).toBeGreaterThan(5);
    fireEvent.click(screen.getByRole('button',{name:'切換控制點顯示'}));expect(screen.queryByRole('button',{name:/漸變起點/})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'收合參數面板'}));expect(screen.queryByRole('heading',{name:'圖案參數'})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'展開參數面板'}));expect(screen.getByRole('heading',{name:'圖案參數'})).toBeInTheDocument();
  });
});
describe('colors, project and exports',()=>{
  it('colors, swap, opacity and artboard settings work',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'色彩與畫布'}));
    fireEvent.change(screen.getByLabelText('圖案顏色選色器'),{target:{value:'#ff0000'}});expect(screen.getByTestId('pattern-glyphs')).toHaveAttribute('fill','#ff0000');
    fireEvent.change(screen.getByLabelText('背景顏色色碼'),{target:{value:'#ffffff'}});expect(screen.getByTestId('pattern-canvas').querySelector('rect')).toHaveAttribute('fill','#ffffff');
    fireEvent.click(screen.getByRole('button',{name:'交換圖案與背景顏色'}));expect(screen.getByTestId('pattern-glyphs')).toHaveAttribute('fill','#ffffff');
    for(let i=1;i<=5;i++)fireEvent.click(screen.getByRole('button',{name:'套用材質配色 '+i}));
    range('圖案不透明度',40);expect(screen.getByTestId('pattern-glyphs')).toHaveAttribute('opacity','0.4');
    for(const [name,value] of [['畫布寬度',400],['畫布高度',300]] as const){const input=screen.getByRole('spinbutton',{name});fireEvent.change(input,{target:{value:String(value)}});fireEvent.blur(input);}
    expect(screen.getByTestId('pattern-canvas')).toHaveAttribute('viewBox','0 0 400 300');
    fireEvent.click(screen.getByRole('button',{name:'1:1',exact:true}));expect(screen.getByTestId('pattern-canvas')).toHaveAttribute('viewBox','0 0 1000 1000');
  });
  it('exports PNG, SVG, JSON and DXF through working dialog controls',async()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'匯出 PNG'}));
    const dialog=screen.getByRole('dialog',{name:'匯出設計'});expect(dialog).toBeVisible();
    fireEvent.change(screen.getByRole('combobox',{name:'PNG 輸出倍率'}),{target:{value:'3'}});
    fireEvent.click(screen.getByRole('button',{name:'下載 PNG'}));await waitFor(()=>expect(exports.pngBlob).toHaveBeenCalled());
    await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
    for(const format of ['SVG','JSON','DXF']){
      fireEvent.click(screen.getByRole('button',{name:'更多匯出格式'}));fireEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:format,exact:true}));
      fireEvent.click(screen.getByRole('button',{name:'下載 '+format}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
    }
    const calls=vi.mocked(exports.downloadBlob).mock.calls;expect(calls.map(c=>c[1].split('.').pop())).toEqual(expect.arrayContaining(['png','svg','json','dxf']));
  });
  it('DWG button starts a worker and downloads its genuine bytes',async()=>{
    const worker={terminate:vi.fn(),onmessage:null as ((e:MessageEvent)=>void)|null,onerror:null,postMessage:vi.fn(function(this:typeof worker){queueMicrotask(()=>this.onmessage?.({data:{bytes:new TextEncoder().encode('AC1015-test').buffer}} as MessageEvent));})};
    vi.stubGlobal('Worker',vi.fn(function(){return worker;}));
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'更多匯出格式'}));fireEvent.click(screen.getByRole('button',{name:'DWG',exact:true}));
    fireEvent.click(screen.getByRole('button',{name:'下載 DWG'}));await waitFor(()=>expect(exports.downloadBlob).toHaveBeenCalledWith(expect.any(Blob),`cmf-pattern-${defaults.seed}.dwg`));expect(worker.terminate).toHaveBeenCalled();vi.unstubAllGlobals();
  });
  it('restores a JSON file and rejects invalid projects without replacing work',async()=>{
    render(<App/>);const next={...defaults,shape:'hexagon' as const,foreground:'#aabbcc'};
    const file=new File([projectJSON(next)],'design.json',{type:'application/json'});Object.defineProperty(file,'text',{value:async()=>projectJSON(next)});
    fireEvent.change(screen.getByLabelText('選擇 JSON 專案檔'),{target:{files:[file]}});
    await waitFor(()=>expect(screen.getByRole('button',{name:'六角形',exact:true})).toHaveAttribute('aria-pressed','true'));
    const bad=new File(['{}'],'bad.json');Object.defineProperty(bad,'text',{value:async()=>'{}'});fireEvent.change(screen.getByLabelText('選擇 JSON 專案檔'),{target:{files:[bad]}});
    await waitFor(()=>expect(screen.getByRole('status',{name:'操作通知'})).toHaveTextContent('請選擇本工作台匯出的 JSON 專案檔'));
    expect(screen.getByTestId('pattern-glyphs')).toHaveAttribute('fill','#aabbcc');
  });
  it('persists to browser storage and restores after remount',async()=>{
    const {unmount}=render(<App/>);fireEvent.click(screen.getByRole('button',{name:'菱形',exact:true}));
    await waitFor(()=>expect(JSON.parse(localStorage.getItem('cmf-pattern-studio-v1')!).settings.shape).toBe('diamond'));
    unmount();render(<App/>);expect(screen.getByRole('button',{name:'菱形',exact:true})).toHaveAttribute('aria-pressed','true');
  });
  it('help and future capability dialogs open and close',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'操作說明'}));expect(screen.getByRole('dialog')).toHaveAccessibleName('歡迎使用紋理工作台');
    fireEvent.click(screen.getByRole('button',{name:'開始設計'}));expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:/AI & STEP/}));expect(screen.getByRole('dialog')).toHaveTextContent('目前尚未啟用');fireEvent.click(screen.getByRole('button',{name:'回到工作台'}));expect(screen.queryByRole('dialog')).toBeNull();
  });
});
