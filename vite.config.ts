import { defineConfig } from 'vite'

export default defineConfig({
  base: '/dm/',
  server: {
    port: 3004,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  publicDir: 'public'
})
