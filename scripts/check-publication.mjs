import { readdir, readFile, lstat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const top=new Set(['.gitignore','package.json','package-lock.json','vite.config.ts','tsconfig.json','playwright.config.ts','index.html','README.md','ASSETS.md','LICENSE','THIRD_PARTY_NOTICES.txt','DEPLOYMENT.md','CUSTOM-SHAPES.md','IMAGE-HALFTONE.md','LIGHT-UI.md','SHAPE-MORPHING-FIX.md','TEST-REPORT.md','V2-STAGE1.md','SHAPE-PROPORTIONS.md','GRAIN-MATERIAL.md']);
const directories=['src','public','tests','e2e','scripts','.github'];
const extensions=new Set(['.ts','.tsx','.mjs','.js','.css','.html','.svg','.jpg','.jpeg','.png','.webp','.gif','.json','.md','.txt','.yml','.yaml']);
const binary=new Set(['.jpg','.jpeg','.png','.webp','.gif']);
export function allowed(name){return top.has(name)||directories.some(dir=>name.startsWith(dir+'/'))&&(extensions.has(path.extname(name).toLowerCase())||name==='public/.nojekyll');}
export async function publicationFiles(){const files=[];async function walk(dir){for(const entry of await readdir(path.join(root,dir),{withFileTypes:true})){const name=path.posix.join(dir,entry.name);const stat=await lstat(path.join(root,name));if(stat.isSymbolicLink())throw new Error('禁止公開符號連結：'+name);if(entry.isDirectory())await walk(name);else if(allowed(name))files.push(name);else throw new Error('未核准的公開檔案：'+name);}}for(const dir of directories)await walk(dir);for(const name of top){try{if((await lstat(path.join(root,name))).isFile())files.push(name);}catch(e){if(e.code!=='ENOENT')throw e;}}return files.sort();}
export async function inspectPublication(){const files=await publicationFiles(),issues=[],manifest=[];
 try{const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,stdio:['ignore','pipe','ignore']}).toString().split('\0').filter(Boolean);for(const f of tracked)if(!allowed(f))issues.push({file:f,reason:'檔案不在公開清單'});}catch{/* A local repository may not exist before initial publication. */}
 const patterns=[['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['github-token',/gh[pousr]_[A-Za-z0-9]{30,}/],['aws-key',/(?:AKIA|ASIA)[A-Z0-9]{16}/],['api-key',/\b(?:sk-proj-|sk_live_|sk_test_)[A-Za-z0-9_-]{20,}/],['credential-assignment',/\b(?:API_KEY|SECRET_ACCESS_KEY|ACCESS_TOKEN|CLIENT_SECRET|PASSWORD)\s*[:=]\s*["'][^"'\s]{12,}["']/i]];
 for(const f of files){const bytes=await readFile(path.join(root,f));manifest.push({path:f,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});if(!binary.has(path.extname(f).toLowerCase())){const lines=bytes.toString('utf8').split('\n');lines.forEach((line,i)=>{for(const [reason,re]of patterns)if(re.test(line))issues.push({file:f,line:i+1,reason});});}}
 return{files,manifest,issues};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){try{const result=await inspectPublication();console.log(JSON.stringify({files:result.files.length,totalBytes:result.manifest.reduce((sum,f)=>sum+f.bytes,0),issues:result.issues},null,2));if(result.issues.length)process.exitCode=1;}catch(e){console.error(e.message);process.exitCode=1;}}
