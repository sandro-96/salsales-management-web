/**
 * Render public/apple-touch-icon.png (180×180) from public/favicon.svg — iOS Add to Home Screen.
 * Run: npm run build:icons
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const svg = path.join(root, "public", "favicon.svg");
const out = path.join(root, "public", "apple-touch-icon.png");

await sharp(svg).resize(180, 180).png().toFile(out);
console.log("Wrote", out);
