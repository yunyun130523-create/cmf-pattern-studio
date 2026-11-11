import { importDWG } from './dwg';
self.onmessage=(e:MessageEvent<{bytes:ArrayBuffer;name:string}>)=>{try{self.postMessage({shape:importDWG(e.data.bytes,e.data.name)});}catch(error){self.postMessage({error:error instanceof Error?error.message:'DWG 匯入失敗。'});}};
