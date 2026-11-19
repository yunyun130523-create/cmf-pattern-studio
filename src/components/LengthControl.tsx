import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {toMm,toPx,mmText} from '../units';
interface LengthProps {label:string;valuePx:number;minPx?:number;maxPx?:number;disabled?:boolean;onChangePx:(value:number)=>void}
export function LengthInput({label,valuePx,minPx=0,maxPx=Infinity,disabled=false,onChangePx}:LengthProps){
 const [draft,setDraft]=useState(String(mmText(valuePx))),dirty=useRef(false);
 useEffect(()=>{setDraft(String(mmText(valuePx)));dirty.current=false;},[valuePx]);
 const commit=()=>{if(!dirty.current)return;const n=Number(draft),px=toPx(n);if(draft.trim()&&Number.isFinite(px)){const next=Math.max(minPx,Math.min(maxPx,px));onChangePx(next);setDraft(String(mmText(next)));}else setDraft(String(mmText(valuePx)));dirty.current=false;};
 return <label className="number-field length-input"><span>{label}</span><div><input aria-label={label} type="number" step="any" min={toMm(minPx)} max={Number.isFinite(maxPx)?toMm(maxPx):undefined} disabled={disabled} value={draft} onChange={e=>{dirty.current=true;const text=e.target.value;setDraft(text);const px=toPx(Number(text));if(text.trim()&&Number.isFinite(px)&&px>=minPx&&px<=maxPx)onChangePx(px);}} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/><small>mm</small></div></label>;
}
export function LengthControl({label,valuePx,minPx=0,maxPx=Infinity,sliderMaxPx=80,stepPx=.5,onChangePx}:LengthProps&{sliderMaxPx?:number;stepPx?:number}){
 const candidate=Math.max(sliderMaxPx,valuePx),upper=Math.min(maxPx,Number.isFinite(candidate)?candidate:valuePx),lower=toMm(minPx),higher=toMm(upper);
 return <div className="range-field length-control"><div className="length-heading"><label>{label}</label><LengthInput label={label+'數值'} valuePx={valuePx} minPx={minPx} maxPx={maxPx} onChangePx={onChangePx}/></div><input aria-label={label} type="range" min={lower} max={higher} step={toMm(stepPx)} value={toMm(valuePx)} style={{'--range':`${higher>lower?(toMm(valuePx)-lower)/(higher-lower)*100:0}%`}as CSSProperties} onChange={e=>onChangePx(toPx(+e.target.value))}/></div>;
}
