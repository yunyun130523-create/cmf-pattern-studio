import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';
import { DEFAULTS, projectJSON } from '../src/engine';
beforeEach(()=>localStorage.setItem('cmf-pattern-studio-v1',projectJSON({...DEFAULTS,width:240,height:200,spacingX:25,spacingY:25})));
const geometry=()=>screen.getByTestId('pattern-glyphs').innerHTML;
const slide=(name:string,value:number)=>fireEvent.change(screen.getByRole('slider',{name}),{target:{value}});
function drag(name:string,x:number,y:number){
  const svg=screen.getByTestId('pattern-canvas');vi.spyOn(svg,'getBoundingClientRect').mockReturnValue({x:0,y:0,left:0,top:0,width:240,height:200,right:240,bottom:200,toJSON(){}});
  fireEvent.pointerDown(screen.getByRole('button',{name}),{pointerId:1});fireEvent.pointerMove(svg,{pointerId:1,clientX:x,clientY:y});fireEvent.pointerUp(svg,{pointerId:1});
}
describe('第一階段 UI 即時操作',()=>{
  it('水平／垂直／自訂方向即時改變實際路徑',()=>{
    render(<App/>);const old=geometry();fireEvent.click(screen.getByRole('button',{name:'垂直變形'}));expect(geometry()).not.toBe(old);
    fireEvent.click(screen.getByRole('button',{name:'自訂方向'}));const before=geometry();drag('形狀變形終點，方向鍵可微調',80,160);expect(geometry()).not.toBe(before);
    expect(screen.getByRole('button',{name:'形狀變形終點，方向鍵可微調'})).toHaveAttribute('transform','translate(80,160)');
  });
  it('端點尺寸、旋轉與變形比例皆可操作',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('checkbox',{name:'獨立起終尺寸'}));expect(screen.getByRole('spinbutton',{name:'最小尺寸'})).toBeDisabled();
    const old=geometry();fireEvent.change(screen.getByRole('spinbutton',{name:'結束尺寸'}),{target:{value:'25'}});expect(geometry()).not.toBe(old);
    fireEvent.click(screen.getByRole('checkbox',{name:'起終旋轉漸變'}));const before=geometry();fireEvent.change(screen.getByRole('spinbutton',{name:'結束旋轉'}),{target:{value:'80'}});expect(geometry()).not.toBe(before);
    fireEvent.change(screen.getByRole('spinbutton',{name:'終點變形比例'}),{target:{value:'0'}});expect(Array.from(screen.getByTestId('pattern-glyphs').querySelectorAll('path')).every(p=>p.getAttribute('data-morph')==='0')).toBe(true);
  });
  it('不規則模式的旋轉、尺寸、密度與混合滑桿即時更新',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'不規則漸變'}));
    for(const [label,value] of [['位置不規則度',70],['隨機旋轉範圍',80],['隨機尺寸幅度',80],['隨機密度幅度',80],['規則／隨機混合',50]] as const){const old=geometry();slide(label,value);expect(geometry()).not.toBe(old);}
    const before=geometry();drag('不規則程度，方向鍵可微調',130,105);expect(geometry()).not.toBe(before);
  });
  it('中心、半徑與密度方向控制真正影響畫布',()=>{
    render(<App/>);fireEvent.change(screen.getByRole('combobox',{name:'密度漸變'}),{target:{value:'radial'}});
    const old=geometry();drag('中心位置，方向鍵可微調',70,50);expect(geometry()).not.toBe(old);expect(screen.getByRole('spinbutton',{name:'中心 X'})).toHaveValue(29.17);
    const before=geometry();drag('漸變半徑，方向鍵可微調',225,80);expect(geometry()).not.toBe(before);
    fireEvent.change(screen.getByRole('combobox',{name:'密度漸變'}),{target:{value:'directional'}});const previous=geometry();slide('密度漸變方向',90);expect(geometry()).not.toBe(previous);
  });
  it('新增控制點可隱藏，並保留復原／重做',()=>{
    render(<App/>);fireEvent.click(screen.getByRole('button',{name:'自訂方向'}));const before=geometry();drag('形狀變形終點，方向鍵可微調',40,150);const after=geometry();
    fireEvent.click(screen.getByRole('button',{name:'復原'}));expect(geometry()).toBe(before);fireEvent.click(screen.getByRole('button',{name:'重做'}));expect(geometry()).toBe(after);
    fireEvent.click(screen.getByRole('button',{name:'切換控制點顯示'}));expect(screen.queryByRole('button',{name:'形狀變形終點，方向鍵可微調'})).toBeNull();
  });
});
