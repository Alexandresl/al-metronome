import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import packageJson from './package.json' // <--- Importe aqui também

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist-web',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  // Adicione aqui:
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  }
})
