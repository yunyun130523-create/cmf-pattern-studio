import { test, expect, type Page, type Download } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

async function downloaded(download:Download){expect(await download.failure()).toBeNull();const path=await download.path();if(!path)throw new Error('瀏覽器未提供下載檔案');return readFile(path);}
async function range(page:Page,name:string,value:number){await page.getByRole('slider',{name,exact:true}).evaluate((el,next)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(el,String(next));el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},value);}
async function ready(page:Page){await expect(page.locator('.image-processing')).toHaveText('Canvas 點陣預覽 · 向量幾何',{timeout:45000});await expect(page.getByTestId('halftone-canvas')).toBeVisible();}
async function exportFile(page:Page,format:'SVG'|'PNG'|'JSON'){
 if(format==='JSON'){await page.getByRole('button',{name:'更多匯出格式',exact:true}).click();}else await page.getByRole('button',{name:'匯出 '+format,exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'匯出設計'});if(format==='JSON')await dialog.getByRole('button',{name:'JSON',exact:true}).click();
 const [download]=await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'下載 '+format,exact:true}).click()]);return downloaded(download);
}
test.beforeEach(async({page})=>{page.on('pageerror',error=>console.log('Browser page error:',error.message));await page.goto('./');await expect(page.getByTestId('pattern-canvas')).toBeVisible();});

test('桌面／手機載入、幾何生成與原生滑桿操作',async({page})=>{
 await expect.poll(()=>page.getByTestId('pattern-glyphs').locator('path').count()).toBeGreaterThan(1000);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2)).toBe(true);
 await page.getByRole('button',{name:'六角形',exact:true}).click();await expect(page.getByRole('button',{name:'六角形',exact:true})).toHaveAttribute('aria-pressed','true');
 const first=await page.getByTestId('pattern-glyphs').locator('path').first().getAttribute('d');const slider=page.getByRole('slider',{name:'水平間距',exact:true});const old=Number(await slider.inputValue());await slider.focus();await slider.press('ArrowRight');await expect(slider).toHaveValue(String(old+.5));await expect.poll(()=>page.getByTestId('pattern-glyphs').locator('path').first().getAttribute('d')).not.toBe(first);
 const svg=(await exportFile(page,'SVG')).toString('utf8');expect(svg).toContain('<svg');expect(svg).toContain('<path');expect(svg).not.toContain('<image');
});

test('真正 JPG 上傳、Worker／Canvas、尺寸／密度／對比、SVG 與 JSON 還原',async({page})=>{
 await page.getByRole('button',{name:'圖片轉點陣',exact:true}).click();await page.getByLabel('點陣來源圖片檔案').setInputFiles('src/halftone/mountain.jpg');await ready(page);
 await expect.poll(()=>page.getByTestId('halftone-canvas').evaluate((node:HTMLCanvasElement)=>{const ctx=node.getContext('2d')!,rgba=ctx.getImageData(0,0,node.width,node.height).data;let dark=0;for(let i=0;i<rgba.length;i+=64)if(rgba[i]<100&&rgba[i+3]>0)dark++;return dark;}),{timeout:10000,message:'等待 Canvas 完成實際像素繪製'}).toBeGreaterThan(100);
 await range(page,'最大點尺寸',4);await range(page,'點陣密度',80);await range(page,'圖片對比',1.65);await page.getByLabel('圖片轉換模式',{exact:true}).selectOption('sparse');await page.getByLabel('點陣形狀',{exact:true}).selectOption('triangle');await ready(page);
 const svg=(await exportFile(page,'SVG')).toString('utf8');expect((svg.match(/<path\b/g)??[]).length).toBeGreaterThan(1000);expect(svg).not.toMatch(/<image\b|data:image|<filter\b/);
 const json=await exportFile(page,'JSON');const project=JSON.parse(json.toString('utf8'));expect(project.settings.halftone.image.format).toBe('JPEG');expect(project.settings.halftone.image.pixels.length).toBeGreaterThan(1000);expect(project.settings.shape).toBe('triangle');
 await range(page,'圖片對比',.7);await page.getByLabel('選擇 JSON 專案檔').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:json});await expect(page.getByRole('slider',{name:'圖片對比',exact:true})).toHaveValue('1.65');await expect(page.getByLabel('點陣形狀',{exact:true})).toHaveValue('triangle');await ready(page);
});

