import { writeFile, mkdir } from 'node:fs/promises';
import { DEFAULTS, outline, interpolateOutline, projectJSON, svgDocument } from '../src/engine.ts';
await mkdir(new URL('../work/',import.meta.url),{recursive:true});
const from=outline('hexagon',2.3),to=outline('triangle',2.3);
const stages=[0,.25,.5,.75,1].map((t,i)=>{
  const cx=100+i*180,cy=166;
  const points=interpolateOutline(from,to,t).map(p=>`${(cx+p.x*116).toFixed(5)},${(cy+p.y*116).toFixed(5)}`).join(' ');
  return `<polygon points="${points}" fill="#29332f"/><text x="${cx}" y="263" text-anchor="middle" fill="#29332f" font-size="20">${t*100}%</text>`;
}).join('');
const proof=`<svg xmlns="http://www.w3.org/2000/svg" width="920" height="360" viewBox="0 0 920 360"><rect width="920" height="360" rx="12" fill="#f2eee4"/><g font-family="Arial,sans-serif"><text x="40" y="47" fill="#29332f" font-size="21" font-weight="600">HEXAGON → TRIANGLE</text><text x="40" y="72" fill="#6c8173" font-size="11" letter-spacing="1.5">SHAPE MORPHING / 96 CORRESPONDING VERTICES</text>${stages}<path d="M70 302H850" stroke="#8ab39a" stroke-width="1.5"/><text x="460" y="331" text-anchor="middle" fill="#6c8173" font-size="11">P(t) = (1 − t) A + t B · ONE CLOSED CONTOUR AT EVERY STAGE</text></g></svg>`;
await writeFile(new URL('../work/Shape-Morphing-Verification.svg',import.meta.url),proof);
const demo={...DEFAULTS,shape:'hexagon',targetShape:'triangle',morph:true,morphAmount:100,minSize:18,maxSize:18,spacingX:32,spacingY:32,stagger:false,jitter:0};
await writeFile(new URL('../work/hexagon-to-triangle.json',import.meta.url),projectJSON(demo));
await writeFile(new URL('../work/hexagon-to-triangle.svg',import.meta.url),svgDocument(demo));
console.log('Morph verification SVG, demo project and exported pattern created.');
