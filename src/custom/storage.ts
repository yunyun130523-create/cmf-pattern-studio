import { MAX_SHAPES, validateCustomShape, type CustomShape } from './geometry';
const DB='cmf-pattern-custom-shapes',STORE='shapes',BACKUP='cmf-custom-library-backup';
let writes:Promise<void>=Promise.resolve();
function openDB():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB 不可用'));return;}
  const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>{request.result.createObjectStore(STORE,{keyPath:'id'});};
  request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};request.onerror=()=>reject(new Error('本機資料庫無法開啟。'));request.onblocked=()=>reject(new Error('本機資料庫被其他分頁占用。'));
});}
function validateLibrary(shapes:unknown):CustomShape[]{if(!Array.isArray(shapes)||shapes.length>MAX_SHAPES)throw new Error('圖案庫數量超過限制。');const result=shapes.map(validateCustomShape);if(new Set(result.map(s=>s.id)).size!==result.length||result.reduce((n,s)=>n+s.contours.flat().length,0)>50000)throw new Error('圖案庫重複或過大。');return result;}
export function mergeLibraries(a:CustomShape[],b:CustomShape[]):CustomShape[]{
  const map=new Map(a.map(s=>[s.id,s]));for(const shape of b){const old=map.get(shape.id);if(!old||shape.updatedAt>=old.updatedAt)map.set(shape.id,shape);}
  return validateLibrary([...map.values()]);
}
export async function readLibrary():Promise<{shapes:CustomShape[];backend:'IndexedDB'|'瀏覽器儲存'}>{
  try{const db=await openDB();try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();request.onsuccess=()=>{try{resolve({shapes:validateLibrary(request.result),backend:'IndexedDB'});}catch(e){reject(e);}};request.onerror=()=>reject(new Error('無法讀取圖案庫。'));});}finally{db.close();}}
  catch{const text=localStorage.getItem(BACKUP);return{shapes:text?validateLibrary(JSON.parse(text)):[],backend:'瀏覽器儲存'};}
}
export function saveLibrary(input:CustomShape[]):Promise<void>{
  const shapes=validateLibrary(input);
  writes=writes.catch(()=>{}).then(async()=>{
    let persisted=false;
    try{const db=await openDB();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);store.clear();shapes.forEach(s=>store.put(s));tx.oncomplete=()=>resolve();tx.onerror=()=>reject(new Error('圖案庫儲存失敗。'));tx.onabort=()=>reject(new Error('圖案庫儲存中止。'));});persisted=true;}finally{db.close();}}catch{/* Same-application local backup is used when IndexedDB is restricted. */}
    try{localStorage.setItem(BACKUP,JSON.stringify(shapes));persisted=true;}catch{/* IndexedDB may still have saved the library. */}
    if(!persisted)throw new Error('本機儲存空間不足，請匯出 JSON 備份圖案庫。');
  });return writes;
}
