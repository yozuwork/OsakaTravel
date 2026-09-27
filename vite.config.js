import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 讓打包後的 dist 可放在任何子路徑（GitHub Pages 等）
export default defineConfig({
  base: './',
  plugins: [react()]
});
