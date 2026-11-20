/** A zero centre pitch collapses that axis to one row/column; positive pitches retain their scale. */
export function patternGrid(width:number,height:number,spacingX:number,spacingY:number,cap:number){
 const axes=Number(spacingX>0)+Number(spacingY>0);
 if(!axes)return{x:0,y:0,limited:false};
 const estimated=(spacingX>0?width/spacingX:1)*(spacingY>0?height/spacingY:1),factor=Math.max(1,Math.pow(estimated/Math.max(1,cap),1/axes));
 const logFactor=Math.max(0,((spacingX>0?Math.log(width)-Math.log(spacingX):0)+(spacingY>0?Math.log(height)-Math.log(spacingY):0)-Math.log(Math.max(1,cap)))/axes);
 const scale=(pitch:number)=>{if(pitch===0)return 0;const result=pitch*factor;return Number.isFinite(result)&&result>0?result:Math.max(Number.MIN_VALUE,Math.min(Number.MAX_VALUE,Math.exp(Math.log(pitch)+logFactor)));};
 return{x:scale(spacingX),y:scale(spacingY),limited:factor>1};
}
