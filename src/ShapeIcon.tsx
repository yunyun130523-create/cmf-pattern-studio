import type { Shape } from './engine';
export function ShapeIcon({shape,size=18}:{shape:Shape;size?:number}) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{shape==='circle'?<circle cx="12" cy="12" r="6.5" fill="currentColor"/>:shape==='triangle'?<path d="M12 4L21 20H3Z" fill="currentColor"/>:shape==='square'?<rect x="5" y="5" width="14" height="14" rx="1" fill="currentColor"/>:shape==='diamond'?<path d="M12 2L22 12L12 22L2 12Z" fill="currentColor"/>:shape==='hexagon'?<path d="M7 3H17L23 12L17 21H7L1 12Z" fill="currentColor"/>:shape==='vertical'?<rect x="8" y="2" width="8" height="20" rx="2" fill="currentColor"/>:<rect x="2" y="7" width="20" height="10" rx="3" fill="currentColor"/>}</svg>;
}
