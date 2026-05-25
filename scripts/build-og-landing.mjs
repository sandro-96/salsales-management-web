/**
 * Build OG cards (1200x630) — tối ưu thumbnail Zalo/FB (chữ lớn, ít chi tiết UI).
 *   public/og-landing.png
 *   public/og-landing.webp
 *
 * Chạy: npm run build:og
 *
 * OG_STYLE=screenshot — layout cũ (dashboard screenshot bên phải).
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

const W = 1200;
const H = 630;
const style = (process.env.OG_STYLE || "brand").toLowerCase();

function brandCardSvg() {
  return `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1f6b3a"/>
      <stop offset="55%" stop-color="#2d8a4e"/>
      <stop offset="100%" stop-color="#1a5530"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
  </defs>

  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#shine)"/>

  <!-- decorative circles -->
  <circle cx="980" cy="120" r="180" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="1080" cy="520" r="140" fill="#ffffff" fill-opacity="0.05"/>

  <!-- logo mark -->
  <rect x="72" y="88" width="72" height="72" rx="18" fill="#ffffff" fill-opacity="0.18"/>
  <text x="108" y="138" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="40" font-weight="700" fill="#ffffff">₫</text>

  <!-- main copy — large for small Zalo thumbnails -->
  <text x="72" y="228" font-family="system-ui,Segoe UI,sans-serif" font-size="72" font-weight="800" fill="#ffffff">Sổ thu chi</text>
  <text x="72" y="292" font-family="system-ui,Segoe UI,sans-serif" font-size="34" font-weight="600" fill="#e8f5ec">POS · Storefront · QR bàn</text>
  <text x="72" y="348" font-family="system-ui,Segoe UI,sans-serif" font-size="26" fill="#d1e9d8">Phần mềm bán hàng trên web — điện thoại, tablet, laptop</text>

  <!-- feature pills -->
  <g filter="url(#shadow)">
    <rect x="72" y="400" width="320" height="56" rx="28" fill="#ffffff" fill-opacity="0.95"/>
    <text x="232" y="436" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="22" font-weight="700" fill="#1f6b3a">Dùng thử 30 ngày miễn phí</text>
  </g>
  <text x="72" y="510" font-family="system-ui,Segoe UI,sans-serif" font-size="24" font-weight="600" fill="#ffffff">99.000đ / tháng sau trial</text>

  <!-- right: 3 simple feature blocks (no tiny screenshot) -->
  <g transform="translate(640, 96)">
    <rect x="0" y="0" width="488" height="118" rx="20" fill="#ffffff" fill-opacity="0.12"/>
    <text x="28" y="48" font-family="system-ui,Segoe UI,sans-serif" font-size="28" font-weight="700" fill="#ffffff">POS đa thiết bị</text>
    <text x="28" y="82" font-family="system-ui,Segoe UI,sans-serif" font-size="20" fill="#d1e9d8">Quầy bán · đơn hàng · kho · báo cáo</text>

    <rect x="0" y="138" width="488" height="118" rx="20" fill="#ffffff" fill-opacity="0.12"/>
    <text x="28" y="186" font-family="system-ui,Segoe UI,sans-serif" font-size="28" font-weight="700" fill="#ffffff">Storefront online</text>
    <text x="28" y="220" font-family="system-ui,Segoe UI,sans-serif" font-size="20" fill="#d1e9d8">Khách đặt món qua link / QR cửa hàng</text>

    <rect x="0" y="276" width="488" height="118" rx="20" fill="#ffffff" fill-opacity="0.12"/>
    <text x="28" y="324" font-family="system-ui,Segoe UI,sans-serif" font-size="28" font-weight="700" fill="#ffffff">QR gọi món tại bàn</text>
    <text x="28" y="358" font-family="system-ui,Segoe UI,sans-serif" font-size="20" fill="#d1e9d8">F&amp;B — scan QR, order không cần app</text>
  </g>

  <text x="1128" y="598" text-anchor="end" font-family="system-ui,Segoe UI,sans-serif" font-size="18" fill="#b8dcc4">sotuci.vn</text>
</svg>`;
}

function roundedMask(width, height, radius) {
  return Buffer.from(
    `<svg width="${width}" height="${height}"><rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/></svg>`,
  );
}

async function buildScreenshotLayout() {
  const screenshotOverview =
    process.env.OG_SCREENSHOT_OVERVIEW ||
    path.join(root, "scripts", "og-source", "dashboard-overview.png");

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

  return sharp({
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
}

async function buildBrandLayout() {
  return sharp(Buffer.from(brandCardSvg())).png().toBuffer();
}

const composedRaw =
  style === "screenshot" ? await buildScreenshotLayout() : await buildBrandLayout();

await sharp(composedRaw)
  .png({
    palette: style === "screenshot",
    quality: 90,
    compressionLevel: 9,
    adaptiveFiltering: true,
    effort: 10,
  })
  .toFile(outPng);

await sharp(composedRaw)
  .webp({
    quality: 88,
    effort: 6,
    smartSubsample: true,
  })
  .toFile(outWebp);

const [pngStat, webpStat] = await Promise.all([
  fs.stat(outPng),
  fs.stat(outWebp),
]);

const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`OG style: ${style}`);
console.log(`Wrote ${outPng} (${fmt(pngStat.size)})`);
console.log(`Wrote ${outWebp} (${fmt(webpStat.size)})`);
