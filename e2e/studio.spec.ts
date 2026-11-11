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
