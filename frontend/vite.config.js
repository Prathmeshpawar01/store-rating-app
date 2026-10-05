import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development, /api requests are proxied to the Express backend so the
// browser talks to a single origin. Override the target with VITE_PROXY_TARGET.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
});
