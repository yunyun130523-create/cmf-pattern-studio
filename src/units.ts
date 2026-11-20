/** Physical lengths use the established 96 dpi coordinate system in saved projects. */
export const PX_PER_MM=96/25.4;
export const toMm=(px:number)=>px/PX_PER_MM;
export const toPx=(mm:number)=>Number((mm*PX_PER_MM).toPrecision(15));
export const mmText=(px:number)=>{const mm=toMm(px);return Number(mm!==0&&Math.abs(mm)<.01?mm.toPrecision(6):mm.toFixed(2));};
