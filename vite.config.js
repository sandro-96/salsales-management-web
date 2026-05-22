import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import path from "path"
import { fileURLToPath } from "url";
import { seoSitemapPlugin } from "./scripts/seoSitemapPlugin.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (env.VITE_SITE_URL) process.env.VITE_SITE_URL = env.VITE_SITE_URL;
  if (env.VITE_OG_IMAGE_PATH) process.env.VITE_OG_IMAGE_PATH = env.VITE_OG_IMAGE_PATH;

  return {
  // Mặc định 5173. Nếu Vite tự đổi cổng (5173 bận), redirect_uri Google đổi theo → thêm URI mới vào Console hoặc set VITE_GOOGLE_OAUTH_REDIRECT_URI.
  server: {
    port: 5173,
  },
  plugins: [
    react(),
    tailwindcss(),
    seoSitemapPlugin(),
  ],
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    /**
     * QUAN TRỌNG: chỉ tách những vendor "standalone" — KHÔNG import React.
     *
     * Lý do: React 19 dùng top-level `module.exports.Activity = …` (export
     * mới, trước đây tên Offscreen). Nếu manualChunks tách React khỏi các
     * thư viện dùng React, Rollup sinh re-export proxy có thứ tự khởi tạo
     * sai → lỗi "Cannot set properties of undefined (setting 'Activity')".
     *
     * Để Vite tự gom React + react-dom + radix + framer-motion + … vào
     * chunk chính (index) hoặc chunk theo route lazy. Chỉ chunk riêng:
     *   - exceljs (lazy qua ProductImportExportDialog)
     *   - @zxing/{library,browser} (lazy qua ProductFormModal scanner)
     *   - sockjs-client + @stomp/stompjs (chỉ WebSocketProvider dùng)
     *
     * Các package có "react" trong tên (qrcode.react, react-day-picker…)
     * KHÔNG được tách — chúng phải ở cùng chunk với React runtime.
     */
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("/exceljs/")) return "vendor-excel";

          if (
            id.includes("/@zxing/library/") ||
            id.includes("/@zxing/browser/")
          ) {
            return "vendor-barcode";
          }

          if (
            id.includes("/@stomp/stompjs/") ||
            id.includes("/sockjs-client/")
          ) {
            return "vendor-ws";
          }

          // Mọi thứ khác (gồm React, react-dom, radix, framer-motion,
          // recharts, lucide, axios, …) → để Vite tự chunk theo dependency
          // graph, tránh init order bug.
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
  };
});