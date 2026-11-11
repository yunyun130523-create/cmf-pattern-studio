import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { importSVG } from './svg';
import { decodePNG, defaultTraceOptions, traceRaster, type Raster, type TraceOptions } from './png';
import DwgImportWorker from './dwg-import.worker?worker&inline';
import { morphRestriction, validateCustomShape, type CustomShape } from './geometry';
import { ShapeThumbnail } from './Library';
export function UploadDialog({onClose,onAdd}:{onClose:()=>void;onAdd:(shape:CustomShape)=>void}){
  const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),request=useRef(0),cancelWorker=useRef<()=>void>(()=>{});
  const [draft,setDraft]=useState<CustomShape|null>(null),[name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[over,setOver]=useState(false);
  const [raster,setRaster]=useState<Raster|null>(null),[options,setOptions]=useState<TraceOptions>({mode:'alpha',threshold:128,invert:false,removeBackground:true,smoothing:15});
  useEffect(()=>{dialog.current?.showModal?.();return()=>{request.current++;cancelWorker.current();};},[]);
  const trace=(r:Raster,o:TraceOptions,n:string)=>{setOptions(o);try{setDraft(traceRaster(r,o,n));setError('');}catch(e){setDraft(null);setError(e instanceof Error?e.message:'向量化失敗。');}};
  const load=async(file?:File)=>{
    if(!file)return;cancelWorker.current();const id=++request.current;setDraft(null);setRaster(null);setError('');setBusy(true);
    try{
      const n=file.name.replace(/\.[^.]+$/,'');let result:CustomShape;
      if(/\.svg$/i.test(file.name)){if(file.size>2_000_000)throw new Error('SVG 超過 2 MB，請先簡化。');result=importSVG(await file.text(),n);}
      else if(/\.png$/i.test(file.name)){const r=await decodePNG(file);if(id!==request.current)return;setRaster(r);setName(n);trace(r,defaultTraceOptions(r),n);return;}
      else if(/\.dwg$/i.test(file.name)){
        if(file.size>10_000_000)throw new Error('DWG 超過 10 MB，請先簡化。');const bytes=await file.arrayBuffer();if(id!==request.current)return;
        result=await new Promise<CustomShape>((resolve,reject)=>{
          const worker=new DwgImportWorker();const stop=()=>{worker.terminate();clearTimeout(timeout);cancelWorker.current=()=>{};};
          const timeout=setTimeout(()=>{stop();reject(new Error('CAD 解析逾時，請先簡化為單一封閉 2D 圖案。'));},90000);
          cancelWorker.current=()=>{stop();reject(new Error('已取消 CAD 解析。'));};
          worker.onmessage=e=>{stop();if(e.data.error)reject(new Error(e.data.error));else try{resolve(validateCustomShape(e.data.shape));}catch(e){reject(e);}};
          worker.onerror=()=>{stop();reject(new Error('CAD 解析器無法啟動，請下載獨立 HTML 後在 Chrome 或 Edge 開啟。'));};worker.postMessage({bytes,name:n},[bytes]);
        });
      }else throw new Error('請選擇 SVG、PNG 或真正的 DWG 檔案。');
      if(id===request.current){setDraft(result);setName(result.name);}
    }catch(e){if(id===request.current)setError(e instanceof Error?e.message:'圖案讀取失敗。');}finally{if(id===request.current)setBusy(false);if(input.current)input.current.value='';}
  };
  const option=(patch:Partial<TraceOptions>)=>{if(raster)trace(raster,{...options,...patch},name||'PNG 圖案');};
  return <dialog ref={dialog} className="modal custom-upload" aria-label="新增自訂圖案" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="modal-inner"><div className="modal-heading"><h2>新增自訂圖案</h2><button className="icon-button" aria-label="關閉圖案上傳" onClick={onClose}><X size={18}/></button></div><p className="modal-intro">所有格式皆在本機轉成向量輪廓，檔案不會上傳到轉檔服務。</p>
    <div className={'shape-dropzone '+(over?'over':'')} onDragOver={e=>{e.preventDefault();setOver(true);}} onDragLeave={()=>setOver(false)} onDrop={e=>{e.preventDefault();setOver(false);void load(e.dataTransfer.files[0]);}}><Upload size={25}/><strong>{busy?'正在解析幾何…':'拖曳圖案到這裡'}</strong><span>SVG（2 MB）· PNG / DWG（10 MB）</span><button className="button" disabled={busy} onClick={()=>input.current?.click()}>選擇圖案檔案</button><input hidden ref={input} aria-label="自訂圖案檔案" type="file" accept=".svg,.png,.dwg,image/svg+xml,image/png" onChange={e=>void load(e.target.files?.[0])}/></div>
    {raster&&<div className="trace-options"><h3>PNG 輪廓向量化</h3><label>辨識方式<select aria-label="PNG 辨識方式" value={options.mode} onChange={e=>option({mode:e.target.value as TraceOptions['mode']})}><option value="alpha">透明背景／Alpha 輪廓</option><option value="threshold">黑白亮度輪廓</option></select></label><label>{options.mode==='alpha'?'透明度閾值':'亮度閾值'} <output>{options.threshold}</output><input aria-label="向量化閾值" type="range" min="0" max="255" value={options.threshold} onChange={e=>option({threshold:+e.target.value})}/></label><label>平滑程度 <output>{options.smoothing}%</output><input aria-label="向量平滑程度" type="range" min="0" max="100" value={options.smoothing} onChange={e=>option({smoothing:+e.target.value})}/></label><label className="checkbox"><input type="checkbox" checked={options.invert} onChange={e=>option({invert:e.target.checked})}/>反轉輪廓</label><label className="checkbox"><input type="checkbox" disabled={options.mode==='alpha'} checked={options.removeBackground} onChange={e=>option({removeBackground:e.target.checked})}/>自動去背（單色背景）</label><p className="muted-note">最多以 768 px 解析，適合簡單單色 Logo。多色、漸層或照片請先簡化。</p></div>}
    {error&&<p className="custom-error" role="alert">{error}</p>}
    {draft&&<><div className="custom-vector-preview"><ShapeThumbnail shape={draft}/></div><label className="custom-name-field">圖案名稱<input aria-label="自訂圖案名稱" maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><p className="muted-note">原始輪廓 {draft.sourceWidth.toFixed(2)} × {draft.sourceHeight.toFixed(2)} {draft.unit} · {draft.contours.length} 個輪廓 · {draft.contours.flat().length} 個節點</p>{draft.warnings.map((warning,i)=><p key={i} className="custom-warning">{warning}</p>)}{morphRestriction(draft)&&<p className="custom-warning">{morphRestriction(draft)}</p>}<button className="button primary export-confirm" disabled={busy||!name.trim()} onClick={()=>{try{onAdd({...draft,name:name.trim(),updatedAt:Date.now()});onClose();}catch(e){setError(e instanceof Error?e.message:'無法加入圖案庫。');}}}>確認加入圖案庫</button></>}
    <p className="muted-note">DWG：支援平面封閉 Polyline、Circle，以及可接合的 Arc / Line。區塊請先炸開；未支援的版本可在既有 CAD 軟體另存 R2000，或本機轉成 SVG 後匯入。無付費 API。STEP 實體匯出仍在開發中。</p>
  </div></dialog>;
}
