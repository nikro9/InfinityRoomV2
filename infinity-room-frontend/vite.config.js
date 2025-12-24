import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use Vue full build with template compiler for trading-vue-js
      'vue': path.resolve(__dirname, 'node_modules/vue/dist/vue.esm.js'),
    },
  },
  optimizeDeps: {
    include: ['vue', 'trading-vue-js'],
  },
})
