import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  test: { environment: 'jsdom', setupFiles: ['./tests/setup.ts'], include: ['tests/**/*.test.{ts,tsx}'] },
  build: { target: 'es2022' }
});
