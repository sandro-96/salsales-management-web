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
  };
});