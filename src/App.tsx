import { StitchPanel } from './stitch/Panel';
import { stitchMarkup, stitchSVG } from './stitch/engine';
import { RangeMaskPanel } from './mask/Panel';
import { GrainPanel, CHANNEL_NAMES } from './grain/Panel';
import { GrainCanvas } from './grain/Canvas';
import { useGrain } from './grain/useGrain';
import { grainPNG } from './grain/png';
import type { GrainChannel } from './grain/model';
import { ProportionsEditor } from './proportions/Editor';
import { HalftonePanel } from './halftone/Panel';
import { CanvasPreview } from './halftone/CanvasPreview';
import { useHalftoneWorker } from './halftone/useWorker';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowDownToLine, ArrowLeftRight, ArrowRight, Check, ChevronRight, CircleHelp, Copy, Expand, Eye, EyeOff, FileJson, Focus, Grid2X2, Layers3, Link2, LockKeyhole, Maximize2, Minus, MoreHorizontal, MoveUpRight, Plus, Redo2, RotateCcw, ScanLine, Settings2, Shuffle, SlidersHorizontal, Sparkles, Undo2, Upload, X } from 'lucide-react';
import { DEFAULTS, MODE_NAMES, MODES, PRESETS, SHAPES, clamp, customDimensions, generatePattern, interpolateOutline, isCustom, morphIssue, morphOutlines, shapeName, parseProject, presetSettings, projectJSON, svgDocument, type Mode, type Point, type Settings, type Shape } from './engine';
import { downloadBlob, dxfDocument, pngBlob, pngSVGBlob } from './exports';
import DwgWorker from './dwg.worker?worker&inline';
import { CustomLibrary } from './custom/Library';
import { UploadDialog } from './custom/UploadDialog';
import { readLibrary, saveLibrary, mergeLibraries } from './custom/storage';
import { type CustomShape, MAX_SHAPES } from './custom/geometry';
import { controlPatch, controlPositions, type ControlKey } from './controls';

type ExportFormat = 'PNG'|'SVG'|'JSON'|'DWG'|'DXF';
const STORAGE='cmf-pattern-studio-v1';
function initialSettings(): Settings { try { const saved=localStorage.getItem(STORAGE);return saved?parseProject(saved):{...DEFAULTS}; } catch { return {...DEFAULTS}; } }
function newSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]%2147483647; }
function ShapeIcon({shape,size=18}:{shape:Shape;size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{shape==='circle'?<circle cx="12" cy="12" r="6.5" fill="currentColor"/>:shape==='triangle'?<path d="M12 4L21 20H3Z" fill="currentColor"/>:shape==='square'?<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor"/>:shape==='diamond'?<path d="M12 2L22 12L12 22L2 12Z" fill="currentColor"/>:shape==='hexagon'?<path d="M7 3H17L23 12L17 21H7L1 12Z" fill="currentColor"/>:<rect x="2" y="7" width="20" height="10" rx="3" fill="currentColor"/>}</svg>;
}
function Section({title,en,children,extra}:{title:string;en:string;children:ReactNode;extra?:ReactNode}) {
  return <section className="parameter-section"><div className="section-title"><h2>{title}</h2><span>{en}</span>{extra}</div>{children}</section>;
}
function Range({label,value,min,max,step=1,unit='',onChange}:{label:string;value:number;min:number;max:number;step?:number;unit?:string;onChange:(v:number)=>void}) {
  const id=label.replace(/\s/g,'');
  return <div className="range-field"><label htmlFor={id}>{label}<output aria-hidden="true">{Number(value.toFixed(2))}<small>{unit}</small></output></label><input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))} style={{'--range':`${(value-min)/(max-min)*100}%`} as CSSProperties}/></div>;
}
function NumberField({label,value,min,max,onChange,unit,disabled=false}:{label:string;value:number;min:number;max:number;onChange:(v:number)=>void;unit?:string;disabled?:boolean}) {
  const [draft,setDraft]=useState(String(value));useEffect(()=>setDraft(String(Number(value.toFixed(2)))),[value]);
  const commit=()=>{ const n=Number(draft);if(draft.trim()&&Number.isFinite(n)){const next=clamp(n,min,max);setDraft(String(next));onChange(next);}else setDraft(String(value)); };
  return <label className="number-field"><span>{label}</span><div><input aria-label={label} disabled={disabled} type="number" min={min} max={max} step="any" value={draft} onChange={e=>{const text=e.target.value;setDraft(text);const n=Number(text);if(text.trim()&&Number.isFinite(n)&&n>=min&&n<=max)onChange(n);}} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter') e.currentTarget.blur();}}/>{unit&&<small>{unit}</small>}</div></label>;
}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}) {
  const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);
  return <label className="color-field"><span>{label}</span><div><input aria-label={label+'選色器'} type="color" value={value} onChange={e=>onChange(e.target.value)}/><input aria-label={label+'色碼'} value={draft} maxLength={7} onChange={e=>{setDraft(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))onChange(e.target.value);}} onBlur={()=>setDraft(value)}/></div><div className="rgb-fields">{(['R','G','B'] as const).map((channel,i)=><span key={channel}>{channel}<input aria-label={label+' '+channel} type="number" min="0" max="255" value={parseInt(value.slice(1+i*2,3+i*2),16)} onChange={e=>{const n=Number(e.target.value);if(!Number.isInteger(n)||n<0||n>255)return;const channels=[0,1,2].map(k=>parseInt(value.slice(1+k*2,3+k*2),16));channels[i]=n;onChange('#'+channels.map(v=>v.toString(16).padStart(2,'0')).join(''));}}/></span>)}</div></label>;
}
const shapeButton=(shape:Shape,current:Shape,choose:(s:Shape)=>void,prefix='')=><button key={shape} className={'shape-button '+(shape===current?'active':'')} aria-label={prefix+shapeName(shape)} aria-pressed={shape===current} title={shapeName(shape)} onClick={()=>choose(shape)}><ShapeIcon shape={shape}/></button>;

