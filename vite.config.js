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
    // Vendor có hash riêng → các page chia nhau cùng chunk, cache tốt hơn
    // sau mỗi deploy (app code đổi nhưng vendor không đổi).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          // Excel — chỉ ProductImportExportDialog dùng. Tách rời để
          // không bị main bundle kéo theo ~280KB.
          if (id.includes("exceljs")) return "vendor-excel";

          // Barcode scanner — chỉ ProductForm/BarcodeScanner dùng.
          if (
            id.includes("@zxing/browser") ||
            id.includes("@zxing/library") ||
            id.includes("qrcode.react") ||
            id.includes("qrcode")
          ) {
            return "vendor-barcode";
          }

          // Charts — chỉ Overview/Reports dùng.
          if (id.includes("recharts") || id.includes("d3-")) {
            return "vendor-charts";
          }

          // Markdown — ProductForm description.
          if (
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-")
          ) {
            return "vendor-markdown";
          }

          // Form stack — dùng rộng rãi nhưng vẫn nên tách để cache.
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("/zod/")
          ) {
            return "vendor-forms";
          }

          if (id.includes("date-fns") || id.includes("react-day-picker")) {
            return "vendor-date";
          }

          if (id.includes("framer-motion") || id.includes("motion-utils")) {
            return "vendor-motion";
          }

          if (id.includes("@tanstack/react-table")) {
            return "vendor-table";
          }

          if (id.includes("@dnd-kit")) {
            return "vendor-dnd";
          }

          if (id.includes("@radix-ui") || id.includes("vaul")) {
            return "vendor-radix";
          }

          if (
            id.includes("@stomp/stompjs") ||
            id.includes("sockjs-client")
          ) {
            return "vendor-ws";
          }

          if (
            id.includes("react-router") ||
            id.includes("@remix-run/router")
          ) {
            return "vendor-router";
          }

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("scheduler")
          ) {
            return "vendor-react";
          }

          return "vendor-misc";
        },
      },
    },
    // Cảnh báo chỉ những chunk THẬT sự lớn (>800KB minified)
    chunkSizeWarningLimit: 800,
  },
  };
});