test('真正透明 PNG 上傳與高解析度透明 PNG 下載',async({page})=>{
 const image=new PNG({width:32,height:32});for(let y=0;y<32;y++)for(let x=0;x<32;x++){const ink=(x-16)**2+(y-16)**2<100;image.data.set([0,0,0,ink?255:0],(y*32+x)*4);}
 await page.getByRole('button',{name:'圖片轉點陣',exact:true}).click();await page.getByLabel('點陣來源圖片檔案').setInputFiles({name:'transparent-logo.png',mimeType:'image/png',buffer:PNG.sync.write(image)});await ready(page);await page.getByRole('checkbox',{name:'透明背景',exact:true}).check();await ready(page);
 const png=PNG.sync.read(await exportFile(page,'PNG'));expect(png.width).toBe(2400);expect(png.height).toBe(1600);let transparent=0,ink=0;for(let i=0;i<png.data.length;i+=64){if(png.data[i+3]===0)transparent++;if(png.data[i+3]>0&&png.data[i]<100)ink++;}expect(transparent).toBeGreaterThan(100);expect(ink).toBeGreaterThan(100);
});

test('圖形比例、圓角、獨立 Morph 端點與 SVG／PNG／JSON 保留',async({page})=>{
 await page.getByRole('switch',{name:'啟用形狀漸變',exact:true}).click();await page.getByRole('button',{name:'正方形',exact:true}).click();await page.getByRole('switch',{name:'起始比例鎖定',exact:true}).click();await range(page,'起始X 比例',200);await range(page,'起始Y 比例',50);await range(page,'起始圖形旋轉',90);await range(page,'起始圓角半徑',30);
 const svg=(await exportFile(page,'SVG')).toString('utf8');expect(svg).toContain('<path');expect(svg).not.toContain('<image');
 const png=PNG.sync.read(await exportFile(page,'PNG'));expect(png.width).toBe(2400);expect(png.height).toBe(1600);
 await page.getByRole('switch',{name:'啟用形狀漸變',exact:true}).click();await page.getByRole('switch',{name:'結束比例鎖定',exact:true}).click();await range(page,'結束X 比例',40);await range(page,'結束Y 比例',260);await range(page,'結束頂點水平位置',65);
 const json=await exportFile(page,'JSON'),doc=JSON.parse(json.toString('utf8'));expect(doc.version).toBe(6);expect(doc.settings.proportions.start.square).toMatchObject({x:200,y:50,rotation:90,corner:30,locked:false});expect(doc.settings.proportions.end.triangle).toMatchObject({x:40,y:260,apexX:65});
 await range(page,'起始X 比例',150);await page.getByLabel('選擇 JSON 專案檔').setInputFiles({name:'proportions.json',mimeType:'application/json',buffer:json});await expect(page.getByRole('slider',{name:'起始X 比例',exact:true})).toHaveValue('200');await expect(page.getByRole('slider',{name:'結束Y 比例',exact:true})).toHaveValue('260');
});

