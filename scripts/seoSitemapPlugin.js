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

/**
 * Writes dist/sitemap.xml when VITE_SITE_URL is set at build time.
 */
export function seoSitemapPlugin() {
  return {
    name: "seo-sitemap",
    closeBundle() {
      const base = (process.env.VITE_SITE_URL || "").trim().replace(/\/+$/, "");
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
