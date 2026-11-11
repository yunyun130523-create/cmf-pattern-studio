// @vitest-environment node
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';
describe('standalone production artifact',()=>{
  it('boots the actual bundled HTML without external JavaScript or CSS',async()=>{
    const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
    const errors:unknown[]=[];const console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));
    const dom=new JSDOM(html,{url:'https://cmf.test/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:console});
    try {
      expect(dom.window.document.querySelectorAll('script[src],link[rel=stylesheet]')).toHaveLength(0);
      const script=dom.window.document.querySelector('script[type=module]')!.textContent!;
      expect(script).not.toMatch(/\bimport\s*\(/);expect(script).not.toContain('import.meta');
      dom.window.eval(script);await new Promise(resolve=>setTimeout(resolve,150));
      expect(dom.window.document.querySelector('[data-testid=pattern-canvas]')).toBeTruthy();
      expect(dom.window.document.querySelectorAll('[data-testid=pattern-glyphs] path').length).toBeGreaterThan(1000);
      const shape=dom.window.document.querySelector('[aria-label="六角形"]') as HTMLButtonElement;
      shape.click();await new Promise(resolve=>setTimeout(resolve,100));expect(shape.getAttribute('aria-pressed')).toBe('true');
      expect(errors).toEqual([]);
    } finally {dom.window.close();}
  });
});
