import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// In dev, any call to /api is forwarded to the Express server -> no CORS headaches, no URLs hard-coded in components.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
  build: { rollupOptions: { output: {
    // Libraries change rarely, our own code often: splitting them lets returning visitors keep the libraries in their browser cache.
    // Written as a function (not an object) because every Vite version accepts this form, old and new.
    manualChunks(id: string) {
      if (!id.includes('node_modules')) return undefined;
      if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion';
      if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(id)) return 'react';
      return undefined;
    },
  } } },
});
