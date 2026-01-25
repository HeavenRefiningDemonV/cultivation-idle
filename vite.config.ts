import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['src'],
      },
    },
  },
  resolve: {
    alias: {
      classnames: path.resolve(__dirname, 'vendor/classnames/index.js'),
    },
  },
})
