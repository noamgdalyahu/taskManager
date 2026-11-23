import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

const apiUrl = process.env.API_URL ?? 'http://localhost:5263'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // One copy of React for everything, even if a second dev server rewrites the pre-bundled dependency cache.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    // In development the browser talks to Vite, Vite forwards /api to the C# server, so there is no CORS to configure.
    proxy: {
      '/api': { target: apiUrl, changeOrigin: true },
      // The live-update channel is a WebSocket.
      '/hubs': { target: apiUrl, changeOrigin: true, ws: true },
    },
  },
})
