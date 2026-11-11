import { dwgBytes } from './cad';
import type { Settings } from './engine';
self.onmessage=(event:MessageEvent<{settings:Settings;unit:'mm'|'px'}>)=>{
  try {const bytes=dwgBytes(event.data.settings,event.data.unit);const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);self.postMessage({bytes:buffer},{transfer:[buffer]});}
  catch(error){self.postMessage({error:error instanceof Error?error.message:'DWG 匯出失敗。'});}
};
