import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, '../public'),
  server: {
    port: 3005,
    open: '/index.html'
  },
  build: {
    outDir: '../dist-editor',
    sourcemap: true
  }
})
