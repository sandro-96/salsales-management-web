import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  define: {
    global: 'globalThis',   // 👈 Fix lỗi "global is not defined"
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis', // 👈 cần ở đây cho esbuild
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
})