import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    // En desarrollo el front (5173) le pasa /api al backend (3001).
    proxy: { '/api': 'http://localhost:3001' },
  },
  preview: { allowedHosts: true },
  test: { environment: 'node', pool: 'threads' },
})
