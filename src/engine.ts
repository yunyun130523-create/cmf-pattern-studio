import { GRAIN_DEFAULTS, validateGrain, type GrainSettings } from './grain/model';
import { DEFAULT_PROPORTIONS, getProportion, neutralProportion, validateProportions, type ProportionSettings, type Endpoint } from './proportions/model';
import { proportionalContours } from './proportions/geometry';
import { HALFTONE_DEFAULTS, validateHalftone, type HalftoneSettings } from './halftone/model';
import { generateHalftone } from './halftone/engine';
import { bounds, compatibleOutlines, morphRestriction, validateCustomShape, MAX_SHAPES, type CustomShape } from './custom/geometry';
export const SHAPES = ['circle', 'triangle', 'square', 'diamond', 'hexagon', 'rectangle'] as const;
export type BuiltinShape = typeof SHAPES[number];
export type Shape = BuiltinShape | `custom:${string}`;
export const SHAPE_NAMES: Record<BuiltinShape, string> = { circle: '圓形', triangle: '三角形', square: '正方形', diamond: '菱形', hexagon: '六角形', rectangle: '長方形' };
export const MODES = ['horizontal', 'vertical', 'radial', 'irregular'] as const;
export type Mode = typeof MODES[number];
export const MODE_NAMES: Record<Mode, string> = { horizontal: '水平漸變', vertical: '垂直漸變', radial: '中心擴散', irregular: '不規則漸變' };
export type Point = { x: number; y: number };
export type MorphDirection = 'horizontal' | 'vertical' | 'custom';
export type RandomEnvelope = 'uniform' | 'directional' | 'radial';
export type DensityMode = 'uniform' | 'directional' | 'radial';
export interface Settings {
  grain: GrainSettings;
  proportions: ProportionSettings;
  halftone: HalftoneSettings; transparentBackground:boolean;
  shape: Shape; targetShape: Shape; morph: boolean; morphAmount: number;
  width: number; height: number; spacingX: number; spacingY: number;
  minSize: number; maxSize: number; density: number; rotation: number;
  aspect: number; mode: Mode; start: Point; end: Point; falloff: number;
  reverse: boolean; stagger: boolean; jitter: number; noiseScale: number;
  seed: number; foreground: string; background: string; opacity: number;
  morphDirection: MorphDirection; morphStart: Point; morphEnd: Point;
  morphRangeStart: number; morphRangeEnd: number;
  endpointSize: boolean; sizeStart: number; sizeEnd: number;
  rotationGradient: boolean; rotationStart: number; rotationEnd: number;
  randomness: number; randomRotation: number; randomSize: number; randomDensity: number;
  randomEnvelope: RandomEnvelope; center: Point; radius: number; irregularPoint: Point;
  densityMode: DensityMode; densityStart: number; densityEnd: number; densityAngle: number;
  customShapes: CustomShape[]; customScaleX: number; customScaleY: number; customAspectLock: boolean;
}
export const DEFAULTS: Settings = {
  grain: GRAIN_DEFAULTS,
  proportions: DEFAULT_PROPORTIONS,
  halftone: HALFTONE_DEFAULTS, transparentBackground:false,
  shape: 'circle', targetShape: 'triangle', morph: true, morphAmount: 100,
  width: 1200, height: 800, spacingX: 23, spacingY: 23,
  minSize: 1.2, maxSize: 12, density: 100, rotation: 0, aspect: 2.3,
  mode: 'horizontal', start: { x: .17, y: .38 }, end: { x: .82, y: .65 },
  falloff: 1, reverse: false, stagger: true, jitter: 0, noiseScale: 5,
  seed: 7421, foreground: '#29332f', background: '#f2eee4', opacity: 100,
  morphDirection: 'horizontal', morphStart: {x:.15,y:.5}, morphEnd: {x:.85,y:.5},
  morphRangeStart: 0, morphRangeEnd: 100,
  endpointSize: false, sizeStart: 12, sizeEnd: 12,
  rotationGradient: false, rotationStart: 0, rotationEnd: 0,
  randomness: 100, randomRotation: 0, randomSize: 0, randomDensity: 0,
  randomEnvelope: 'uniform', center: {x:.5,y:.5}, radius: .4, irregularPoint: {x:.7,y:.8},
  densityMode: 'uniform', densityStart: 100, densityEnd: 15, densityAngle: 0,
  customShapes: [], customScaleX: 1, customScaleY: 1, customAspectLock: true,
};
export interface Preset { id: string; name: string; en: string; material: string; settings: Partial<Settings> }
export const PRESETS: Preset[] = [
  { id: 'quiet', name: '靜謐穿孔', en: 'QUIET PERFORATION', material: '座椅皮革 · 微孔漸變', settings: { shape: 'circle', targetShape: 'triangle', mode: 'horizontal', morph: true, foreground: '#29332f', background: '#f2eee4', spacingX: 23, spacingY: 23, minSize: 1.2, maxSize: 12 } },
  { id: 'flow', name: '流動織序', en: 'FLOW WEAVE', material: '門板織物 · 線性韻律', settings: { shape: 'rectangle', targetShape: 'circle', mode: 'vertical', morph: true, rotation: -28, aspect: 3.1, foreground: '#a5b5ac', background: '#26342e', spacingX: 25, spacingY: 22, minSize: 3, maxSize: 15, start: { x: .3, y: .15 }, end: { x: .7, y: .85 } } },
  { id: 'halo', name: '光暈矩陣', en: 'HALO MATRIX', material: '揚聲器飾板 · 中心擴散', settings: { shape: 'hexagon', targetShape: 'circle', mode: 'radial', morph: false, foreground: '#303437', background: '#c5c3b9', spacingX: 21, spacingY: 19, maxSize: 14, minSize: 1.3, start: { x: .5, y: .5 }, end: { x: .94, y: .5 } } },
  { id: 'terrain', name: '地景肌理', en: 'TERRAIN GRAIN', material: '內裝飾件 · 自然有機', settings: { shape: 'diamond', targetShape: 'circle', mode: 'irregular', morph: true, jitter: 40, noiseScale: 6, foreground: '#5b4437', background: '#e1d1bd', spacingX: 20, spacingY: 20, maxSize: 12, density: 86 } },
];
export function clamp(v: number, min = 0, max = 1) { return Math.min(max, Math.max(min, v)); }
export function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x ^ seed, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x: number, y: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const u = smooth(x - ix), v = smooth(y - iy);
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  return (a * (1-u) + b*u)*(1-v) + (c*(1-u)+d*u)*v;
}
export function projectedValue(x: number, y: number, start: Point, end: Point, width: number, height: number): number {
  const dx=(end.x-start.x)*width,dy=(end.y-start.y)*height,den=dx*dx+dy*dy;
  return den<1e-9?0:clamp(((x-start.x*width)*dx+(y-start.y*height)*dy)/den);
}
export function radialDistance(x: number,y: number,s: Settings): number {
  return Math.hypot(x-s.center.x*s.width,y-s.center.y*s.height)/Math.max(1,s.radius*Math.min(s.width,s.height));
}
export function randomWeight(x: number,y: number,s: Settings): number {
  let value=1;
  if(s.randomEnvelope==='directional')value=projectedValue(x,y,s.start,s.end,s.width,s.height);
  if(s.randomEnvelope==='radial')value=clamp(radialDistance(x,y,s));
  return s.randomness/100*Math.pow(value,s.falloff);
}
export function densityProbability(x: number,y: number,s: Settings,weight=0): number {
  let t=0;
  if(s.densityMode==='radial')t=Math.pow(clamp(radialDistance(x,y,s)),s.falloff);
  if(s.densityMode==='directional'){
    const a=s.densityAngle*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a);
    t=clamp(.5+((x/s.width-.5)*dx+(y/s.height-.5)*dy)/(Math.abs(dx)+Math.abs(dy)));
  }
  let p=s.density/100;
  if(s.densityMode!=='uniform')p*= (s.densityStart+(s.densityEnd-s.densityStart)*t)/100;
  const grain=noise((x/s.width-s.irregularPoint.x)*s.noiseScale,(y/s.width-s.irregularPoint.y)*s.noiseScale,s.seed+17);
  return clamp(p*(1-s.randomDensity/100*weight*grain));
}
export function fieldValue(x: number, y: number, s: Settings): number {
  const ax = s.start.x * s.width, ay = s.start.y * s.height;
  const dx = (s.end.x - s.start.x)*s.width, dy = (s.end.y - s.start.y)*s.height;
  const length2 = Math.max(1, dx*dx+dy*dy);
  let t = ((x-ax)*dx+(y-ay)*dy)/length2;
  if (s.mode === 'radial') t = 1 - radialDistance(x,y,s);
  if (s.mode === 'irregular') {const linear=clamp(t);t=linear+(.25*linear+.75*noise(x/s.width*s.noiseScale,y/s.width*s.noiseScale,s.seed)-linear)*s.randomness/100;}
  t = Math.pow(clamp(t), s.falloff);
  return s.reverse ? 1-t : t;
}
function vertices(shape: BuiltinShape, aspect: number): Point[] | null {
  if (shape === 'circle') return null;
  if (shape === 'rectangle') return [{x:-.5,y:-.5/aspect},{x:.5,y:-.5/aspect},{x:.5,y:.5/aspect},{x:-.5,y:.5/aspect}];
  if (shape === 'square') return [{x:-.5,y:-.5},{x:.5,y:-.5},{x:.5,y:.5},{x:-.5,y:.5}];
  const n = shape === 'triangle' ? 3 : shape === 'hexagon' ? 6 : 4;
  const offset = shape === 'hexagon' ? 0 : -Math.PI/2;
  return Array.from({length:n}, (_,i) => ({x: .5*Math.cos(offset+i*2*Math.PI/n),y:.5*Math.sin(offset+i*2*Math.PI/n)}));
}
export const MORPH_VERTEX_COUNT = 96;
const TAU = Math.PI * 2;
/**
 * Every shape uses the SAME ordered rays for a given aspect ratio. Include all
 * polygon corners, then subdivide the largest angular gaps. Unlike uniform rays,
 * this retains rectangle corners at arbitrary aspect ratios and exact polygon
 * endpoints. Positive radii on ordered rays keep all intermediate paths simple.
 */
