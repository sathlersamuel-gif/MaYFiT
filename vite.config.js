import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubPagesHtml = {
  name: 'mayfit-github-pages-html',
  enforce: 'pre',
  transformIndexHtml(html) {
    return html
      .replace(/\s*<script type="module" src="\/src\/main\.jsx\?v=16"><\/script>/, '')
      .replace(/\s*<script type="module" src="\/src\/supabase-auth-bridge\.js\?v=4"><\/script>/, '')
      .replace(/\s*<script type="module" src="\/src\/student-management\.js\?v=6"><\/script>/, '')
      .replace(/\s*<script type="module" src="\/src\/workout-interactions\.js\?v=16"><\/script>/, '')
      .replace(/\s*<script type="module" src="\/src\/workout-history\.js\?v=6"><\/script>/, '<script type="module" src="/src/github-pages-entry.jsx"></script>')
      .replace("if('serviceWorker' in navigator){window.addEventListener('load',async()=>{const registration=await navigator.serviceWorker.register('/sw.js?v=39');registration.update()})}", '')
      .replace('href="/manifest.webmanifest"', 'href="/MaYFiT/manifest.webmanifest"')
      .replace('href="/icons/icon-192.png"', 'href="/MaYFiT/icons/icon-192.png"');
  },
};

export default defineConfig({
  plugins: [githubPagesHtml, react()],
  base: '/MaYFiT/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
