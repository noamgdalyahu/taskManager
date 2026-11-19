import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // In development the browser talks to Vite, Vite forwards /api to the C# server, so there is no CORS to configure.
    proxy: { '/api': { target: 'http://localhost:5263', changeOrigin: true } },
  },
})
