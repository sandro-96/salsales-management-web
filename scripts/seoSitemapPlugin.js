/* eslint-env node */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PUBLIC_PATHS = [
  "/landing",
  "/login",
  "/register",
  "/forgot-password",
  "/terms",
  "/privacy",
];

function siteBase() {
  return (process.env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
}

function ogImageUrl(base) {
  const ogPath = (process.env.VITE_OG_IMAGE_PATH || "/og-landing.png").trim();
  return `${base}${ogPath.startsWith("/") ? ogPath : `/${ogPath}`}`;
}

/** Escape for double-quoted HTML attribute values */
function attrEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;");
}

/**
 * Injects static Open Graph tags into index.html at build time.
 * Zalo / Facebook / Messenger crawlers do not run React — they need og:image in HTML.
 */
function buildOgMetaBlock(base, html) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"/i,
  );
  const title = attrEscape(
    titleMatch?.[1]?.replace(/&amp;/g, "&") ||
      "Sổ thu chi — Quản lý bán hàng POS & storefront",
  );
  const description = attrEscape(
    descMatch?.[1] ||
      "Sổ thu chi — phần mềm quản lý bán hàng: POS, storefront, QR bàn. Dùng thử 30 ngày, 99.000₫/tháng.",
  );
  const image = ogImageUrl(base);
  return `
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${base}/" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:locale" content="vi_VN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />`;
}

/**
 * Writes dist/sitemap.xml and injects OG meta when VITE_SITE_URL is set at build time.
 */
export function seoSitemapPlugin() {
  return {
    name: "seo-sitemap",
    transformIndexHtml(html) {
      const base = siteBase();
      if (!base || html.includes('property="og:image"')) return html;
      return html.replace("</head>", `${buildOgMetaBlock(base, html)}\n  </head>`);
    },
    closeBundle() {
      const base = siteBase();
      if (!base) return;

      const urls = PUBLIC_PATHS.map(
        (p) => `  <url>\n    <loc>${base}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === "/landing" ? "1.0" : "0.6"}</priority>\n  </url>`,
      ).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

      const outDir = path.resolve(process.cwd(), "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), xml, "utf8");

      const robotsPath = path.join(outDir, "robots.txt");
      const robotsExtra = `Sitemap: ${base}/sitemap.xml\n`;
      if (fs.existsSync(robotsPath)) {
        const existing = fs.readFileSync(robotsPath, "utf8");
        if (!existing.includes("Sitemap:")) {
          fs.appendFileSync(robotsPath, `\n${robotsExtra}`);
        }
      }
    },
  };
}
