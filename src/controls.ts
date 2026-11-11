import { clamp, type Point, type Settings } from './engine';
export type ControlKey='start'|'end'|'morphStart'|'morphEnd'|'center'|'radius'|'randomness';
export function controlPositions(s:Settings):Record<ControlKey,Point>{
  const radius=s.radius*Math.min(s.width,s.height),sign=s.center.x>.5?-1:1;
  const dx=(s.irregularPoint.x-s.center.x)*s.width,dy=(s.irregularPoint.y-s.center.y)*s.height;
  const angle=Math.hypot(dx,dy)<1?Math.PI/4:Math.atan2(dy,dx),length=radius*s.randomness/100;
  return {start:s.start,end:s.end,morphStart:s.morphStart,morphEnd:s.morphEnd,center:s.center,
    radius:{x:clamp(s.center.x+sign*radius/s.width,.02,.98),y:s.center.y},
    randomness:{x:clamp(s.center.x+Math.cos(angle)*length/s.width,.02,.98),y:clamp(s.center.y+Math.sin(angle)*length/s.height,.02,.98)}};
}
export function controlPatch(s:Settings,key:ControlKey,point:Point):Partial<Settings>{
  const p={x:clamp(point.x),y:clamp(point.y)};
  const distance=Math.hypot((p.x-s.center.x)*s.width,(p.y-s.center.y)*s.height);
  if(key==='randomness')return{irregularPoint:p,randomness:clamp(distance/(s.radius*Math.min(s.width,s.height)))*100};
  if(key==='radius')return{radius:clamp(distance/Math.min(s.width,s.height),.02,20),...(s.mode==='radial'?{end:p}:{})};
  if(key==='center'){
    const dx=p.x-s.center.x,dy=p.y-s.center.y;
    return {center:p,...(s.mode==='radial'?{start:p,end:{x:clamp(s.end.x+dx),y:clamp(s.end.y+dy)}}:{})};
  }
  if(key==='start'&&s.mode==='radial')return{start:p,center:p,radius:clamp(Math.hypot((s.end.x-p.x)*s.width,(s.end.y-p.y)*s.height)/Math.min(s.width,s.height),.02,20)};
  if(key==='end'&&s.mode==='radial')return{end:p,radius:clamp(distance/Math.min(s.width,s.height),.02,20)};
  return {[key]:p};
}