export default function App() {
  const [s,setS]=useState<Settings>(initialSettings);
  const current=useRef(s);const past=useRef<Settings[]>([]);const future=useRef<Settings[]>([]);const [,refreshHistory]=useState(0);
  const [saved,setSaved]=useState(true), [storageOK,setStorageOK]=useState(true);
  const update=useCallback((patch:Partial<Settings>|Settings)=>{
    const next={...current.current,...patch};
    if(next.morph&&morphIssue(next))next.morph=false;
    if((Object.keys(next) as (keyof Settings)[]).every(key=>Object.is(next[key],current.current[key])))return;
    past.current=[...past.current.slice(-59),current.current];future.current=[];current.current=next;setS(next);setSaved(false);
  },[]);
  const undo=useCallback(()=>{ const previous=past.current.pop();if(previous){future.current.push(current.current);current.current=previous;setS(previous);refreshHistory(n=>n+1);} },[]);
  const redo=useCallback(()=>{ const next=future.current.pop();if(next){past.current.push(current.current);current.current=next;setS(next);refreshHistory(n=>n+1);} },[]);
  const [toast,setToast]=useState('');
  const [uploadOpen,setUploadOpen]=useState(false),[libraryReady,setLibraryReady]=useState(false),[libraryStatus,setLibraryStatus]=useState('載入中');
  useEffect(()=>{let active=true;const initialIds=new Set(current.current.customShapes.map(c=>c.id));void readLibrary().then(result=>{if(!active)return;const currentIds=new Set(current.current.customShapes.map(c=>c.id));const retained=result.shapes.filter(c=>!initialIds.has(c.id)||currentIds.has(c.id));const merged=mergeLibraries(retained,current.current.customShapes);const next={...current.current,customShapes:merged};current.current=next;setS(next);setLibraryStatus(result.backend);setLibraryReady(true);}).catch(()=>{if(active){setLibraryReady(true);setLibraryStatus('請用 JSON 備份');}});return()=>{active=false;};},[]);
  useEffect(()=>{if(!libraryReady)return;try{localStorage.setItem(STORAGE,projectJSON(current.current));}catch{setStorageOK(false);}let active=true;void saveLibrary(s.customShapes).catch(()=>{if(active)setLibraryStatus('儲存失敗，請備份 JSON');});return()=>{active=false;};},[s.customShapes,libraryReady]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),4200);return()=>clearTimeout(timer);},[toast]);
  useEffect(()=>{const timer=setTimeout(()=>{try{localStorage.setItem(STORAGE,projectJSON(s));setSaved(true);setStorageOK(true);}catch{setStorageOK(false);}},350);return()=>clearTimeout(timer);},[s]);
  const stitchMode=s.stitch.enabled,imageMode=!stitchMode&&s.halftone.enabled&&!!s.halftone.image,grainMode=!stitchMode&&s.grain.enabled;
  const stitchPreview=useMemo(()=>stitchMode?stitchMarkup(s):'',[s,stitchMode]);
  const geometrySettings=useRef(s);if((Object.keys(s) as (keyof Settings)[]).some(k=>k!=='grain'&&!Object.is(s[k],geometrySettings.current[k])))geometrySettings.current=s;
  const patternInput=geometrySettings.current;
  const imageWorker=useHalftoneWorker(patternInput),grainWorker=useGrain(s);
  const pattern=useMemo(()=>imageMode||stitchMode?{glyphs:[],effectiveSpacingX:patternInput.halftone.spacingX,effectiveSpacingY:patternInput.halftone.spacingY,coverage:0,limited:false}:generatePattern(patternInput),[patternInput,imageMode,stitchMode]);
  const preview=imageMode?(imageWorker.packed??pattern):pattern;
  const glyphCount=imageMode?(imageWorker.packed?.count??0):pattern.glyphs.length;
  const [presetId,setPresetId]=useState('quiet');
  const [showControls,setShowControls]=useState(true),[showGrid,setShowGrid]=useState(false),[zoom,setZoom]=useState(100),[sidebar,setSidebar]=useState(true),[linked,setLinked]=useState(true);
  const [dialog,setDialog]=useState<'export'|'help'|'future'|null>(null),[format,setFormat]=useState<ExportFormat>('PNG'),[scale,setScale]=useState(2),[cadUnit,setCadUnit]=useState<'mm'|'px'>('mm'),[busy,setBusy]=useState(false);
  const [activeTab,setActiveTab]=useState<'pattern'|'stitch'|'image'|'grain'|'material'>(s.stitch.enabled?'stitch':'pattern');
  const svgRef=useRef<SVGSVGElement>(null),stageRef=useRef<HTMLDivElement>(null),importRef=useRef<HTMLInputElement>(null);
  const drag=useRef<ControlKey|null>(null),workerRef=useRef<Worker|null>(null);
  useEffect(()=>()=>workerRef.current?.terminate(),[]);
  useEffect(()=>{
    const handle=(e:KeyboardEvent)=>{if(e.target instanceof Element && e.target.closest('input,textarea,select'))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();}
      if(e.key==='Escape'&&!busy){setDialog(null);drag.current=null;}
    };window.addEventListener('keydown',handle);return()=>window.removeEventListener('keydown',handle);
  },[undo,redo,busy]);
  const mode=(mode:Mode)=>{const points=mode==='vertical'?{start:{x:.5,y:.15},end:{x:.5,y:.85}}:mode==='radial'?{start:{x:.5,y:.5},end:{x:.9,y:.5},center:{x:.5,y:.5},radius:.4*s.width/Math.min(s.width,s.height)}:{start:{x:.17,y:.5},end:{x:.83,y:.5}};update({mode,...points,...(mode==='irregular'&&s.jitter===0&&s.randomRotation===0&&s.randomSize===0?{jitter:40,randomRotation:30,randomSize:35,randomDensity:20}:{})});};
  const setSpacing=(key:'spacingX'|'spacingY',value:number)=>update(linked?{spacingX:value,spacingY:value}:{[key]:value});
  const angle=Math.atan2((s.end.y-s.start.y)*s.height,(s.end.x-s.start.x)*s.width)*180/Math.PI;
  const setAngle=(deg:number)=>{const radius=Math.hypot((s.end.x-s.start.x)*s.width,(s.end.y-s.start.y)*s.height);update({end:{x:clamp(s.start.x+Math.cos(deg*Math.PI/180)*radius/s.width),y:clamp(s.start.y+Math.sin(deg*Math.PI/180)*radius/s.height)}});};
  const applyPreset=(id:string)=>{const p=PRESETS.find(p=>p.id===id)!;setPresetId(id);update({...presetSettings(p),customShapes:current.current.customShapes});setZoom(100);};
  const randomize=()=>{const seed=newSeed();const shapes:Shape[]=['circle','triangle','square','diamond','hexagon','rectangle'];update({seed,shape:shapes[seed%6],targetShape:shapes[Math.floor(seed/7)%6],rotation:seed%91-45,mode:MODES[seed%4],jitter:seed%45,noiseScale:3+seed%8,minSize:1,maxSize:8+seed%11,density:75+seed%26});setPresetId('');setToast('已產生新圖案，可透過 Seed 重現。');};
  const moveHandle=(e:React.PointerEvent<SVGSVGElement>)=>{if(!drag.current||!svgRef.current)return;const box=svgRef.current.getBoundingClientRect();if(!box.width||!box.height)return;const point={x:clamp((e.clientX-box.left)/box.width),y:clamp((e.clientY-box.top)/box.height)};update(controlPatch(current.current,drag.current,point));};
  const handleKey=(e:React.KeyboardEvent<SVGGElement>,key:ControlKey)=>{const directions:Record<string,Point>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};const d=directions[e.key];if(!d)return;e.preventDefault();const step=e.shiftKey?.05:.01;const point=controlPositions(current.current)[key];update(controlPatch(current.current,key,{x:clamp(point.x+d.x*step),y:clamp(point.y+d.y*step)}));};
  const importProject=async(file?:File)=>{if(!file)return;try{if(file.size>25_000_000)throw new Error('專案檔超過 25 MB，請確認檔案是否正確。');const next=parseProject(await file.text());const library=new Map(current.current.customShapes.map(c=>[c.id,c]));next.customShapes.forEach(c=>library.set(c.id,c));update({...next,customShapes:mergeLibraries([],[...library.values()])});if(next.stitch.enabled)setActiveTab('stitch');setPresetId('');setToast('JSON 專案已載入，所有參數已還原。');}catch(error){setToast(error instanceof Error?error.message:'無法讀取專案。');}if(importRef.current)importRef.current.value='';};
  const openExport=(f:ExportFormat)=>{setFormat(f);setDialog('export');};
  const exportFile=async()=>{
    if(busy)return;setBusy(true);
    const name=`cmf-pattern-${s.seed}`;
    try {
      if(stitchMode&&(format==='DWG'||format==='DXF'))throw new Error('車縫試用請使用 SVG／PNG／JSON；尚未提供機台或 CAD 車縫加工資料。');
      if(format==='SVG')downloadBlob(new Blob([stitchMode?stitchSVG(s):imageMode?await imageWorker.exportText(s,'svg'):svgDocument(s,pattern)],{type:'image/svg+xml'}),name+'.svg');
      if(format==='JSON')downloadBlob(new Blob([projectJSON(s)],{type:'application/json'}),name+'.json');
      if(format==='PNG'&&grainMode)downloadBlob(await grainPNG(await grainWorker.exportRender(s),s.grain.channel,s.grain.dpi),`cmf-grain-${s.grain.channel}-${s.grain.seed}.png`);
      if(format==='PNG'&&!grainMode)downloadBlob(stitchMode?await pngSVGBlob(stitchSVG(s),s.width,s.height,scale):imageMode?await pngSVGBlob(await imageWorker.exportText(s,'svg'),s.width,s.height,scale):await pngBlob(s,pattern,scale),name+'.png');
      if(format==='DXF')downloadBlob(new Blob([imageMode?await imageWorker.exportText(s,'dxf',cadUnit):dxfDocument(s,pattern,cadUnit)],{type:'application/dxf'}),name+'.dxf');
      if(format==='DWG') {
        const bytes=await new Promise<ArrayBuffer>((resolve,reject)=>{
          const worker=new DwgWorker();workerRef.current=worker;
          const timeout=setTimeout(()=>{worker.terminate();workerRef.current=null;reject(new Error('DWG 轉換逾時，請降低圖案密度後重試。'));},90000);
          worker.onmessage=e=>{clearTimeout(timeout);worker.terminate();workerRef.current=null;if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.bytes);};
          worker.onerror=()=>{clearTimeout(timeout);worker.terminate();workerRef.current=null;reject(new Error('DWG 轉換失敗，請使用 DXF 或降低圖案密度。'));};
          worker.postMessage({settings:s,unit:cadUnit});
        });
        downloadBlob(new Blob([bytes],{type:'application/acad'}),name+'.dwg');
      }
      setToast(`${format} 已匯出，請查看瀏覽器下載項目。`);setDialog(null);
    }catch(error){setToast(error instanceof Error?error.message:'匯出失敗，請重試。');}finally{setBusy(false);}
  };
  const exportGrain=async(channel:GrainChannel)=>{if(busy)return;setBusy(true);try{const r=await grainWorker.exportRender(s);downloadBlob(await grainPNG(r,channel,s.grain.dpi),`cmf-grain-${channel}-${s.grain.seed}.png`);setToast(CHANNEL_NAMES[channel]+'已匯出。');}catch(e){setToast(e instanceof Error?e.message:'材質匯出失敗。');}finally{setBusy(false);}};
  const fullScreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(stageRef.current?.requestFullscreen)await stageRef.current.requestFullscreen();else setToast('此瀏覽器未提供全螢幕模式。');}catch{setToast('無法進入全螢幕，可使用縮放控制查看細節。');}};
  const copySeed=async()=>{let field:HTMLTextAreaElement|undefined;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(String(s.seed));else{field=document.createElement('textarea');field.value=String(s.seed);field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();if(!document.execCommand('copy'))throw new Error('copy unavailable');}setToast('Seed 已複製。');}catch{setToast('複製失敗，請直接選取 Seed 數字。');}finally{field?.remove();}};
  const addCustom=(shape:CustomShape)=>{const library=mergeLibraries(current.current.customShapes,[shape]);if(library.length>MAX_SHAPES)throw new Error('圖案庫最多可保存 20 個圖案。');if(current.current.stitch.enabled){update({customShapes:library,stitch:{...current.current.stitch,layout:'shape',shape:shape.id}});setToast('已加入向量圖案並套用至車縫輪廓。');return;}update({customShapes:library,shape:shape.id,morph:false,customScaleX:1,customScaleY:1});setToast('已加入真正向量圖案，並套用至畫布。');};
  const issue=morphIssue(s),dimensions=customDimensions(s);
  const setCustomDimension=(axis:'x'|'y',value:number)=>{const old=axis==='x'?dimensions.width:dimensions.height,scale=(axis==='x'?s.customScaleX:s.customScaleY)*value/Math.max(.001,old);const next=clamp(scale,.001,1000);update(s.customAspectLock?{customScaleX:next,customScaleY:next}:axis==='x'?{customScaleX:next}:{customScaleY:next});};
  const handles=controlPositions(s);
  const showRadial=s.mode==='radial'||s.randomEnvelope==='radial'||s.densityMode==='radial';
  const showRandom=s.mode==='irregular'||s.jitter>0||s.randomRotation>0||s.randomSize>0||s.randomDensity>0;
  const renderHandle=(key:ControlKey,label:string,name:string,morph=false)=>{
    const point=handles[key],accent=morph?'var(--ui-morph)':'var(--ui-accent)',ink=morph?'var(--ui-morph-ink)':'var(--ui-accent-ink)';
    return <g key={key} role="button" tabIndex={0} aria-label={name} className="control-handle" onKeyDown={e=>handleKey(e,key)} onPointerDown={e=>{e.preventDefault();drag.current=key;svgRef.current?.setPointerCapture?.(e.pointerId);}} transform={`translate(${point.x*s.width},${point.y*s.height})`}><circle r="22" fill="transparent"/><circle r="12" fill={accent} opacity=".15"/><circle r="7" fill="var(--ui-panel)" stroke={accent} strokeWidth="2"/><rect x="-33" y="-34" width="66" height="18" rx="4" fill="var(--ui-panel)" stroke={accent} strokeWidth=".8"/><text textAnchor="middle" y="-21" fill={ink} fontSize="10" fontWeight="600">{label}</text></g>;
  };
  return <div className="studio">
    <header className="topbar">
      <div className="brand" aria-label="AI CMF Pattern Studio"><span className="brand-mark"><i/><i/><i/><i/></span><span><strong>CMF <b>Pattern Studio</b><em>AI</em></strong><small>參數化紋理實驗室</small></span></div>
      <div className="top-divider"/>
      <span className="workspace-name">設計工作台</span>
      <div className="top-spacer"/>
      <span className="local-status"><span/> 本機運算 <LockKeyhole size={11}/></span>
      <button className="icon-button help-button" aria-label="操作說明" title="操作說明" onClick={()=>setDialog('help')}><CircleHelp size={17}/></button>
      <div className="top-divider"/>
      <button className="button export-top" onClick={()=>openExport('SVG')}><ArrowDownToLine size={14}/>匯出 SVG</button>
      <button className="button primary export-top" onClick={()=>openExport('PNG')}><ArrowDownToLine size={14}/>匯出 PNG</button>
    </header>

    <div className="project-bar"><div className="breadcrumbs"><span>工作空間</span><ChevronRight size={12}/><span>CMF 設計</span><ChevronRight size={12}/><strong>未命名紋理探索</strong><span className="version">V 2.0 · 咬花材質</span></div><span className="save-status"><span className={saved&&storageOK?'saved':''}/>{!storageOK?'自動儲存不可用，請匯出 JSON':saved?'已儲存於此瀏覽器':'儲存中…'}</span></div>

    <div className={'main-layout '+(!sidebar?'sidebar-hidden':'')}>
      {sidebar&&<aside className="sidebar">
        <div className="sidebar-heading"><div><SlidersHorizontal size={16}/><h1>圖案參數</h1></div><button className="text-button" title="重設全部參數" onClick={()=>{update({...DEFAULTS,customShapes:s.customShapes});setPresetId('quiet');setToast('已還原初始參數，可按復原回到上一版。');}}><RotateCcw size={12}/>重設</button></div>
        <div className="sidebar-tabs"><button className={activeTab==='material'?'active':''} onClick={()=>setActiveTab('material')}><Layers3 size={13}/>色彩與畫布</button><button className={activeTab==='pattern'?'active':''} onClick={()=>{setActiveTab('pattern');if(stitchMode)update({stitch:{...s.stitch,enabled:false}});}}><Grid2X2 size={13}/>圖案設計</button><button className={activeTab==='stitch'?'active':''} onClick={()=>{setActiveTab('stitch');if(!stitchMode)update({stitch:{...s.stitch,enabled:true}});}}><Grid2X2 size={13}/>電腦車縫</button><button className={activeTab==='image'?'active':''} onClick={()=>{setActiveTab('image');if(stitchMode)update({stitch:{...s.stitch,enabled:false}});}}><ScanLine size={13}/>圖片轉點陣</button><button className={activeTab==='grain'?'active':''} onClick={()=>{setActiveTab('grain');if(stitchMode)update({stitch:{...s.stitch,enabled:false}});}}><Layers3 size={13}/>咬花材質</button></div>
        <div className="sidebar-scroll">
          {activeTab==='pattern'?<>

            <Section title="漸變模式" en="GRADIENT FIELD"><div className="mode-grid">{MODES.map(m=><button key={m} className={'mode-card '+(s.mode===m?'active':'')} aria-pressed={s.mode===m} onClick={()=>mode(m)}><span className={'mode-graphic '+m}>{Array.from({length:7},(_,i)=><i key={i}/>)}</span><span>{MODE_NAMES[m]}</span>{s.mode===m&&<span className="mode-selected"/>}</button>)}</div></Section>
            <Section title="幾何形狀" en="SHAPE LIBRARY"><div className="shapes-row">{SHAPES.map(shape=>shapeButton(shape,s.shape,shape=>update({shape}))) }<button className="shape-button custom-add-button" aria-label="新增自訂圖案" title="＋ 自訂圖案" disabled={!libraryReady||s.customShapes.length>=MAX_SHAPES} onClick={()=>setUploadOpen(true)}><Plus size={17}/></button></div><div className="shape-caption"><span>{shapeName(s.shape,s.customShapes)}</span><small>基礎形狀 · 封閉輪廓</small></div>
              <CustomLibrary shapes={s.customShapes} selected={s.shape} status={libraryStatus} onSelect={shape=>update({shape:shape.id,morph:false,...(s.shape!==shape.id?{customScaleX:1,customScaleY:1}:{})})} onRename={(id,name)=>update({customShapes:s.customShapes.map(c=>c.id===id?{...c,name,updatedAt:Date.now()}:c)})} onDelete={id=>{update({customShapes:s.customShapes.filter(c=>c.id!==id),...((s.stitch.shape===id||s.stitch.mergeShape===id)?{stitch:{...s.stitch,...(s.stitch.shape===id?{shape:'circle' as const}:{}),...(s.stitch.mergeShape===id?{mergeShape:'rectangle' as const}:{})}}:{}),proportions:{start:Object.fromEntries(Object.entries(s.proportions.start).filter(([key])=>key!==id)),end:Object.fromEntries(Object.entries(s.proportions.end).filter(([key])=>key!==id))},...(s.shape===id?{shape:'circle' as const}:{}),...(s.targetShape===id?{targetShape:'circle' as const}:{} )});setToast('圖案已刪除，可按復原還原。');}}/>
              {isCustom(s.shape)&&<><div className="two-col"><NumberField label="圖案寬度" value={dimensions.width} min={.1} max={2000} unit="px" onChange={v=>setCustomDimension('x',v)}/><NumberField label="圖案高度" value={dimensions.height} min={.1} max={2000} unit="px" onChange={v=>setCustomDimension('y',v)}/></div><label className="checkbox"><input type="checkbox" checked={s.customAspectLock} onChange={e=>update({customAspectLock:e.target.checked})}/>自訂圖案等比例縮放</label><p className="muted-note">寬高為最大尺寸的基準框；尺寸漸變及隨機尺寸會再依比例調整。</p>{s.customShapes.find(c=>c.id===s.shape)?.unit==='mm'&&<button className="button" onClick={()=>{const c=s.customShapes.find(c=>c.id===s.shape)!;const size=s.endpointSize?Math.max(s.sizeStart,s.sizeEnd):s.maxSize;const scale=Math.max(c.sourceWidth,c.sourceHeight)*96/25.4/Math.max(.001,size);if(scale>.001&&scale<=1000){update({customScaleX:scale,customScaleY:scale});setToast('已依 96 dpi 換算，套用原始 CAD 的 mm 尺寸。');}else setToast('原始尺寸超過縮放範圍，請先調整最大尺寸。');}}>套用原始 CAD 尺寸（mm）</button>}</>}
              <ProportionsEditor settings={s} endpoint="start" onChange={update}/>
              {issue&&<p className="custom-warning" role="note">{issue}</p>}
              <label className="select-label">目標形狀<select aria-label="目標形狀" value={s.targetShape} onChange={e=>update({targetShape:e.target.value as Shape})}>{SHAPES.map(shape=><option key={shape} value={shape}>{shapeName(shape)}</option>)}{s.customShapes.map(shape=><option key={shape.id} value={shape.id}>{shape.name}（自訂）</option>)}</select></label><div className="toggle-row"><label htmlFor="morph-toggle">啟用形狀漸變<span>依位置向量插值，尺寸與密度分開控制</span></label><button id="morph-toggle" disabled={!!issue} role="switch" aria-checked={s.morph} aria-label="啟用形狀漸變" className={'switch '+(s.morph?'on':'')} onClick={()=>update({morph:!s.morph})}><span/></button></div>
              {s.morph&&<div className="morph-panel"><div className="morph-label"><span>起點 <b>{s.morphRangeStart}%</b></span><ArrowRight size={13}/><span>終點 <b>{s.morphRangeEnd}%</b></span></div><ProportionsEditor settings={s} endpoint="end" onChange={update}/><div className="morph-preview"><MorphStages settings={s} start={s.morphRangeStart} end={s.morphRangeEnd}/></div><div className="v2-direction-group" role="group" aria-label="形狀變形方向">{([['horizontal','水平變形'],['vertical','垂直變形'],['custom','自訂方向']] as const).map(([value,label])=><button key={value} className={s.morphDirection===value?'active':''} aria-pressed={s.morphDirection===value} onClick={()=>update({morphDirection:value})}>{label}</button>)}</div>
                <div className="two-col"><NumberField label="起點變形比例" value={s.morphRangeStart} min={0} max={100} unit="%" onChange={v=>update({morphRangeStart:v})}/><NumberField label="終點變形比例" value={s.morphRangeEnd} min={0} max={100} unit="%" onChange={v=>update({morphRangeEnd:v})}/></div>
                <label className="checkbox"><input type="checkbox" checked={s.endpointSize} onChange={e=>update({endpointSize:e.target.checked})}/>獨立起終尺寸</label>{s.endpointSize&&<><div className="two-col"><NumberField label="起始尺寸" value={s.sizeStart} min={.1} max={40} unit="px" onChange={v=>update({sizeStart:v})}/><NumberField label="結束尺寸" value={s.sizeEnd} min={.1} max={40} unit="px" onChange={v=>update({sizeEnd:v})}/></div><p className="morph-note">尺寸使用藍色尺寸場，形狀使用獨立形狀場。</p></>}
                <label className="checkbox"><input type="checkbox" checked={s.rotationGradient} onChange={e=>update({rotationGradient:e.target.checked})}/>起終旋轉漸變</label>{s.rotationGradient&&<div className="two-col"><NumberField label="起始旋轉" value={s.rotationStart} min={-180} max={180} unit="°" onChange={v=>update({rotationStart:v})}/><NumberField label="結束旋轉" value={s.rotationEnd} min={-180} max={180} unit="°" onChange={v=>update({rotationEnd:v})}/></div>}
                <Range label="過渡線性度" value={s.morphAmount} min={0} max={100} unit="%" onChange={v=>update({morphAmount:v})}/><p className="morph-note">0% 柔和過渡，100% 線性過渡。兩端始終保留完整形狀。</p><button className="button morph-demo" onClick={()=>{update({...DEFAULTS,customShapes:s.customShapes,shape:'hexagon',targetShape:'triangle',morph:true,morphAmount:100,minSize:18,maxSize:18,spacingX:32,spacingY:32,stagger:false,jitter:0});setPresetId('');setZoom(100);setShowControls(false);setToast('已套用等尺寸六角形 → 三角形示範，可直接觀察連續變形。');}}>六角形 → 三角形示範<ArrowRight size={12}/></button></div>}
              {(s.shape==='rectangle'||s.targetShape==='rectangle')&&<Range label="長方形長寬比" value={s.aspect} min={1} max={5} step={.1} unit=":1" onChange={v=>update({aspect:v})}/>}
            </Section>
            <Section title="網格與尺寸" en="LAYOUT"><div className="spacing-heading"><span>圖案中心間距</span><button className={'link-button '+(linked?'active':'')} aria-label="連動水平與垂直間距" aria-pressed={linked} onClick={()=>setLinked(!linked)}><Link2 size={12}/>{linked?'已連動':'獨立'}</button></div><Range label="水平間距" value={s.spacingX} min={7} max={80} step={.5} unit="px" onChange={v=>setSpacing('spacingX',v)}/><Range label="垂直間距" value={s.spacingY} min={7} max={80} step={.5} unit="px" onChange={v=>setSpacing('spacingY',v)}/><div className="two-col"><NumberField label="最小尺寸" disabled={s.endpointSize} value={s.minSize} min={0} max={s.maxSize} unit="px" onChange={v=>update({minSize:v})}/><NumberField label="最大尺寸" disabled={s.endpointSize} value={s.maxSize} min={Math.max(.1,s.minSize)} max={40} unit="px" onChange={v=>update({maxSize:v})}/></div><Range label="圖案密度" value={s.density} min={0} max={100} unit="%" onChange={v=>update({density:v})}/><Range label="旋轉角度" value={s.rotation} min={-180} max={180} unit="°" onChange={v=>update({rotation:v})}/><label className="checkbox"><input type="checkbox" checked={s.stagger} onChange={e=>update({stagger:e.target.checked})}/>錯列排列<span>交錯網格</span></label></Section>
            <Section title="漸變控制" en="FIELD CONTROL"><Range label="漸變方向" value={angle} min={-180} max={180} unit="°" onChange={setAngle}/><Range label="漸變曲線" value={s.falloff} min={.2} max={4} step={.05} onChange={v=>update({falloff:v})}/><Range label="位置不規則度" value={s.jitter} min={0} max={100} unit="%" onChange={v=>update({jitter:v})}/>{s.mode==='irregular'&&<Range label="肌理尺度" value={s.noiseScale} min={1} max={20} step={.5} onChange={v=>update({noiseScale:v})}/>}<label className="checkbox"><input type="checkbox" checked={s.reverse} onChange={e=>update({reverse:e.target.checked})}/>反轉尺寸漸變方向</label><div className="field-tip"><MoveUpRight size={13}/><span>藍色點調整尺寸／隨機場；自訂形狀方向使用綠色點。</span></div></Section>
            <Section title="不規則排列與密度" en="獨立幾何控制">
              <Range label="規則／隨機混合" value={s.randomness} min={0} max={100} unit="%" onChange={v=>update({randomness:v})}/>
              <Range label="隨機旋轉範圍" value={s.randomRotation} min={0} max={180} unit="°" onChange={v=>update({randomRotation:v})}/>
              <Range label="隨機尺寸幅度" value={s.randomSize} min={0} max={100} unit="%" onChange={v=>update({randomSize:v})}/>
              <Range label="隨機密度幅度" value={s.randomDensity} min={0} max={100} unit="%" onChange={v=>update({randomDensity:v})}/>
              <label className="select-label spaced-label">隨機影響方式<select aria-label="隨機影響方式" value={s.randomEnvelope} onChange={e=>update({randomEnvelope:e.target.value as Settings['randomEnvelope']})}><option value="uniform">全域一致</option><option value="directional">沿漸變方向增加</option><option value="radial">由中心向外增加</option></select></label>
              <label className="select-label spaced-label">密度漸變<select aria-label="密度漸變" value={s.densityMode} onChange={e=>update({densityMode:e.target.value as Settings['densityMode']})}><option value="uniform">固定密度</option><option value="directional">獨立方向漸變</option><option value="radial">中心密集／向外稀疏</option></select></label>
              {s.densityMode!=='uniform'&&<><div className="two-col"><NumberField label="起點／中心密度" value={s.densityStart} min={0} max={100} unit="%" onChange={v=>update({densityStart:v})}/><NumberField label="終點／邊緣密度" value={s.densityEnd} min={0} max={100} unit="%" onChange={v=>update({densityEnd:v})}/></div>{s.densityMode==='directional'&&<Range label="密度漸變方向" value={s.densityAngle} min={-180} max={180} unit="°" onChange={v=>update({densityAngle:v})}/>}</>}
              {showRadial&&<><div className="two-col"><NumberField label="中心 X" value={s.center.x*100} min={0} max={100} unit="%" onChange={v=>update(controlPatch(s,'center',{...s.center,x:v/100}))}/><NumberField label="中心 Y" value={s.center.y*100} min={0} max={100} unit="%" onChange={v=>update(controlPatch(s,'center',{...s.center,y:v/100}))}/></div>
              <Range label="漸變半徑" value={s.radius*100} min={2} max={Math.max(150,Math.ceil(s.radius*100))} unit="%" step={1} onChange={v=>update({radius:v/100,...(s.mode==='radial'?{end:{x:clamp(s.center.x+v/100*Math.min(s.width,s.height)/s.width),y:s.center.y}}:{})})}/></>}
              <button className="button full-width spaced-label" onClick={()=>update({mode:'irregular',jitter:70,randomRotation:65,randomSize:55,randomDensity:30,randomness:100,randomEnvelope:'radial',densityMode:'radial',densityStart:100,densityEnd:15,center:{x:.5,y:.5},radius:.42})}>中心密集／外圍散開示範<ArrowRight size={12}/></button>
              <p className="muted-note">0% 混合保留規則排列，100% 套用設定的隨機幅度。形狀比例不使用密度或雜訊值。</p>
            </Section>
            <Section title="隨機生成" en="SEED"><div className="seed-row"><NumberField label="隨機種子" value={s.seed} min={0} max={2147483647} onChange={v=>update({seed:Math.round(v)})}/><button className="icon-button" aria-label="複製 Seed" onClick={copySeed}><Copy size={14}/></button><button className="button" onClick={()=>update({seed:newSeed()})}><Shuffle size={13}/>新 Seed</button></div><p className="muted-note">相同的 Seed 與參數，會產生相同的圖案。</p><button className="button random-button" onClick={randomize}><Shuffle size={14}/>隨機探索新圖案<MoveUpRight size={14}/></button></Section>
          </>:activeTab==='stitch'?<StitchPanel s={s} onChange={update} onCustom={()=>setUploadOpen(true)}/>:activeTab==='grain'?<GrainPanel s={s} onChange={update} onExport={channel=>void exportGrain(channel)} onJSON={()=>openExport('JSON')} result={grainWorker.result} busy={busy}/>:activeTab==='image'?<><HalftonePanel s={s} onChange={update} onCustom={()=>setUploadOpen(true)}/><Section title="點陣色彩" en="COLOR"><div className="two-col"><ColorField label="圖案顏色" value={s.foreground} onChange={foreground=>update({foreground})}/><ColorField label="背景顏色" value={s.background} onChange={background=>update({background})}/></div><label className="checkbox"><input type="checkbox" checked={s.transparentBackground} onChange={e=>update({transparentBackground:e.target.checked})}/>透明背景</label><button className="button full-width" onClick={()=>update({foreground:'#1D1D1F',background:'#F4F0E7',transparentBackground:false})}>重設黑白配色</button></Section></>:<>
            <Section title="色彩與表面" en="COLOR & FINISH"><div className="two-col"><ColorField label="圖案顏色" value={s.foreground} onChange={v=>update({foreground:v})}/><ColorField label="背景顏色" value={s.background} onChange={v=>update({background:v})}/></div><div className="palette-row">{[['#29332f','#f2eee4'],['#adbcb2','#26342e'],['#ddd5cb','#3d352e'],['#2c3034','#bbbfc0'],['#68483a','#e6d3bc']].map(([fg,bg],i)=><button key={i} title={'材質配色 '+(i+1)} aria-label={'套用材質配色 '+(i+1)} onClick={()=>update({foreground:fg,background:bg})}><span style={{background:bg}}/><span style={{background:fg}}/></button>)}<button className="icon-button" aria-label="交換圖案與背景顏色" title="交換顏色" onClick={()=>update({foreground:s.background,background:s.foreground})}><ArrowLeftRight size={14}/></button></div><Range label="圖案不透明度" value={s.opacity} min={0} max={100} unit="%" onChange={v=>update({opacity:v})}/></Section>
            <label className="checkbox transparent-control"><input type="checkbox" checked={s.transparentBackground} onChange={e=>update({transparentBackground:e.target.checked})}/>透明背景</label><Section title="畫布設定" en="ARTBOARD"><div className="two-col"><NumberField label="畫布寬度" value={s.width} min={200} max={2400} unit="px" onChange={v=>update({width:Math.round(v)})}/><NumberField label="畫布高度" value={s.height} min={200} max={1800} unit="px" onChange={v=>update({height:Math.round(v)})}/></div><div className="size-presets">{[[1200,800],[1000,1000],[1600,900]].map(([width,height])=><button key={width} className={s.width===width&&s.height===height?'active':''} onClick={()=>update({width,height})}>{width===height?'1:1':width===1200?'3:2':'16:9'}</button>)}</div><p className="muted-note">CAD 可匯出毫米尺寸，換算基準為 96 px = 25.4 mm。</p></Section>
            <RangeMaskPanel s={s} onChange={update}/>
            <Section title="後續擴充" en="COMING NEXT"><button className="future-card" onClick={()=>setDialog('future')}><Sparkles size={18}/><div><strong>從靈感，到紋理</strong><span>AI 文字生成 · STEP 實體輸出</span></div><ChevronRight size={15}/></button></Section>
          </>}
          <div className="sidebar-footer"><span className="tiny-dot"/>PHASE 01<span>LOCAL-FIRST DESIGN TOOL</span></div>
        </div>
      </aside>}

      <main className="workspace">
        <div className="workspace-toolbar"><div className="workspace-title"><button className="icon-button" aria-label={sidebar?'收合參數面板':'展開參數面板'} title="切換參數面板" onClick={()=>setSidebar(!sidebar)}><Settings2 size={16}/></button><span>即時預覽</span><span className="toolbar-slash">/</span><small>{stitchMode?'電腦車縫 · 試用':grainMode?'咬花材質':imageMode?'圖片點陣':MODE_NAMES[s.mode]}</small></div><div className="toolbar-actions"><button className="icon-button" aria-label="復原" title="復原 Ctrl/⌘ Z" disabled={!past.current.length} onClick={undo}><Undo2 size={15}/></button><button className="icon-button" aria-label="重做" title="重做 Ctrl/⌘ Shift Z" disabled={!future.current.length} onClick={redo}><Redo2 size={15}/></button><span className="toolbar-separator"/><button className="icon-button" title="載入 JSON 專案" aria-label="載入 JSON 專案" onClick={()=>importRef.current?.click()}><Upload size={15}/></button><button className="icon-button" aria-label="更多匯出格式" title="更多匯出格式" onClick={()=>openExport('JSON')}><MoreHorizontal size={19}/></button></div></div>

        <div className="preview-stage" ref={stageRef}>
          <div className="stage-top"><span className="canvas-tag"><span/>LIVE PREVIEW</span><div><span>{s.width} × {s.height} px</span><span className="stage-separator">|</span><button aria-label="切換控制點顯示" disabled={stitchMode&&activeTab!=='pattern'||grainMode&&s.grain.patternMode==='none'} className={showControls?'active':''} onClick={()=>setShowControls(!showControls)}>{showControls?<Eye size={12}/>:<EyeOff size={12}/>}控制點</button></div></div>
          <div className="artboard-scroll"><div className="artboard-fit" style={{'--artboard-ratio':s.width/s.height,'--zoom':zoom/100} as CSSProperties}>
            {imageMode&&!grainMode&&<CanvasPreview settings={s} packed={imageWorker.packed} bitmap={imageWorker.bitmap}/>}
            {grainMode&&<GrainCanvas result={grainWorker.result} settings={s.grain}/>}
            <svg className="pattern-canvas" data-testid="pattern-canvas" ref={svgRef} viewBox={`0 0 ${s.width} ${s.height}`} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CMF 參數化圖案即時預覽" onPointerMove={moveHandle} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
              <rect width={s.width} height={s.height} fill={grainMode||imageMode||s.transparentBackground?'none':s.background}/>
              <g fill={s.foreground} fillRule="evenodd" opacity={s.opacity/100} data-testid="pattern-glyphs">{!stitchMode&&!grainMode&&!imageMode&&pattern.glyphs.map((g,i)=><path key={i} d={g.d} data-morph={Number(g.morphT.toFixed(6))}/>)}</g>
              {stitchMode&&<g data-testid="stitch-preview" dangerouslySetInnerHTML={{__html:stitchPreview}}/>}
              {showGrid&&<g opacity=".19" stroke={s.foreground} strokeWidth=".7" pointerEvents="none">{Array.from({length:Math.ceil(s.width/preview.effectiveSpacingX)},(_,i)=><line key={'x'+i} x1={i*preview.effectiveSpacingX} x2={i*preview.effectiveSpacingX} y1={0} y2={s.height}/>)}{Array.from({length:Math.ceil(s.height/preview.effectiveSpacingY)},(_,i)=><line key={'y'+i} y1={i*preview.effectiveSpacingY} y2={i*preview.effectiveSpacingY} x1={0} x2={s.width}/>)}</g>}
              {showControls&&(!stitchMode||activeTab==='pattern')&&(!grainMode||s.grain.patternMode!=='none')&&<g className="gradient-overlay">

                <line x1={s.start.x*s.width} y1={s.start.y*s.height} x2={s.end.x*s.width} y2={s.end.y*s.height} stroke="var(--ui-accent)" strokeWidth="10" opacity=".16"/>
                <line x1={s.start.x*s.width} y1={s.start.y*s.height} x2={s.end.x*s.width} y2={s.end.y*s.height} stroke="var(--ui-accent)" strokeWidth="1.5"/>
                {s.mode!=='radial'&&renderHandle('start','尺寸 0%','漸變起點，方向鍵可微調')}
                {s.mode!=='radial'&&renderHandle('end','尺寸 100%','漸變終點，方向鍵可微調')}
                {showRadial&&<><circle cx={s.center.x*s.width} cy={s.center.y*s.height} r={s.radius*Math.min(s.width,s.height)} fill="none" stroke="var(--ui-accent)" strokeWidth="1.5" strokeDasharray="7 6" opacity=".6"/>{renderHandle('center','中心','中心位置，方向鍵可微調')}{renderHandle('radius','半徑','漸變半徑，方向鍵可微調')}</>}
                {showRandom&&renderHandle('randomness',`隨機 ${Math.round(s.randomness)}%`,'不規則程度，方向鍵可微調')}
                {s.morph&&s.morphDirection==='custom'&&<><line x1={s.morphStart.x*s.width} y1={s.morphStart.y*s.height} x2={s.morphEnd.x*s.width} y2={s.morphEnd.y*s.height} stroke="var(--ui-morph)" strokeWidth="2"/>{renderHandle('morphStart','形狀起點','形狀變形起點，方向鍵可微調',true)}{renderHandle('morphEnd','形狀終點','形狀變形終點，方向鍵可微調',true)}</>}
              </g>}
            </svg>
            <span className="artboard-corner top-left"/><span className="artboard-corner bottom-right"/>
          </div></div>
          <div className="stage-bottom"><span>SEED <b>{grainMode?s.grain.seed:s.seed}</b><span className="stage-separator">/</span>{stitchMode?'電腦車縫試用':grainMode?(s.grain.patternMode==='none'?'純咬花材質':(grainWorker.result?.glyphs??0).toLocaleString()+' 個材質圖案'):glyphCount.toLocaleString()+' 個圖案'}</span><span>CMF PATTERN LAB<span className="small-cross">+</span></span></div>
          <div className="zoom-toolbar"><button aria-label="縮小預覽" title="縮小" disabled={zoom<=50} onClick={()=>setZoom(z=>Math.max(50,z-25))}><Minus size={14}/></button><span>{zoom}%</span><button aria-label="放大預覽" title="放大" disabled={zoom>=250} onClick={()=>setZoom(z=>Math.min(250,z+25))}><Plus size={14}/></button><i/><button aria-label="符合畫布" title="符合畫布" onClick={()=>setZoom(100)}><Focus size={15}/></button><button aria-label="切換網格" title="顯示網格" className={showGrid?'active':''} onClick={()=>setShowGrid(!showGrid)}><Grid2X2 size={14}/></button><i/><button aria-label="全螢幕預覽" title="全螢幕預覽" onClick={fullScreen}><Maximize2 size={14}/></button></div>
        </div>

        {grainMode&&<div className="grain-processing" role="status">{grainWorker.error||(grainWorker.calculating||!grainWorker.result?'咬花背景運算中…':'咬花材質預覽已更新')}</div>}
        {imageMode&&!grainMode&&<div className="image-processing" role="status">{imageWorker.error|| (imageWorker.calculating?'背景運算中…保留上一版預覽':'Canvas 點陣預覽 · 向量幾何')}</div>}
        <div className="preview-info"><span><span className="tiny-dot"/>即時運算<span className="info-divider"/>{stitchMode?'車縫設計示意 · 非機台加工資料':'藍色尺寸場 · 綠色形狀場 · 控制點可拖曳'}</span><span>{stitchMode?'車縫格寬':grainMode?'材質高度範圍':'圖案覆蓋率'} <b>{stitchMode?`${s.stitch.width} mm`:grainMode&&grainWorker.result?`${grainWorker.result.minMm.toFixed(3)}～${grainWorker.result.maxMm.toFixed(3)} mm`:preview.coverage.toFixed(1)+'%'}</b></span></div>
        {preview.limited&&<div className="limit-note" role="status">高密度／複雜輪廓保護已啟用：中心間距調整為 {preview.effectiveSpacingX.toFixed(1)} × {preview.effectiveSpacingY.toFixed(1)} px。預覽與所有匯出維持一致，依輪廓節點預算調整，上限依輪廓複雜度調整（一般模式 12,000；圖片模式最多 60,000）。</div>}
        <section className="recipes"><div className="recipes-title"><div><h2>從一個靈感開始</h2><span>STARTER RECIPES</span></div><button className="text-button" onClick={randomize}><Shuffle size={13}/>隨機探索<ArrowRight size={12}/></button></div><div className="recipe-grid">{PRESETS.map(p=><button key={p.id} className={'recipe-card '+(presetId===p.id?'selected':'')} onClick={()=>applyPreset(p.id)}><div className={'recipe-art '+p.id}><PresetArt preset={p.id}/>{presetId===p.id&&<span className="recipe-check"><Check size={10}/></span>}</div><div className="recipe-description"><span className="recipe-en">{p.en}</span><strong>{p.name}<MoveUpRight size={12}/></strong><small>{p.material}</small></div></button>)}</div></section>
        <footer className="workspace-footer"><span><LockKeyhole size={11}/>設計留在你的裝置 · 無需登入</span><button onClick={()=>setDialog('future')}><Sparkles size={12}/>AI & STEP<span>即將推出</span></button><span>STUDIO / 01</span></footer>
      </main>
    </div>
    <input hidden ref={importRef} type="file" accept=".json,application/json" aria-label="選擇 JSON 專案檔" onChange={e=>void importProject(e.target.files?.[0])}/>
    {uploadOpen&&<UploadDialog onClose={()=>setUploadOpen(false)} onAdd={addCustom}/>}
    {toast&&<div className="toast" role="status" aria-label="操作通知"><Check size={16}/><span>{toast}</span><button aria-label="關閉通知" onClick={()=>setToast('')}><X size={13}/></button></div>}
    {dialog&&<Modal title={dialog==='export'?'匯出設計':dialog==='help'?'歡迎使用紋理工作台':'下一階段的設計能力'} close={()=>{if(!busy)setDialog(null);}} busy={busy}>
      {dialog==='export'?<><p className="modal-intro">{stitchMode?'車縫試用：PNG 為材質示意，SVG 為向量縫線，JSON 可還原參數。尚不支援機台加工資料。':'將你的紋理帶入提案、視覺化與材料開發流程。'}</p><div className="export-formats">{(['PNG','SVG','JSON','DWG','DXF'] as ExportFormat[]).map(f=><button key={f} disabled={busy||stitchMode&&(f==='DWG'||f==='DXF')} className={format===f?'active':''} onClick={()=>setFormat(f)}>{f}</button>)}</div><div className="export-detail"><div className="export-file-icon">{format==='JSON'?<FileJson size={27}/>:format==='DWG'||format==='DXF'?<ScanLine size={27}/>:<Grid2X2 size={27}/>}</div><div><strong>{format==='PNG'?(grainMode?'咬花'+CHANNEL_NAMES[s.grain.channel]:'高解析度點陣圖'):format==='SVG'?'可編輯向量圖案':format==='JSON'?'完整參數專案檔':format==='DWG'?'AutoCAD DWG 幾何輪廓':'CAD DXF 幾何輪廓'}</strong><p>{format==='PNG'?(grainMode?'使用咬花輸出尺寸與 DPI，下載目前材質通道。':'保留背景與配色，適合簡報與 Imageboard。'):format==='SVG'?(grainMode?'僅匯出原 Pattern 向量，不包含咬花材質貼圖。':'封閉向量輪廓，可於 Illustrator 或 CAD 軟體編輯。'):format==='JSON'?'包含 Seed、漸變控制點與全部參數，可重新載入。':(grainMode?'僅匯出 Pattern 平面輪廓，不包含材質深度或咬花貼圖。':'輸出封閉多段線與畫布邊界，不包含底色與填色。')}</p></div></div>
        {format==='PNG'&&grainMode&&<p className="muted-note">咬花輸出長邊 {s.grain.exportSize} px · {s.grain.dpi} DPI · {CHANNEL_NAMES[s.grain.channel]}</p>}
        {format==='PNG'&&!grainMode&&<label className="select-label export-select">輸出倍率<select aria-label="PNG 輸出倍率" disabled={busy} value={scale} onChange={e=>setScale(Number(e.target.value))}><option value={1}>1× · {s.width} × {s.height} px</option><option value={2}>2× · {s.width*2} × {s.height*2} px</option><option value={3}>3× · {s.width*3} × {s.height*3} px</option></select></label>}
        {(format==='DWG'||format==='DXF')&&<><label className="select-label export-select">CAD 單位<select aria-label="CAD 匯出單位" disabled={busy} value={cadUnit} onChange={e=>setCadUnit(e.target.value as 'mm'|'px')}><option value="mm">毫米 mm（96 px = 25.4 mm）</option><option value="px">無單位（1 px = 1 CAD unit）</option></select></label><p className="cad-note">{format==='DWG'?'DWG R2000 · 本機背景轉換 · ':''}曲線以 96 節點近似。量產前請在 CAD 中確認尺寸、孔徑與加工公差。</p></>}
        <div className="export-summary"><span>{stitchMode?'電腦車縫試用':grainMode?(s.grain.patternMode==='none'?'純咬花材質':(grainWorker.result?.glyphs??0).toLocaleString()+' 個材質圖案'):glyphCount.toLocaleString()+' 個圖案'}</span><span>Seed {s.seed}</span><span>{s.width} × {s.height} px</span></div><button className="button primary export-confirm" disabled={busy} onClick={()=>void exportFile()}>{busy?<><span className="spinner"/>正在產生 {format}…</>:<><ArrowDownToLine size={16}/>下載 {format}<ArrowRight size={15}/></>}</button></>:dialog==='help'?<><p className="modal-intro">專為汽車內裝 CMF 團隊設計，從參數探索到可交付的圖案。</p><ol className="help-steps"><li><span>01</span><div><strong>選擇一個起點</strong><p>套用下方紋理預設，或在左側挑選幾何形狀。</p></div></li><li><span>02</span><div><strong>塑造漸變與節奏</strong><p>調整間距、尺寸與密度；拖曳畫布上的藍色控制點。控制點也支援方向鍵微調。</p></div></li><li><span>03</span><div><strong>設定配色並匯出</strong><p>切換「色彩與畫布」調整顏色。匯出 SVG、PNG、JSON 或 CAD；JSON 可保存完整設計。</p></div></li></ol><div className="help-shortcuts"><span>復原 <kbd>Ctrl / ⌘ Z</kbd></span><span>重做 <kbd>Ctrl / ⌘ ⇧ Z</kbd></span></div><button className="button primary export-confirm" onClick={()=>setDialog(null)}>開始設計<ArrowRight size={15}/></button></>:<><div className="future-hero"><Sparkles size={32}/></div><p className="modal-intro">第一階段提供本機參數化設計。以下功能已預留擴充介面，目前尚未啟用。</p><div className="future-list"><div><Sparkles size={19}/><strong>AI 文字生成</strong><p>將設計概念轉譯為幾何、漸變與配色參數。</p></div><div><Expand size={19}/><strong>STEP / STP 實體匯出</strong><p>設定厚度、曲面映射與孔洞，建立可用於工程開發的實體。</p></div></div><button className="button primary export-confirm" onClick={()=>setDialog(null)}>回到工作台<ArrowRight size={15}/></button></>}
    </Modal>}
  </div>;
}

