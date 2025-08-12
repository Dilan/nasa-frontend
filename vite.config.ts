import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    outDir: 'dist',
    ssrManifest: true,
    cssCodeSplit: false, // Generate a single CSS file
  },
  ssr: {
    noExternal: ['react-router-dom', 'sonner'],
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://localhost:4200',
        changeOrigin: true,
      },
      /*
          /epic/images/epic_1b_20200715001752.png -> http://localhost:4200/api/v1/epic/images/epic_1b_20200715001752.png
      */
      '/epic/images': {
        target: 'http://localhost:4200',
        rewrite: (path) => path.replace(/^\/epic\/images/, '/api/v1/epic/images'),
        changeOrigin: true,
      },
    },
  },
});