function samplingAngles(aspect: number, steps: number): number[] {
  const angles = [0];
  for (const shape of SHAPES) {
    for (const p of vertices(shape, aspect) ?? []) {
      const angle = ((Math.atan2(p.y, p.x) + Math.PI / 2) % TAU + TAU) % TAU;
      if (!angles.some(a => Math.abs(a - angle) < 1e-10 || Math.abs(Math.abs(a - angle) - TAU) < 1e-10)) angles.push(angle);
    }
  }
  angles.sort((a, b) => a - b);
  if (!Number.isInteger(steps) || steps < angles.length) throw new Error('輪廓取樣數不足以保留全部角點。');
  while (angles.length < steps) {
    let index = 0, largestGap = 0;
    for (let i = 0; i < angles.length; i++) {
      const gap = (i + 1 < angles.length ? angles[i + 1] : TAU) - angles[i];
      if (gap > largestGap + 1e-12) { largestGap = gap; index = i; }
    }
    angles.splice(index + 1, 0, angles[index] + largestGap / 2);
  }
  return angles;
}
export function outline(shape: BuiltinShape, aspect: number, steps = MORPH_VERTEX_COUNT): Point[] {
  const vs = vertices(shape, aspect);
  return samplingAngles(aspect, steps).map(angle => {
    const a = -Math.PI / 2 + angle, dx = Math.cos(a), dy = Math.sin(a);
    if (!vs) return {x:dx*.5,y:dy*.5};
    let r = Infinity;
    for (let k=0;k<vs.length;k++) {
      const p=vs[k], q=vs[(k+1)%vs.length], ex=q.x-p.x, ey=q.y-p.y;
      const cross=dx*ey-dy*ex;
      if (Math.abs(cross)<1e-9) continue;
      const t=(p.x*ey-p.y*ex)/cross, u=(p.x*dy-p.y*dx)/cross;
      if(t>=0 && u>=-1e-8 && u<=1+1e-8) r=Math.min(r,t);
    }
    return {x:dx*r,y:dy*r};
  });
}
export function isCustom(shape:Shape):shape is `custom:${string}`{return shape.startsWith('custom:');}
export function shapeName(shape:Shape,library:CustomShape[]=[]):string{return isCustom(shape)?library.find(s=>s.id===shape)?.name??'自訂圖案':SHAPE_NAMES[shape];}
export function hasShapeProportions(s:Settings,endpoint:Endpoint='start'):boolean{const shape=endpoint==='start'?s.shape:s.targetShape;return !neutralProportion(getProportion(s.proportions,shape,endpoint),shape);}
export function fastCircle(s:Settings):boolean{return s.shape==='circle'&&!s.morph&&!hasShapeProportions(s);}
export function shapeContours(shape:Shape,s:Settings,endpoint:Endpoint='start'):Point[][]{
  let contours:Point[][];
  if(!isCustom(shape))contours=[outline(shape,s.aspect)];
  else{const custom=s.customShapes.find(c=>c.id===shape);if(!custom)throw new Error('找不到自訂圖案的幾何資料，請重新載入專案。');contours=custom.contours.map(c=>c.map(p=>({x:p.x*s.customScaleX,y:p.y*s.customScaleY})));}
  const p=getProportion(s.proportions,shape,endpoint);return neutralProportion(p,shape)?contours:proportionalContours(contours,shape,s.aspect,p);
}
export function morphIssue(s:Settings):string|null{
  for(const ref of [s.shape,s.targetShape])if(isCustom(ref)){
    const shape=s.customShapes.find(c=>c.id===ref);if(!shape)return'找不到自訂圖案資料。';const reason=morphRestriction(shape);if(reason)return reason;
  }return null;
}
export function morphOutlines(s:Settings):[Point[],Point[]]{
  const reason=morphIssue(s);if(reason)throw new Error(reason);
  const from=shapeContours(s.shape,s)[0],to=shapeContours(s.targetShape,s,'end')[0];
  return isCustom(s.shape)||isCustom(s.targetShape)||hasShapeProportions(s)||hasShapeProportions(s,'end')?compatibleOutlines(from,to):[from,to];
}
export function customDimensions(s:Settings){
  const contours=shapeContours(s.shape,s),b=bounds(contours),base=s.halftone.enabled&&s.halftone.image?s.halftone.maxSize:s.endpointSize?Math.max(s.sizeStart,s.sizeEnd):s.maxSize;
  return{width:b.width*base,height:b.height*base};
}
/** True vertex interpolation: one closed contour, never shape switching or opacity blending. */
export function interpolateOutline(from: Point[], to: Point[], progress: number): Point[] {
  if (from.length !== to.length || from.length < 3 || !Number.isFinite(progress)) throw new Error('無法插值不相容的輪廓。');
  const t = clamp(progress);
  return from.map((p, i) => ({ x: (1 - t) * p.x + t * to[i].x, y: (1 - t) * p.y + t * to[i].y }));
}
/**
 * Independent directional morph field. The first and last unshifted grid-column
 * centers are exact 0/1 anchors, so visible regular grids include BOTH endpoints.
 * Size gradients, noise, density and seed never determine the shape field value.
 * morphAmount is retained in JSON for compatibility, but now controls linearity,
 * not maximum completion: even at 0, both endpoints remain complete.
 */