function PresetArt({preset}:{preset:string}) {
  const points=useMemo(()=>Array.from({length:90},(_,i)=>{const x=(i%18)*11+7,y=Math.floor(i/18)*11+8;const r=preset==='halo'?Math.max(.8,3.8-Math.hypot(x-100,y-30)/28):preset==='terrain'?1+Math.sin(x*.08+y*.1)**2*2.3:1+x/90;return{x,y,r};}),[preset]);
  return <svg viewBox="0 0 200 61" aria-hidden="true">{points.map((p,i)=>preset==='flow'?<rect key={i} x={p.x-3} y={p.y} width="7" height="1.8" rx=".9" transform={`rotate(-30 ${p.x} ${p.y})`} fill="currentColor"/>:preset==='terrain'?<path key={i} d={`M${p.x},${p.y-p.r}l${p.r},${p.r}l${-p.r},${p.r}l${-p.r},${-p.r}Z`} fill="currentColor"/>:<circle key={i} cx={p.x} cy={p.y} r={p.r} fill="currentColor"/>)}</svg>;
}
function Modal({title,children,close,busy}:{title:string;children:ReactNode;close:()=>void;busy:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(dialog?.showModal)dialog.showModal();},[]);
  return <dialog ref={ref} className="modal" aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)close();}} onClick={e=>{if(e.target===ref.current&&!busy)close();}}><div className="modal-inner"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="關閉對話框" disabled={busy} onClick={close}><X size={18}/></button></div>{children}</div></dialog>;
}

function MorphStages({settings,start=0,end=100}:{settings:Settings;start?:number;end?:number}) {
  const stages=useMemo(()=>{const [a,b]=morphOutlines(settings);return [0,.25,.5,.75,1].map(u=>{const t=(start+(end-start)*u)/100;return {t,points:interpolateOutline(a,b,t).map(p=>`${p.x},${p.y}`).join(' ')};});},[settings,start,end]);
  return <div className="morph-stages" data-testid="morph-stages">{stages.map((stage,index)=><div key={index}><svg viewBox="-.65 -.65 1.3 1.3" role="img" aria-label={`${shapeName(settings.shape,settings.customShapes)}至${shapeName(settings.targetShape,settings.customShapes)} ${stage.t*100}% 形態`}><polygon points={stage.points} fill="currentColor"/></svg><span>{stage.t*100}%</span></div>)}</div>;
}
