import type {Settings} from '../engine';
import {bounds} from '../custom/geometry';
import {mergedStitchContours} from './merge';
/** Preserve legacy geometry while converting operand dimensions to millimetres. */
export function millimetreStitch(s:Settings){const g=s.stitch;if(g.mergeUnits==='mm')return g;const b=bounds(mergedStitchContours(s)),x=g.width/b.width,y=g.height/b.height;return {...g,mergeUnits:'mm' as const,width:g.mergeEnabled?x:g.width,height:g.mergeEnabled?y:g.height,mergeWidth:g.mergeWidth/100*(g.mergeEnabled?x:g.width),mergeHeight:g.mergeHeight/100*(g.mergeEnabled?y:g.height),mergeOffsetX:g.mergeOffsetX/100*(g.mergeEnabled?x:g.width),mergeOffsetY:g.mergeOffsetY/100*(g.mergeEnabled?y:g.height)};}
