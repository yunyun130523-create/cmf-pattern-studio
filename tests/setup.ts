import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(()=>{cleanup();if(typeof localStorage!=='undefined')localStorage.clear();vi.restoreAllMocks();});
if(typeof HTMLDialogElement!=='undefined') {
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
}
if(typeof PointerEvent==='undefined'&&typeof MouseEvent!=='undefined')Object.defineProperty(globalThis,'PointerEvent',{value:MouseEvent});
