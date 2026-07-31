import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2018', 'safari13'],
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        iphone: resolve(__dirname, 'iphone.html')
      }
    }
  }
});