export function morphValue(x: number, s: Settings, spacingX = s.spacingX, y=0, spacingY=s.spacingY): number {
  const vertical=s.morphDirection==='vertical',spacing=vertical?spacingY:spacingX,extent=vertical?s.height:s.width;
  const first = spacing / 2;
  const last = first + Math.max(0, Math.ceil((extent - first) / spacing) - 1) * spacing;
  const t = s.morphDirection==='custom'?projectedValue(x,y,s.morphStart,s.morphEnd,s.width,s.height):last > first ? clamp(((vertical?y:x) - first) / (last - first)) : 0;
  const smooth = t * t * (3 - 2 * t), linearity = clamp(s.morphAmount / 100);
  const u=(1 - linearity) * smooth + linearity * t;
  return (s.morphRangeStart+(s.morphRangeEnd-s.morphRangeStart)*u)/100;
}
export interface Glyph { x: number; y: number; size: number; t: number; morphT: number; rotation: number; randomT: number; points: Point[]; contours: Point[][]; d: string }
export interface Pattern { glyphs: Glyph[]; effectiveSpacingX: number; effectiveSpacingY: number; limited: boolean; coverage: number }
const n3 = (n: number) => Number(n.toFixed(3));
export function generatePattern(s: Settings): Pattern {
  if(s.halftone.enabled&&s.halftone.image)return generateHalftone(s);
  const source=shapeContours(s.shape,s),pair=s.morph?morphOutlines(s):null;
  const pointCount=pair?pair[0].length:source.reduce((n,c)=>n+c.length,0);
  const cap=Math.max(1,Math.min(12000,Math.floor(1200000/pointCount)));
  const estimated=s.width/s.spacingX*s.height/s.spacingY;
  // Consistent safety cap shared by preview and all exports, never export a different pattern.
  const factor=Math.max(1,Math.sqrt(estimated/cap));
  const sx=s.spacingX*factor, sy=s.spacingY*factor;
  const custom=isCustom(s.shape)||(s.morph&&isCustom(s.targetShape))||hasShapeProportions(s)||(s.morph&&hasShapeProportions(s,'end'));
  const extent=custom?Math.max(...(pair?[...pair[0],...pair[1]]:source.flat()).map(p=>Math.hypot(p.x,p.y))):.72;
  const glyphs: Glyph[]=[];
  let area=0;
  for(let row=0,y=sy/2;y<s.height;row++,y+=sy) {
    const offset=s.stagger && row%2 ? sx/2 : 0;
    for(let col=0,x=sx/2+offset;x<s.width;col++,x+=sx) {
      const weight=randomWeight(x,y,s);
      if(hash(col,row,s.seed)>=densityProbability(x,y,s,weight)) continue;
      const gx=x+(hash(col,row,s.seed+1)-.5)*sx*s.jitter/100*weight;
      const gy=y+(hash(col,row,s.seed+2)-.5)*sy*s.jitter/100*weight;
      const t=fieldValue(gx,gy,s);
      const baseSize=s.endpointSize?s.sizeStart+(s.sizeEnd-s.sizeStart)*t:s.minSize+(s.maxSize-s.minSize)*t;
      const size=baseSize*(1+(hash(col,row,s.seed+3)*2-1)*s.randomSize/100*weight);
      if(size<.05 || gx-size*extent<0 || gy-size*extent<0 || gx+size*extent>s.width || gy+size*extent>s.height) continue;
      const progress=morphValue(gx,s,sx,gy,sy),m=s.morph?progress:0;
      const rotation=s.rotation+(s.rotationGradient?s.rotationStart+(s.rotationEnd-s.rotationStart)*progress:0)+(hash(col,row,s.seed+4)*2-1)*s.randomRotation*weight;
      const a=rotation*Math.PI/180,ca=Math.cos(a),sa=Math.sin(a);
      const contours=(pair?[interpolateOutline(pair[0],pair[1],m)]:source).map(c=>c.map(p=>{
        const px=p.x*size, py=p.y*size;
        return {x:n3(gx+px*ca-py*sa),y:n3(gy+px*sa+py*ca)};
      }));
      let ar=0;for(const points of contours)points.forEach((p,i)=>{const q=points[(i+1)%points.length];ar+=p.x*q.y-q.x*p.y;});area+=Math.abs(ar)/2;
      glyphs.push({x:gx,y:gy,size,t,morphT:m,rotation,randomT:weight,points:contours[0],contours,d:contours.map(points=>'M'+points.map(p=>`${p.x},${p.y}`).join('L')+'Z').join(' ')});
    }
  }
  return {glyphs,effectiveSpacingX:sx,effectiveSpacingY:sy,limited:factor>1,coverage:area/(s.width*s.height)*100};
}
export function svgDocument(s: Settings, p = generatePattern(s)): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${s.width}" height="${s.height}" viewBox="0 0 ${s.width} ${s.height}"><title>CMF Pattern Studio — Seed ${s.seed}</title>${s.transparentBackground?'':`<rect width="100%" height="100%" fill="${s.background}"/>`}<g fill="${s.foreground}" fill-rule="evenodd" opacity="${s.opacity/100}">${p.glyphs.map(g=>s.halftone.enabled&&s.halftone.image&&fastCircle(s)?`<circle cx="${g.x}" cy="${g.y}" r="${g.size/2}"/>`:`<path d="${g.d}"/>`).join('')}</g></svg>`;
}
export function projectJSON(s: Settings) { return JSON.stringify({app:'cmf-pattern-studio',version:6,settings:s},null,2); }
const V2_LIMITS: Partial<Record<keyof Settings,[number,number]>> = {morphRangeStart:[0,100],morphRangeEnd:[0,100],sizeStart:[.1,40],sizeEnd:[.1,40],rotationStart:[-180,180],rotationEnd:[-180,180],randomness:[0,100],randomRotation:[0,180],randomSize:[0,100],randomDensity:[0,100],radius:[.02,20],densityStart:[0,100],densityEnd:[0,100],densityAngle:[-180,180]};
const LIMITS: Partial<Record<keyof Settings,[number,number]>> = {width:[200,2400],height:[200,1800],spacingX:[7,80],spacingY:[7,80],minSize:[0,40],maxSize:[.1,40],density:[0,100],rotation:[-180,180],aspect:[1,5],morphAmount:[0,100],falloff:[.2,4],jitter:[0,100],noiseScale:[1,20],seed:[0,2147483647],opacity:[0,100]};
export function parseProject(text: string): Settings {
  const doc=JSON.parse(text);
  if(!doc || doc.app!=='cmf-pattern-studio' || ![1,2,3,4,5,6].includes(doc.version) || !doc.settings) throw new Error('請選擇本工作台匯出的 JSON 專案檔。');
  const raw=doc.settings, result={...DEFAULTS};
  if(doc.version===6)result.grain=validateGrain(raw.grain);
  if(doc.version>=4){result.halftone=validateHalftone(raw.halftone);if(typeof raw.transparentBackground!=='boolean')throw new Error('透明背景參數無效。');result.transparentBackground=raw.transparentBackground;}
  if(doc.version>=3){
    if(!Array.isArray(raw.customShapes)||raw.customShapes.length>MAX_SHAPES)throw new Error('自訂圖案庫格式或數量錯誤。');
    result.customShapes=raw.customShapes.map(validateCustomShape);
    if(new Set(result.customShapes.map(c=>c.id)).size!==result.customShapes.length||result.customShapes.reduce((n,c)=>n+c.contours.flat().length,0)>50000)throw new Error('自訂圖案庫重複或過大。');
    for(const k of ['customScaleX','customScaleY'] as const){if(typeof raw[k]!=='number'||!Number.isFinite(raw[k])||raw[k]<.001||raw[k]>1000)throw new Error('自訂圖案縮放參數錯誤。');result[k]=raw[k];}
    if(typeof raw.customAspectLock!=='boolean')throw new Error('等比例參數錯誤。');result.customAspectLock=raw.customAspectLock;
  }
  if(doc.version>=5)result.proportions=validateProportions(raw.proportions,[...SHAPES,...result.customShapes.map(c=>c.id)]);
  for(const key of Object.keys(LIMITS) as (keyof Settings)[]) {
    if(typeof raw[key]!=='number' || !Number.isFinite(raw[key])) throw new Error('參數格式錯誤：'+key);
    const [lo,hi]=LIMITS[key]!;
    if(raw[key]<lo||raw[key]>hi) throw new Error('參數超出範圍：'+key);
    Object.assign(result,{[key]:raw[key]});
  }
  for(const key of ['shape','targetShape'] as const) { if(!SHAPES.includes(raw[key])&&!result.customShapes.some(c=>c.id===raw[key])) throw new Error('不支援或遺失的圖案形狀。'); result[key]=raw[key]; }
  if(!MODES.includes(raw.mode)) throw new Error('不支援的漸變模式。');result.mode=raw.mode;
  for(const key of ['morph','reverse','stagger'] as const) { if(typeof raw[key]!=='boolean') throw new Error('參數格式錯誤：'+key);result[key]=raw[key]; }
  for(const key of ['foreground','background'] as const) { if(!/^#[0-9a-fA-F]{6}$/.test(raw[key])) throw new Error('色碼格式錯誤。');result[key]=raw[key]; }
  for(const key of ['start','end'] as const) {
    const p=raw[key];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1) throw new Error('控制點格式錯誤。');
    result[key]={x:p.x,y:p.y};
  }
  if(result.minSize>result.maxSize) throw new Error('最小尺寸不可大於最大尺寸。');
  if(!Number.isInteger(result.seed)||!Number.isInteger(result.width)||!Number.isInteger(result.height)) throw new Error('Seed 與畫布尺寸必須為整數。');
  for(const key of Object.keys(V2_LIMITS) as (keyof Settings)[]){
    const value=raw[key];if(doc.version===1&&value===undefined)continue;
    const [lo,hi]=V2_LIMITS[key]!;if(typeof value!=='number'||!Number.isFinite(value)||value<lo||value>hi)throw new Error('參數超出範圍：'+key);
    Object.assign(result,{[key]:value});
  }
  for(const [key,options] of [['morphDirection',['horizontal','vertical','custom']],['randomEnvelope',['uniform','directional','radial']],['densityMode',['uniform','directional','radial']]] as const){
    if(doc.version===1&&raw[key]===undefined)continue;if(!(options as readonly unknown[]).includes(raw[key]))throw new Error('不支援的模式：'+key);Object.assign(result,{[key]:raw[key]});
  }
  for(const key of ['endpointSize','rotationGradient'] as const){if(doc.version===1&&raw[key]===undefined)continue;if(typeof raw[key]!=='boolean')throw new Error('參數格式錯誤：'+key);result[key]=raw[key];}
  for(const key of ['morphStart','morphEnd','center','irregularPoint'] as const){
    const p=raw[key];if(doc.version===1&&p===undefined)continue;
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1)throw new Error('控制點格式錯誤：'+key);result[key]={x:p.x,y:p.y};
  }
  if(doc.version===1&&raw.center===undefined&&result.mode==='radial'){
    result.center={...result.start};result.radius=clamp(Math.hypot((result.end.x-result.start.x)*result.width,(result.end.y-result.start.y)*result.height)/Math.min(result.width,result.height),.02,20);
  }
  if(result.morph&&morphIssue(result))throw new Error('此專案的自訂輪廓無法安全變形，請先關閉 Morph 後再儲存。');
  return result;
}
export function presetSettings(preset: Preset): Settings {
  const result={...DEFAULTS,...preset.settings};
  if(result.mode==='radial'&&preset.settings.radius===undefined){result.center={...result.start};result.radius=clamp(Math.hypot((result.end.x-result.start.x)*result.width,(result.end.y-result.start.y)*result.height)/Math.min(result.width,result.height),.02,20);}
  return result;
}

/** Phase two adapters are local interfaces; no API calls or credentials in phase one. */
export interface TextPatternProvider { generate(prompt: string, current: Settings): Promise<Partial<Settings>> }
export interface SolidExportProvider { exportSTEP(settings: Settings, pattern: Pattern, thicknessMm: number): Promise<Blob> }
