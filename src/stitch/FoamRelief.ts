import type {Settings,Point} from '../engine';
export interface FoamField {width:number;height:number;step:number;left:number;top:number;heights:Float32Array;distance:Float32Array}
const meshes=new WeakMap<Point[][],Map<string,{defs:string;body:string}>>();
const n=(v:number)=>Number(v.toFixed(2));
/** Linear-time squared Euclidean distance transform. */
function edt(input:Float64Array,n:number,out:Float64Array,v:Int32Array,z:Float64Array){let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;for(let q=1;q<n;q++){let s=((input[q]+q*q)-(input[v[k]]+v[k]*v[k]))/(2*(q-v[k]));while(s<=z[k]){k--;s=((input[q]+q*q)-(input[v[k]]+v[k]*v[k]))/(2*(q-v[k]));}v[++k]=q;z[k]=s;z[k+1]=Infinity;}k=0;for(let q=0;q<n;q++){while(z[k+1]<q)k++;out[q]=(q-v[k])**2+input[v[k]];}}
export function foamField(s:Settings,cells:Point[][]):FoamField{
 const g=s.stitch,pad=72,step=Math.max(2,Math.sqrt((s.width+pad*2)*(s.height+pad*2)/80000)),width=Math.ceil((s.width+pad*2)/step)+1,height=Math.ceil((s.height+pad*2)/step)+1,count=width*height,left=-pad,top=-pad,seed=new Uint8Array(count),index=(x:number,y:number)=>y*width+x;
 // The sheet continues past the visible canvas. Its distant edge is not a stitch.
 for(let x=0;x<width;x++){seed[x]=1;seed[(height-1)*width+x]=1;}for(let y=0;y<height;y++){seed[y*width]=1;seed[y*width+width-1]=1;}
 const mark=(a:Point,b:Point)=>{let x0=(a.x-left)/step,y0=(a.y-top)/step,x1=(b.x-left)/step,y1=(b.y-top)/step,lo=0,hi=1,dx=x1-x0,dy=y1-y0;for(const [p,q]of [[-dx,x0],[dx,width-1-x0],[-dy,y0],[dy,height-1-y0]]){if(Math.abs(p)<1e-12){if(q<0)return;continue;}const r=q/p;if(p<0)lo=Math.max(lo,r);else hi=Math.min(hi,r);if(lo>hi)return;}x1=x0+hi*dx;y1=y0+hi*dy;x0+=lo*dx;y0+=lo*dy;const steps=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*2));for(let i=0;i<=steps;i++){const x=Math.round(x0+(x1-x0)*i/steps),y=Math.round(y0+(y1-y0)*i/steps);if(x>=0&&x<width&&y>=0&&y<height)seed[index(x,y)]=1;}};
 for(const ring of cells)for(let i=0;i<ring.length;i++)mark(ring[i],ring[(i+1)%ring.length]);
 const temp=new Float64Array(count),squared=new Float64Array(count),length=Math.max(width,height),f=new Float64Array(length),d=new Float64Array(length),v=new Int32Array(length),z=new Float64Array(length+1);
 for(let y=0;y<height;y++){for(let x=0;x<width;x++)f[x]=seed[index(x,y)]?0:1e12;edt(f,width,d,v,z);for(let x=0;x<width;x++)temp[index(x,y)]=d[x];}
 for(let x=0;x<width;x++){for(let y=0;y<height;y++)f[y]=temp[index(x,y)];edt(f,height,d,v,z);for(let y=0;y<height;y++)squared[index(x,y)]=d[y];}
 const distance=new Float32Array(count),parent=new Int32Array(count),radius=new Float32Array(count);for(let i=0;i<count;i++)distance[i]=Math.sqrt(squared[i])*step;
 const offsets=[-1,1,-width,width],pairs=[[1,-1],[width,-width],[width+1,-width-1],[width-1,-width+1]];
 // Stop ascent on medial ridges, including narrow necks connecting larger regions.
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=index(x,y),h=distance[i];parent[i]=i;if(!h||x===0||y===0||x===width-1||y===height-1){radius[i]=Math.max(step,h);continue;}const ridge=pairs.some(([a,b])=>h>=distance[i+a]-.001&&h>=distance[i+b]-.001&&Math.max(h-distance[i+a],h-distance[i+b])>step*.55);if(ridge){radius[i]=h;continue;}let best=h;for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){const j=i+yy*width+xx;if(distance[j]>best+.001){best=distance[j];parent[i]=j;}}if(parent[i]===i)radius[i]=h;}
 const chain:number[]=[];for(let i=0;i<count;i++){if(radius[i])continue;chain.length=0;let p=i;while(!radius[p]){chain.push(p);p=parent[p];}for(const j of chain)radius[j]=radius[p];}
 // Diffuse local recovery radii inside each stitched compartment, keeping seams as barriers.
 let smooth=radius,next=new Float32Array(count);for(let pass=0;pass<24;pass++){for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=index(x,y);if(seed[i]||x===0||y===0||x===width-1||y===height-1){next[i]=smooth[i];continue;}let sum=smooth[i],weight=1;for(const offset of offsets){const j=i+offset;if(!seed[j]){sum+=smooth[j];weight++;}}next[i]=Math.max(distance[i],sum/weight);}const swap=smooth;smooth=next;next=swap;}
 const heights=new Float32Array(count),px=96/25.4,needle=g.double?g.rowGap*px/2:0,groove=(g.threadWidth*.5+.12)*px,power=1+Math.sqrt(g.edgeWidth)*.08;
 for(let i=0;i<count;i++){const dist=g.double?Math.abs(distance[i]-needle):distance[i],r=Math.max(step,smooth[i]-needle),t=Math.max(0,Math.min(1,(dist-groove)/Math.max(step*.5,r-groove)));heights[i]=Math.sin(t*Math.PI/2)**power;if(seed[i]&&!g.double)heights[i]=0;}
 for(let x=0;x<width;x++){heights[x]=0;heights[(height-1)*width+x]=0;}for(let y=0;y<height;y++){heights[y*width]=0;heights[y*width+width-1]=0;}
 return{width,height,step,left,top,heights,distance};
}
/** Simplify only the material height isolines; stitched geometry remains untouched. */
function simplifyLoop(points:Point[],epsilon:number):Point[]{
 if(points.length<5)return points;const open=(p:Point[])=>{const keep=new Uint8Array(p.length);keep[0]=1;keep[p.length-1]=1;const stack=[0,p.length-1];while(stack.length){const end=stack.pop()!,start=stack.pop()!,a=p[start],b=p[end],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;let best=epsilon*epsilon,index=-1;for(let i=start+1;i<end;i++){const t=den?Math.max(0,Math.min(1,((p[i].x-a.x)*dx+(p[i].y-a.y)*dy)/den)):0,d=(p[i].x-a.x-t*dx)**2+(p[i].y-a.y-t*dy)**2;if(d>best){best=d;index=i;}}if(index>=0){keep[index]=1;stack.push(start,index,index,end);}}return p.filter((_,i)=>keep[i]);};
 let opposite=1,best=0;for(let i=1;i<points.length;i++){const d=(points[i].x-points[0].x)**2+(points[i].y-points[0].y)**2;if(d>best){best=d;opposite=i;}}return [...open(points.slice(0,opposite+1)).slice(0,-1),...open([...points.slice(opposite),points[0]]).slice(0,-1)];
}
/** Vector isolines encode a whole-sheet height field; no bitmap is embedded. */
export function foamContours(field:FoamField,levels=40){const {width:w,height:h,step,left,top,heights:a}=field,horizontal=(w-1)*h,total=horizontal+w*(h-1),next0=new Int32Array(total),next1=new Int32Array(total),visited=new Uint8Array(total),active=new Int32Array(total),edges=new Int32Array(4),paths:string[]=[];
 for(let level=1;level<=levels;level++){const threshold=(level-.5)/levels;next0.fill(0);next1.fill(0);visited.fill(0);let used=0;
  const link=(p:number,q:number)=>{if(!next0[p]){active[used++]=p;next0[p]=q+1;}else next1[p]=q+1;if(!next0[q]){active[used++]=q;next0[q]=p+1;}else next1[q]=p+1;};
  const connect=(p:number,q:number)=>link(edges[p],edges[q]);
  for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){const i=y*w+x,mask=(a[i]>=threshold?1:0)|(a[i+1]>=threshold?2:0)|(a[i+w+1]>=threshold?4:0)|(a[i+w]>=threshold?8:0);if(mask===0||mask===15)continue;edges[0]=y*(w-1)+x;edges[1]=horizontal+y*w+x+1;edges[2]=(y+1)*(w-1)+x;edges[3]=horizontal+y*w+x;switch(mask){case 1:case 14:connect(3,0);break;case 2:case 13:connect(0,1);break;case 3:case 12:connect(3,1);break;case 4:case 11:connect(1,2);break;case 6:case 9:connect(0,2);break;case 7:case 8:connect(3,2);break;case 5:case 10:{const inside=(a[i]+a[i+1]+a[i+w]+a[i+w+1])/4>=threshold;if((mask===5)===inside){connect(0,1);connect(2,3);}else{connect(3,0);connect(1,2);}break;}}}
  const point=(id:number)=>{const vertical=id>=horizontal,p=vertical?id-horizontal:id,y=Math.floor(p/(vertical?w:w-1)),x=p%(vertical?w:w-1),i=y*w+x,j=i+(vertical?w:1),t=(threshold-a[i])/(a[j]-a[i]);return{x:left+(x+(vertical?0:t))*step,y:top+(y+(vertical?t:0))*step};};
  const rings:string[]=[];for(let k=0;k<used;k++){const start=active[k];if(visited[start])continue;let p=start,previous=-1;const points:Point[]=[];while(!visited[p]){visited[p]=1;points.push(point(p));const first=next0[p]-1,q=first===previous?next1[p]-1:first;if(q<0)break;previous=p;p=q;}if(p===start&&points.length>=3){const simple=simplifyLoop(points,Math.max(.8,step*.27));if(simple.length>=3)rings.push('M'+simple.map(p=>`${n(p.x)},${n(p.y)}`).join('L')+'Z');}}
  if(rings.length)paths.push(`<path d="${rings.join('')}" fill="white" fill-rule="evenodd" opacity="${1/(levels-level+1)}"/>`);
 }
 return paths.join('');
}
export function foamRelief(s:Settings,cells:Point[][]){const g=s.stitch;if(g.puff<=0)return null;const key=[s.width,s.height,g.double,g.rowGap,g.threadWidth,g.edgeWidth].join('|');let entries=meshes.get(cells),mesh=entries?.get(key);let step=0;
 if(!mesh){const field=foamField(s,cells);step=field.step;mesh={defs:'',body:foamContours(field)};if(!entries){entries=new Map();meshes.set(cells,entries);}if(entries.size>=3)entries.clear();entries.set(key,mesh);}else step=Math.max(2,Math.sqrt((s.width+144)*(s.height+144)/80000));
 const scale=96/25.4*(1.8+Math.sqrt(g.edgeWidth)*.5)*g.puff/100,blur=Math.max(1.4,step*.65),defs=`<filter id="stitch-foam-relief" filterUnits="userSpaceOnUse" x="-72" y="-72" width="${s.width+144}" height="${s.height+144}" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="${n(blur)}" result="foam-height"/><feFlood flood-color="${g.leather}" result="leather"/><feDiffuseLighting in="foam-height" surfaceScale="${n(scale)}" diffuseConstant=".8" lighting-color="white" result="light"><feDistantLight azimuth="${g.lightAngle}" elevation="55"/></feDiffuseLighting><feComposite in="light" in2="leather" operator="arithmetic" k1="1" k2="0" k3=".36" k4="0" result="lit"/><feSpecularLighting in="foam-height" surfaceScale="${n(scale)}" specularConstant=".025" specularExponent="12" lighting-color="white" result="glint"><feDistantLight azimuth="${g.lightAngle}" elevation="55"/></feSpecularLighting><feBlend in="lit" in2="glint" mode="screen"/></filter>`;
 return{defs,body:`<g data-foam-relief="true" data-foam-coverage="whole-sheet" filter="url(#stitch-foam-relief)">${mesh.body}</g>`};
}