test('咬花材質、目前 Pattern、貼圖下載與完整 JSON 還原',async({page})=>{
 await page.getByRole('button',{name:'咬花材質',exact:true}).click();await page.getByRole('button',{name:'細皮紋',exact:true}).click();await expect(page.locator('.grain-processing')).toHaveText('咬花材質預覽已更新',{timeout:45000});
 await expect.poll(()=>page.getByTestId('grain-canvas').evaluate((canvas:HTMLCanvasElement)=>{const p=canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height).data;let min=255,max=0;for(let i=0;i<p.length;i+=32){min=Math.min(min,p[i]);max=Math.max(max,p[i]);}return max-min;})).toBeGreaterThan(10);
 await range(page,'咬花大小',4);await range(page,'咬花深度',.2);await range(page,'光澤度',60);await page.getByRole('button',{name:'帶入目前 Pattern',exact:true}).click();await page.getByLabel('咬花呈現方式',{exact:true}).selectOption('deboss');await range(page,'Pattern 凹凸深度',.35);await page.getByLabel('Pattern 區域紋理',{exact:true}).selectOption('brushed');await range(page,'Pattern 紋理大小',3);await range(page,'Pattern 紋理深度',.1);await range(page,'Pattern 紋理光澤',80);await page.getByLabel('Pattern 髮絲方向',{exact:true}).selectOption('0');await page.getByLabel('咬花輸出尺寸').selectOption('512');await page.getByLabel('咬花 PNG DPI').selectOption('300');
 for(const name of ['高度圖','法線圖','粗糙度圖']){const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'下載'+name+' PNG',exact:true}).click()]);const bytes=await downloaded(download),png=PNG.sync.read(bytes);expect(png.width).toBe(512);expect(png.height).toBe(341);expect(bytes.toString('latin1')).toContain('pHYs');if(name==='高度圖')expect(bytes.toString('latin1')).toContain('HeightRangeMm');if(name==='法線圖'){let blue=0;for(let i=0;i<png.data.length;i+=64)if(png.data[i+2]>180)blue++;expect(blue).toBeGreaterThan(100);}}
 const json=await exportFile(page,'JSON'),doc=JSON.parse(json.toString('utf8'));expect(doc.version).toBe(6);expect(doc.settings.grain).toMatchObject({enabled:true,type:'leather',size:4,depth:.2,gloss:60,patternMode:'deboss',patternDepth:.35,patternTexture:'brushed',patternSize:3,patternTextureDepth:.1,patternTextureGloss:80,patternBrushDirection:0,dpi:300});await range(page,'光澤度',5);await page.getByLabel('選擇 JSON 專案檔').setInputFiles({name:'material.json',mimeType:'application/json',buffer:json});await expect(page.getByRole('slider',{name:'光澤度',exact:true})).toHaveValue('60');await expect(page.getByLabel('咬花呈現方式',{exact:true})).toHaveValue('deboss');await expect(page.getByLabel('Pattern 區域紋理',{exact:true})).toHaveValue('brushed');await expect(page.getByRole('slider',{name:'Pattern 紋理大小',exact:true})).toHaveValue('3');
});

test('不規則範圍 PNG／SVG 上傳、輪廓漸變、向量輸出與 JSON 還原',async({page})=>{
 await expect(page.locator('.sidebar-tabs button').first()).toHaveText('色彩與畫布');await page.getByRole('button',{name:'色彩與畫布',exact:true}).click();const original=await page.getByTestId('pattern-glyphs').locator('path').count();
 const png=new PNG({width:64,height:64});for(let y=5;y<59;y++)for(let x=5;x<59;x++)if(x<30||y<30)png.data.set([0,0,0,255],(y*64+x)*4);
 await page.getByLabel('漸變範圍檔案').setInputFiles({name:'L-range.png',mimeType:'image/png',buffer:PNG.sync.write(png)});await expect(page.getByText('L-range.png',{exact:true})).toBeVisible();await expect(page.getByRole('checkbox',{name:'啟用範圍限制'})).toBeChecked();await expect.poll(()=>page.getByTestId('pattern-glyphs').locator('path').count()).toBeLessThan(original);expect(await page.getByTestId('pattern-glyphs').locator('path').count()).toBeGreaterThan(20);
 const before=await page.getByTestId('pattern-glyphs').innerHTML();await range(page,'輪廓漸變寬度',30);await expect.poll(()=>page.getByTestId('pattern-glyphs').innerHTML()).not.toBe(before);const saved=await page.getByTestId('pattern-glyphs').innerHTML();
 const svg=(await exportFile(page,'SVG')).toString('utf8');expect(svg).toContain('<path');expect(svg).not.toContain('<image');const json=await exportFile(page,'JSON');expect(JSON.parse(json.toString()).settings.rangeMask).toMatchObject({enabled:true,feather:30,image:{name:'L-range.png'}});
 await page.getByRole('button',{name:'移除漸變範圍'}).click();await page.getByLabel('選擇 JSON 專案檔').setInputFiles({name:'mask.json',mimeType:'application/json',buffer:json});await expect(page.getByRole('slider',{name:'輪廓漸變寬度',exact:true})).toHaveValue('30');await expect.poll(()=>page.getByTestId('pattern-glyphs').innerHTML()).toBe(saved);
 await page.getByLabel('漸變範圍檔案').setInputFiles({name:'triangle.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg viewBox="0 0 100 100"><polygon points="50,0 100,100 0,100"/></svg>')});await expect(page.getByText('triangle.svg',{exact:true})).toBeVisible();await expect.poll(()=>page.getByTestId('pattern-glyphs').locator('path').count()).toBeGreaterThan(20);
});
