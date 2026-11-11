import { useCallback, useEffect, useRef, useState } from 'react';
import HalftoneWorker from './worker?worker&inline';
import type { SampleImage } from './model';
import type { Settings } from '../engine';
import type { PackedPattern } from './engine';
export function useHalftoneWorker(s:Settings){
 const enabled=s.halftone.enabled&&!!s.halftone.image,worker=useRef<Worker|null>(null),sequence=useRef(0),latest=useRef(0),sentImage=useRef<SampleImage|null>(null),busy=useRef(false),queued=useRef<Settings|null>(null),inputTimer=useRef<ReturnType<typeof setTimeout>|null>(null),pending=useRef(new Map<number,{resolve:(text:string)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}>());
 const bitmapRef=useRef<ImageBitmap|null>(null);
 const [bitmap,setBitmap]=useState<ImageBitmap|null>(null),[packed,setPacked]=useState<PackedPattern|null>(null),[calculating,setCalculating]=useState(false),[error,setError]=useState('');
 const send=useCallback((settings:Settings,id:number,kind:'preview'|'svg'|'dxf',unit?:'mm'|'px')=>{const im=settings.halftone.image;if(!worker.current||!im)throw new Error('點陣背景處理器尚未就緒。');const include=sentImage.current!==im;worker.current.postMessage({id,kind,settings:{...settings,halftone:{...settings.halftone,image:include?im:null}},imageId:im.id,unit});sentImage.current=im;},[]);
 const submit=useCallback((settings:Settings)=>{busy.current=true;const id=++sequence.current;latest.current=id;send(settings,id,'preview');},[send]);
 useEffect(()=>{if(!enabled){setPacked(null);bitmapRef.current?.close();bitmapRef.current=null;setBitmap(null);setCalculating(false);return;}let w:Worker;try{w=new HalftoneWorker();worker.current=w;sentImage.current=null;busy.current=false;}catch{setError('無法啟動背景運算，請用 Chrome／Edge 開啟下載的獨立 HTML。');return;}
 w.onmessage=e=>{const {id,kind,error,text,packed,bitmap:nextBitmap}=e.data;const promise=pending.current.get(id);if(promise){clearTimeout(promise.timer);pending.current.delete(id);if(error)promise.reject(new Error(error));else promise.resolve(text);return;}
 if(kind==='preview'){busy.current=false;if(id===latest.current){if(error){setError(error);nextBitmap?.close();}else{bitmapRef.current?.close();bitmapRef.current=nextBitmap??null;setBitmap(nextBitmap??null);setPacked(packed);setError('');}}else nextBitmap?.close();
 const next=queued.current;queued.current=null;if(next){submit(next);setCalculating(true);}else setCalculating(false);}};
 w.onerror=()=>{busy.current=false;queued.current=null;setError('點陣背景運算失敗，請停用後重新啟用圖片模式，或降低密度。');setCalculating(false);for(const p of pending.current.values()){clearTimeout(p.timer);p.reject(new Error('點陣背景運算失敗。'));}pending.current.clear();};
 return()=>{w.terminate();bitmapRef.current?.close();bitmapRef.current=null;worker.current=null;busy.current=false;queued.current=null;if(inputTimer.current){clearTimeout(inputTimer.current);inputTimer.current=null;}for(const p of pending.current.values()){clearTimeout(p.timer);p.reject(new Error('圖片模式已關閉。'));}pending.current.clear();};
 },[enabled,submit]);
 useEffect(()=>{if(!enabled||!worker.current)return;setCalculating(true);queued.current=s;if(!busy.current&&inputTimer.current===null)inputTimer.current=setTimeout(()=>{inputTimer.current=null;const next=queued.current;queued.current=null;if(next)try{submit(next);}catch(e){setError(String(e));setCalculating(false);}},40);},[s,enabled,submit]);
 const exportText=useCallback((settings:Settings,kind:'svg'|'dxf',unit?:'mm'|'px')=>new Promise<string>((resolve,reject)=>{const id=++sequence.current,timer=setTimeout(()=>{pending.current.delete(id);reject(new Error('向量匯出逾時，請降低密度。'));},90000);pending.current.set(id,{resolve,reject,timer});try{send(settings,id,kind,unit);}catch(e){clearTimeout(timer);pending.current.delete(id);reject(e);}}),[send]);
 return{packed,bitmap,calculating,error,exportText};
}
