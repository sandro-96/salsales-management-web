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

          // React + thư viện gọi createContext/hooks — PHẢI cùng chunk để tránh
          // "Cannot read properties of undefined (reading 'createContext')".
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("scheduler") ||
            id.includes("framer-motion") ||
            id.includes("motion-utils") ||
            id.includes("react-router") ||
            id.includes("@remix-run/router") ||
            id.includes("@radix-ui") ||
            id.includes("vaul") ||
            id.includes("react-i18next") ||
            id.includes("next-themes") ||
            id.includes("sonner") ||
            id.includes("@tanstack/react-table") ||
            id.includes("@dnd-kit") ||
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("react-markdown") ||
            id.includes("remark-") ||
            id.includes("micromark") ||
            id.includes("mdast-") ||
            id.includes("hast-") ||
            id.includes("react-day-picker") ||
            id.includes("recharts") ||
            id.includes("/d3-")
          ) {
            return "vendor-react";
          }

          // Excel — lazy qua ProductImportExportDialog (~280KB).
          if (id.includes("exceljs")) return "vendor-excel";

          // Barcode — lazy qua ProductFormModal (~400KB).
          if (
            id.includes("@zxing/browser") ||
            id.includes("@zxing/library") ||
            id.includes("qrcode.react") ||
            id.includes("qrcode")
          ) {
            return "vendor-barcode";
          }

          if (id.includes("date-fns")) return "vendor-date";

          if (id.includes("/zod/")) return "vendor-zod";

          if (
            id.includes("@stomp/stompjs") ||
            id.includes("sockjs-client")
          ) {
            return "vendor-ws";
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