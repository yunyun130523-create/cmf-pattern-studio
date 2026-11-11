import svgpath from 'svgpath';
import { filledGeometry, makeCustomShape, mergeGeometry, type CustomShape } from './geometry';
import type { Point } from '../engine';
type Matrix=[number,number,number,number,number,number];
const I:Matrix=[1,0,0,1,0,0];
export function multiply(a:Matrix,b:Matrix):Matrix{return[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export function transformMatrix(text:string):Matrix{
  let result=I;const chunks=Array.from(text.matchAll(/([a-zA-Z]+)\s*\(([^)]*)\)/g));
  if(text.replace(/([a-zA-Z]+)\s*\(([^)]*)\)/g,'').trim())throw new Error('SVG Transform 格式不支援。');
  for(const [,name,args] of chunks){const n=args.trim().split(/[\s,]+/).filter(Boolean).map(Number);if(n.some(v=>!Number.isFinite(v)))throw new Error('SVG Transform 包含無效數值。');let m:Matrix;
    if(name==='matrix'&&n.length===6)m=n as Matrix;
    else if(name==='translate'&&(n.length===1||n.length===2))m=[1,0,0,1,n[0],n[1]??0];
    else if(name==='scale'&&(n.length===1||n.length===2))m=[n[0],0,0,n[1]??n[0],0,0];
    else if(name==='rotate'&&(n.length===1||n.length===3)){const a=n[0]*Math.PI/180,c=Math.cos(a),s=Math.sin(a),x=n[1]??0,y=n[2]??0;m=multiply(multiply([1,0,0,1,x,y],[c,s,-s,c,0,0]),[1,0,0,1,-x,-y]);}
    else if(name==='skewX'&&n.length===1)m=[1,0,Math.tan(n[0]*Math.PI/180),1,0,0];
    else if(name==='skewY'&&n.length===1)m=[1,Math.tan(n[0]*Math.PI/180),0,1,0,0];
    else throw new Error('不支援的 SVG Transform：'+name);
    result=multiply(result,m);
  }if(result.some(v=>!Number.isFinite(v)||Math.abs(v)>1e9))throw new Error('SVG Transform 範圍過大。');return result;
}
function length(value:string|null,fallback=0):number{
  if(!value)return fallback;const m=value.trim().match(/^([-+\d.eE]+)(px|mm|cm|in|pt|pc)?$/);if(!m)throw new Error('請將百分比或相對 SVG 尺寸轉成數值座標。');
  const factor:Record<string,number>={px:1,mm:96/25.4,cm:96/2.54,in:96,pt:96/72,pc:16};const n=Number(m[1])*(factor[m[2]??'px']);if(!Number.isFinite(n))throw new Error('SVG 尺寸無效。');return n;
}
function viewport(el:Element):Matrix{
  const raw=el.getAttribute('viewBox');if(!raw)return I;
  const b=raw.trim().split(/[\s,]+/).map(Number);if(b.length!==4||b.some(n=>!Number.isFinite(n))||b[2]<=0||b[3]<=0)throw new Error('SVG viewBox 無效。');
  const w=length(el.getAttribute('width'),b[2]),h=length(el.getAttribute('height'),b[3]);if(w<=0||h<=0)throw new Error('SVG 畫布尺寸無效。');
  const aspect=el.getAttribute('preserveAspectRatio')??'xMidYMid meet';let sx=w/b[2],sy=h/b[3],ox=0,oy=0;
  if(!aspect.includes('none')){const scale=aspect.includes('slice')?Math.max(sx,sy):Math.min(sx,sy);sx=sy=scale;ox=(w-b[2]*scale)*(aspect.includes('xMin')?0:aspect.includes('xMax')?1:.5);oy=(h-b[3]*scale)*(aspect.includes('YMin')?0:aspect.includes('YMax')?1:.5);}
  return[sx,0,0,sy,ox-b[0]*sx,oy-b[1]*sy];
}
const mid=(a:Point,b:Point):Point=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
function flattenCubic(a:Point,b:Point,c:Point,d:Point,out:Point[],tol:number,depth=0){
  const chord=Math.hypot(d.x-a.x,d.y-a.y),net=Math.hypot(b.x-a.x,b.y-a.y)+Math.hypot(c.x-b.x,c.y-b.y)+Math.hypot(d.x-c.x,d.y-c.y);
  if(depth>=12||net-chord<tol){out.push(d);return;}
  const ab=mid(a,b),bc=mid(b,c),cd=mid(c,d),abc=mid(ab,bc),bcd=mid(bc,cd),center=mid(abc,bcd);
  flattenCubic(a,ab,abc,center,out,tol,depth+1);flattenCubic(center,bcd,cd,d,out,tol,depth+1);
}
export function pathContours(data:string,matrix:Matrix=I,tolerance=.05):Point[][]{
  if(data.length>150000)throw new Error('SVG 路徑太複雜，請先簡化。');
  const path=svgpath(data);if((path as unknown as {err:string}).err)throw new Error('SVG Path 語法錯誤。');
  const result:Point[][]=[];let ring:Point[]=[],last:Point={x:0,y:0},start:Point={x:0,y:0};
  const finish=()=>{if(ring.length){if(Math.hypot(last.x-start.x,last.y-start.y)>1e-7)throw new Error('圖案含開放路徑，請先封閉或將描邊轉為外框。');if(ring.length>=3)result.push(ring);ring=[];}};
  path.abs().unshort().unarc().matrix(matrix).iterate(seg=>{
    const cmd=seg[0],v=seg.slice(1) as number[];
    if(cmd==='M'){finish();last={x:v[0],y:v[1]};start=last;ring=[last];}
    else if(cmd==='L'){last={x:v[0],y:v[1]};ring.push(last);}
    else if(cmd==='H'){last={x:v[0],y:last.y};ring.push(last);}
    else if(cmd==='V'){last={x:last.x,y:v[0]};ring.push(last);}
    else if(cmd==='C'){const end={x:v[4],y:v[5]};flattenCubic(last,{x:v[0],y:v[1]},{x:v[2],y:v[3]},end,ring,tolerance);last=end;}
    else if(cmd==='Q'){const q={x:v[0],y:v[1]},end={x:v[2],y:v[3]};flattenCubic(last,{x:last.x+2/3*(q.x-last.x),y:last.y+2/3*(q.y-last.y)},{x:end.x+2/3*(q.x-end.x),y:end.y+2/3*(q.y-end.y)},end,ring,tolerance);last=end;}
    else if(cmd.toUpperCase()==='Z'){last=start;finish();}
    else throw new Error('SVG 路徑包含不支援的指令。');
    if(ring.length+result.reduce((n,r)=>n+r.length,0)>10000)throw new Error('輪廓節點過多，請先簡化圖案。');
  });finish();return result;
}
export function importSVG(text:string,name='自訂 SVG'):CustomShape{
  if(text.length>2_000_000||/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('SVG 太大或包含不允許的 XML 宣告。');
  const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw new Error('不是有效的 SVG 檔案。');
  if(doc.querySelectorAll('*').length>3000)throw new Error('SVG 元素過多，請先簡化。');
  const items:ReturnType<typeof filledGeometry>[]=[],warnings=new Set<string>();
  function walk(el:Element,parent:Matrix,style:{fill:string;rule:'evenodd'|'nonzero';opacity:number},depth:number){
    if(depth>64)throw new Error('SVG 巢狀結構過深。');const tag=el.localName.toLowerCase();
    if(['script','foreignobject','image','use','iframe','style','animate','animatetransform','set'].includes(tag)){warnings.add('已移除 Script、外部資源、圖片或不支援的參照元素。');return;}
    if(['defs','metadata','title','desc','clippath','mask','symbol'].includes(tag))return;
    const css=Object.fromEntries((el.getAttribute('style')??'').split(';').map(x=>x.split(':').map(v=>v.trim())).filter(a=>a.length===2));
    if(css.display==='none'||el.getAttribute('display')==='none'||css.visibility==='hidden'||el.getAttribute('visibility')==='hidden')return;
    if(el.hasAttribute('clip-path')||el.hasAttribute('mask')||css['clip-path']||css.mask)throw new Error('請先將 SVG 裁切遮罩轉成實際封閉路徑，再匯入。');
    if(css.transform)throw new Error('請將 CSS Transform 轉成 SVG transform 屬性後匯入。');
    const fill=css.fill??el.getAttribute('fill')??style.fill,rule=(css['fill-rule']??el.getAttribute('fill-rule')??style.rule)==='evenodd'?'evenodd':'nonzero';
    const opacity=style.opacity*Number(css.opacity??el.getAttribute('opacity')??1)*Number(css['fill-opacity']??el.getAttribute('fill-opacity')??1);if(!Number.isFinite(opacity))throw new Error('SVG 透明度數值錯誤。');if(opacity<=0)return;
    let m=multiply(parent,transformMatrix(el.getAttribute('transform')??''));
    if(tag==='svg'){if(depth>0&&(el.hasAttribute('viewBox')||el.hasAttribute('x')||el.hasAttribute('y')))throw new Error('請將巢狀 SVG 展開成群組後匯入，以保留裁切與座標。');m=multiply(m,viewport(el));}
    if(tag==='svg'||tag==='g'||tag==='a'){for(const child of Array.from(el.children))walk(child,m,{fill,rule,opacity},depth+1);return;}
    if(fill==='none'){warnings.add('未填色的描邊不會匯入，請先將描邊轉外框。');return;}
    const n=(key:string,fallback=0)=>length(el.getAttribute(key),fallback);let data='';
    if(tag==='path')data=el.getAttribute('d')??'';
    else if(tag==='polygon'||tag==='polyline'){
      const p=(el.getAttribute('points')??'').trim().split(/[\s,]+/).filter(Boolean).map(Number);if(p.length<6||p.length%2||p.some(v=>!Number.isFinite(v)))throw new Error('SVG 多邊形座標無效。');
      if(tag==='polyline'&&(p[0]!==p.at(-2)||p[1]!==p.at(-1)))throw new Error('Polyline 尚未封閉。');data='M'+p.slice(0,2).join(' ')+'L'+p.slice(2).join(' ')+'Z';
    }else if(tag==='circle'||tag==='ellipse'){
      const cx=n('cx'),cy=n('cy'),rx=n(tag==='circle'?'r':'rx'),ry=n(tag==='circle'?'r':'ry');if(rx<=0||ry<=0)return;
      data=`M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`;
    }else if(tag==='rect'){
      const x=n('x'),y=n('y'),w=n('width'),h=n('height');if(w<=0||h<=0)return;
      const rx=Math.min(w/2,n('rx',n('ry'))),ry=Math.min(h/2,n('ry',n('rx')));if(rx<0||ry<0)throw new Error('SVG 圓角半徑無效。');
      data=rx&&ry?`M${x+rx} ${y}H${x+w-rx}A${rx} ${ry} 0 0 1 ${x+w} ${y+ry}V${y+h-ry}A${rx} ${ry} 0 0 1 ${x+w-rx} ${y+h}H${x+rx}A${rx} ${ry} 0 0 1 ${x} ${y+h-ry}V${y+ry}A${rx} ${ry} 0 0 1 ${x+rx} ${y}Z`:`M${x} ${y}H${x+w}V${y+h}H${x}Z`;
    }else{warnings.add('略過不支援的 SVG 元素：'+tag);return;}
    if(data.trim())items.push(filledGeometry(pathContours(data,m),rule));
  }
  walk(doc.documentElement,I,{fill:'black',rule:'nonzero',opacity:1},0);
  return makeCustomShape(mergeGeometry(items),{name,source:'SVG',warnings:[...warnings]});
}
