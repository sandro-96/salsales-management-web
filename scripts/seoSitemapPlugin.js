/* eslint-env node */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// Public, indexable URLs. Mỗi entry có priority + changefreq riêng.
const PUBLIC_PATHS = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/landing", priority: "1.0", changefreq: "weekly" },
  { loc: "/login", priority: "0.5", changefreq: "monthly" },
  { loc: "/register", priority: "0.8", changefreq: "monthly" },
  { loc: "/forgot-password", priority: "0.3", changefreq: "yearly" },
  { loc: "/terms", priority: "0.4", changefreq: "yearly" },
  { loc: "/privacy", priority: "0.4", changefreq: "yearly" },
];

const SUPPORTED_LANGS = ["vi", "en"];
const DEFAULT_LANG = "vi";

function siteBase() {
  return (process.env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
}

function ogImageUrl(base) {
  const ogPath = (process.env.VITE_OG_IMAGE_PATH || "/og-landing.png").trim();
  return `${base}${ogPath.startsWith("/") ? ogPath : `/${ogPath}`}`;
}

/** Escape for double-quoted HTML attribute values */
function attrEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Escape XML entities for sitemap content */
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Inject defaults / overrides into static index.html so that social crawlers
 * (FB, Zalo, Slack, Twitter) get the canonical production URL and image.
 *
 * Hoạt động bổ trợ cho các default đã có sẵn trong index.html: nếu
 * VITE_SITE_URL được set, plugin sẽ ghi đè href absolute để các crawler
 * không runtime JS vẫn lấy đúng URL production.
 */
function buildOgMetaBlock(base, html) {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]*)"/i,
  );
  const title = attrEscape(
    titleMatch?.[1]?.replace(/&amp;/g, "&") ||
      "Sổ thu chi — Phần mềm POS web, storefront & QR bàn",
  );
  const description = attrEscape(
    descMatch?.[1] ||
      "Sổ thu chi — phần mềm POS chạy trên trình duyệt. Dùng thử 30 ngày, 99.000₫/tháng.",
  );
  const image = ogImageUrl(base);
  return `
    <meta property="og:url" content="${base}/" data-build-injected="true" />
    <meta property="og:image" content="${image}" data-build-injected="true" />
    <meta property="og:image:secure_url" content="${image}" data-build-injected="true" />
    <meta name="twitter:image" content="${image}" data-build-injected="true" />
    <link rel="canonical" href="${base}/" data-build-injected="true" />`;
}

/**
 * Override hoặc thêm các meta được build-injected vào index.html sau build.
 * Tránh trùng lặp với defaults đã có trong index.html bằng cách xoá thẻ trùng
 * (cùng property/rel) không có `data-build-injected` trước khi inject.
 */
function injectBuildOgIntoHtml(html, base) {
  // Loại bỏ các default canonical / og:url / og:image / twitter:image để override bằng absolute URL.
  let out = html
    .replace(
      /\n?\s*<link\s+rel="canonical"[^>]*>(?![\s\S]*data-build-injected)/i,
      "",
    )
    .replace(
      /\n?\s*<meta\s+property="og:url"[^>]*>(?![\s\S]*data-build-injected)/i,
      "",
    )
    .replace(
      /\n?\s*<meta\s+property="og:image"[^>]*>(?![\s\S]*data-build-injected)/i,
      "",
    )
    .replace(
      /\n?\s*<meta\s+property="og:image:secure_url"[^>]*>(?![\s\S]*data-build-injected)/i,
      "",
    )
    .replace(
      /\n?\s*<meta\s+name="twitter:image"[^>]*>(?![\s\S]*data-build-injected)/i,
      "",
    );

  if (out.includes('data-build-injected="true"')) return out;
  return out.replace("</head>", `${buildOgMetaBlock(base, out)}\n  </head>`);
}

function buildSitemapXml(base) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const NS = [
    'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
  ].join(" ");

  const urls = PUBLIC_PATHS.map(({ loc, priority, changefreq }) => {
    const fullLoc = `${base}${loc}`;
    const alternates = SUPPORTED_LANGS.map(
      (lng) =>
        `    <xhtml:link rel="alternate" hreflang="${lng}" href="${xmlEscape(
          `${fullLoc}?lng=${lng}`,
        )}" />`,
    ).join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(
      fullLoc,
    )}" />`;
    return `  <url>
    <loc>${xmlEscape(fullLoc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
${xDefault}
  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${NS}>
${urls}
</urlset>
`;
}

function ensureSitemapInRobots(outDir, base) {
  const robotsPath = path.join(outDir, "robots.txt");
  const sitemapLine = `Sitemap: ${base}/sitemap.xml`;
  if (!fs.existsSync(robotsPath)) {
    fs.writeFileSync(robotsPath, `User-agent: *\nAllow: /\n\n${sitemapLine}\n`);
    return;
  }
  const existing = fs.readFileSync(robotsPath, "utf8");
  if (existing.includes(sitemapLine)) return;
  // Strip any previous Sitemap line to avoid stale URLs after domain change.
  const cleaned = existing.replace(/^Sitemap:.*$/gim, "").replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(robotsPath, `${cleaned.trimEnd()}\n\n${sitemapLine}\n`);
}

/**
 * Writes dist/sitemap.xml, ensures robots.txt has the Sitemap directive,
 * and injects absolute OG meta into index.html — all when VITE_SITE_URL is set.
 *
 * Có thể chạy đầy đủ kể cả khi không có VITE_SITE_URL: trong trường hợp đó
 * sitemap/robots không được ghi (tránh sitemap rỗng/sai domain), nhưng
 * index.html vẫn giữ nguyên các default OG đã có sẵn.
 */
export function seoSitemapPlugin() {
  return {
    name: "seo-sitemap",
    transformIndexHtml(html) {
      const base = siteBase();
      if (!base) return html;
      return injectBuildOgIntoHtml(html, base);
    },
    closeBundle() {
      const base = siteBase();
      if (!base) {
        console.warn(
          "[seo-sitemap] VITE_SITE_URL not set — sitemap.xml & robots Sitemap directive skipped.",
        );
        return;
      }

      const outDir = path.resolve(process.cwd(), "dist");
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        buildSitemapXml(base),
        "utf8",
      );
      ensureSitemapInRobots(outDir, base);
    },
  };
}
