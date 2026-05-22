/**
 * Build OG cards (1200x630):
 *   public/og-landing.png   — PNG palette-indexed, tối ưu cho FB/Zalo/Slack
 *   public/og-landing.webp  — WebP cho client hiện đại (~60% nhỏ hơn)
 *
 * Nguồn: scripts/og-source/dashboard-overview.png (override bằng OG_SCREENSHOT_OVERVIEW).
 * Chạy: npm run build:og
 */
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const outPng = path.join(publicDir, "og-landing.png");
const outWebp = path.join(publicDir, "og-landing.webp");

const screenshotOverview =
  process.env.OG_SCREENSHOT_OVERVIEW ||
  path.join(root, "scripts", "og-source", "dashboard-overview.png");

const W = 1200;
const H = 630;
const LEFT_W = 400;
const FRAME_W = 768;
const FRAME_H = 572;
const RADIUS = 14;
const FRAME_LEFT = LEFT_W - 8;
const FRAME_TOP = Math.round((H - FRAME_H) / 2);

const leftSvg = `
<svg width="${LEFT_W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f8f9fa"/>
      <stop offset="100%" style="stop-color:#f1f5f4"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="40" y="168" width="44" height="44" rx="10" fill="#3e7b44" fill-opacity="0.12"/>
  <text x="52" y="198" font-family="system-ui,Segoe UI,sans-serif" font-size="22" fill="#3e7b44">₫</text>
  <text x="40" y="248" font-family="system-ui,Segoe UI,sans-serif" font-size="48" font-weight="700" fill="#111827">Sổ thu chi</text>
  <text x="40" y="292" font-family="system-ui,Segoe UI,sans-serif" font-size="21" fill="#6b7280">POS · Storefront · QR bàn</text>
  <text x="40" y="338" font-family="system-ui,Segoe UI,sans-serif" font-size="19" font-weight="600" fill="#3e7b44">Dùng thử 30 ngày · 99.000đ/tháng</text>
</svg>`;

function roundedMask(width, height, radius) {
  return Buffer.from(
    `<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );
}

const resized = await sharp(screenshotOverview)
  .resize(FRAME_W, FRAME_H, { fit: "cover", position: "left top" })
  .ensureAlpha()
  .png()
  .toBuffer();

const framed = await sharp(resized)
  .composite([{ input: roundedMask(FRAME_W, FRAME_H, RADIUS), blend: "dest-in" }])
  .png()
  .toBuffer();

const shadow = await sharp({
  create: {
    width: FRAME_W + 32,
    height: FRAME_H + 32,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    {
      input: await sharp(
        Buffer.from(
          `<svg width="${FRAME_W}" height="${FRAME_H}"><rect width="100%" height="100%" rx="${RADIUS}" fill="black"/></svg>`,
        ),
      )
        .resize(FRAME_W, FRAME_H)
        .png()
        .toBuffer(),
      left: 16,
      top: 16,
    },
  ])
  .blur(18)
  .ensureAlpha()
  .linear(1, 0, 0.35)
  .png()
  .toBuffer();

const leftPanel = await sharp(Buffer.from(leftSvg)).png().toBuffer();

const composedRaw = await sharp({
  create: {
    width: W,
    height: H,
    channels: 3,
    background: "#f3f4f6",
  },
})
  .composite([
    { input: leftPanel, left: 0, top: 0 },
    { input: shadow, left: FRAME_LEFT - 6, top: FRAME_TOP - 4 },
    { input: framed, left: FRAME_LEFT, top: FRAME_TOP },
  ])
  .png()
  .toBuffer();

/* Optimized PNG output:
 *   - palette: chuyển sang PNG-8 indexed (256 màu) — giảm ~70% so với truecolor RGBA.
 *   - compressionLevel 9 + adaptiveFiltering: zlib chạy hết sức.
 *   - quality 85: zlib quantize, vẫn rất sắc cho UI screenshot.
 * Với ảnh OG flat (gradient + chữ + screenshot), khác biệt thị giác gần như không thấy.
 */
await sharp(composedRaw)
  .png({
    palette: true,
    quality: 85,
    compressionLevel: 9,
    adaptiveFiltering: true,
    effort: 10,
  })
  .toFile(outPng);

await sharp(composedRaw)
  .webp({
    quality: 82,
    effort: 6,
    smartSubsample: true,
  })
  .toFile(outWebp);

const [pngStat, webpStat] = await Promise.all([
  fs.stat(outPng),
  fs.stat(outWebp),
]);

const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`Wrote ${outPng} (${fmt(pngStat.size)})`);
console.log(`Wrote ${outWebp} (${fmt(webpStat.size)})`);
