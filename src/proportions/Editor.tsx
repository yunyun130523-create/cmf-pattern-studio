import type { CSSProperties } from 'react';
import { RotateCcw, LockKeyhole, Unlock } from 'lucide-react';
import { shapeContours, shapeName, type Settings } from '../engine';
import { bounds, pathData } from '../custom/geometry';
import { DEFAULT_PROPORTION, getProportion, resizeProportion, type Endpoint, type ShapeProportions } from './model';
export function ProportionsEditor({settings:s,endpoint,onChange}:{settings:Settings;endpoint:Endpoint;onChange:(patch:Partial<Settings>)=>void}){
 const shape=endpoint==='start'?s.shape:s.targetShape,p=getProportion(s.proportions,shape,endpoint),label=endpoint==='start'?'起始':'結束';
 const update=(next:ShapeProportions)=>onChange({proportions:{...s.proportions,[endpoint]:{...s.proportions[endpoint],[shape]:next}}});
 const change=(patch:Partial<ShapeProportions>)=>update({...p,...patch});
 const contours=shapeContours(shape,s,endpoint),b=bounds(contours),padding=Math.max(b.width,b.height)*.12;
 const range=(name:string,value:number,min:number,max:number,onValue:(v:number)=>void,unit='%')=>{const id=endpoint+'-'+name;return <div className="range-field proportion-range"><label htmlFor={id}>{name}<output>{Number(value.toFixed(2))}{unit}</output></label><input id={id} aria-label={label+name} type="range" min={min} max={max} step="1" value={value} onChange={e=>onValue(+e.target.value)} style={{'--range':`${(value-min)/(max-min)*100}%`} as CSSProperties}/></div>;};
 return <div className="proportion-panel" role="group" aria-label={label+'圖形比例調整'}><div className="proportion-heading"><div><strong>{label}圖形比例</strong><span>{shapeName(shape,s.customShapes)}</span></div><button className="icon-button" aria-label={'重設'+label+'圖形比例'} title="重設此形狀的比例、旋轉與輪廓" onClick={()=>update({...DEFAULT_PROPORTION})}><RotateCcw size={13}/></button></div>
 <svg className="proportion-thumbnail" viewBox={`${b.minX-padding} ${b.minY-padding} ${b.width+padding*2} ${b.height+padding*2}`} role="img" aria-label={label+'比例輪廓預覽'}><path d={pathData(contours)} fill="currentColor" fillRule="evenodd"/></svg>
 {range('X 比例',p.x,10,300,v=>update(resizeProportion(p,'x',v)))}{range('Y 比例',p.y,10,300,v=>update(resizeProportion(p,'y',v)))}
 <div className="proportion-lock"><span>{p.locked?<LockKeyhole size={12}/>:<Unlock size={12}/>}比例鎖定</span><button className={'switch '+(p.locked?'on':'')} role="switch" aria-label={label+'比例鎖定'} aria-checked={p.locked} onClick={()=>change({locked:!p.locked})}><span/></button></div>
 {range('圖形旋轉',p.rotation,0,360,v=>change({rotation:v}),'°')}
 {shape==='triangle'&&<div className="proportion-specific">{range('三角形底邊',p.triangleBase,10,300,v=>change({triangleBase:v}))}{range('頂點水平位置',p.apexX,-100,100,v=>change({apexX:v}))}{range('頂點垂直位置',p.apexY,-100,100,v=>change({apexY:v}))}<p className="muted-note">頂點以原三角形為基準位移；重心保持在圖案中心。</p></div>}
 {shape==='hexagon'&&<label className="select-label">六角形頂點方向<select aria-label={label+'六角形頂點方向'} value={p.hexDirection} onChange={e=>change({hexDirection:e.target.value as ShapeProportions['hexDirection']})}><option value="flat">平頂（頂點朝左右）</option><option value="pointy">尖頂（頂點朝上下）</option></select></label>}
 {(shape==='square'||shape==='rectangle')&&range('圓角半徑',p.corner,0,50,v=>change({corner:v}))}
 <p className="muted-note">局部 X／Y 軸縮放後再旋轉。鎖定會保留目前比例，兩軸均限制於 10%～300%。{shape==='hexagon'?'六角形寬高比例可由 X／Y 分別調整。':''}</p>
 </div>;
}
