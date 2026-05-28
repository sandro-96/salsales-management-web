/**
 * Render public/favicon.ico from public/favicon.svg — for browsers + Google Search favicon.
 * Run: npm run build:favicon
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as ico from "sharp-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svg = path.join(root, "public", "favicon.svg");
const out = path.join(root, "public", "favicon.ico");

// Generate multi-size favicon.ico (Google typically uses 48x48).
await ico.sharpsToIco([sharp(svg).resize(256, 256).png()], out, {
  sizes: [256, 128, 64, 48, 32, 16],
  resizeOptions: {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
});

console.log("Wrote", out);
