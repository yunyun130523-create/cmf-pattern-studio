import type { Point } from '../engine';
export function simplifyContour(points:Point[],epsilon:number):Point[]{
  if(points.length<3)return points;
  function rdp(p:Point[]):Point[]{
    const keep=new Uint8Array(p.length),stack:Array<[number,number]>=[[0,p.length-1]];keep[0]=keep[p.length-1]=1;
    while(stack.length){const [lo,hi]=stack.pop()!,a=p[lo],b=p[hi],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;let best=epsilon,index=-1;
      for(let i=lo+1;i<hi;i++){const t=den?Math.max(0,Math.min(1,((p[i].x-a.x)*dx+(p[i].y-a.y)*dy)/den)):0,d=Math.hypot(p[i].x-a.x-t*dx,p[i].y-a.y-t*dy);if(d>best){best=d;index=i;}}
      if(index>=0){keep[index]=1;stack.push([lo,index],[index,hi]);}
    }return p.filter((_,i)=>keep[i]);
  }
  let opposite=1;for(let i=2;i<points.length;i++)if(Math.hypot(points[i].x-points[0].x,points[i].y-points[0].y)>Math.hypot(points[opposite].x-points[0].x,points[opposite].y-points[0].y))opposite=i;
  const ring=[...rdp(points.slice(0,opposite+1)).slice(0,-1),...rdp([...points.slice(opposite),points[0]]).slice(0,-1)];
  // The arbitrary first pixel is not a geometric corner of a closed ring.
  for(let i=ring.length-1;i>=0&&ring.length>3;i--){const a=ring[(i+ring.length-1)%ring.length],p=ring[i],b=ring[(i+1)%ring.length],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;if(Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)<=epsilon)ring.splice(i,1);}
  return ring;
}
