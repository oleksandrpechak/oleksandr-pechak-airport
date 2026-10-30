/// <reference types="vitest/config" />
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The app always talks to relative `/api` and `/ws` URLs. In development Vite
// proxies them to Django; in production nginx does the same job.
// API_PROXY_TARGET is read by the dev server only and never reaches the bundle.
const BACKEND = process.env.API_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/ws': { target: BACKEND.replace('http', 'ws'), ws: true, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunk: changes only when React itself is upgraded.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler|react-router)\//.test(id)) return 'react';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
