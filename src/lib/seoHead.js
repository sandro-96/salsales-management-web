const MANAGED = "data-seo-managed";

function findMeta(attr, key) {
  return document.querySelector(`meta[${attr}="${key}"][${MANAGED}]`);
}

function upsertMeta(attr, key, content) {
  if (!content) {
    findMeta(attr, key)?.remove();
    return;
  }
  let el = findMeta(attr, key);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.setAttribute(MANAGED, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href) {
  const sel = `link[rel="${rel}"][${MANAGED}]:not([hreflang])`;
  if (!href) {
    document.querySelector(sel)?.remove();
    return;
  }
  let el = document.querySelector(sel);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute(MANAGED, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function clearAlternates() {
  document
    .querySelectorAll(`link[rel="alternate"][${MANAGED}][hreflang]`)
    .forEach((el) => el.remove());
}

function upsertAlternates(alternates) {
  clearAlternates();
  if (!Array.isArray(alternates)) return;
  alternates.forEach(({ hrefLang, href }) => {
    if (!hrefLang || !href) return;
    const el = document.createElement("link");
    el.setAttribute("rel", "alternate");
    el.setAttribute("hreflang", hrefLang);
    el.setAttribute("href", href);
    el.setAttribute(MANAGED, "true");
    document.head.appendChild(el);
  });
}

function upsertJsonLd(id, data) {
  document.querySelector(`script#${id}`)?.remove();
  if (!data) return;
  const el = document.createElement("script");
  el.type = "application/ld+json";
  el.id = id;
  el.setAttribute(MANAGED, "true");
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}

/**
 * @param {{
 *   title?: string;
 *   description?: string;
 *   canonical?: string;
 *   ogImage?: string;
 *   ogType?: string;
 *   siteName?: string;
 *   locale?: string;
 *   localeAlternates?: string[];
 *   alternates?: Array<{ hrefLang: string; href: string }>;
 *   noIndex?: boolean;
 *   jsonLd?: object | object[];
 *   jsonLdId?: string;
 * }} opts
 */
export function applySeoHead(opts) {
  const { jsonLd, jsonLdId = "page-jsonld" } = opts;

  if (opts.title != null) document.title = opts.title;

  if (opts.description != null) {
    upsertMeta("name", "description", opts.description || "");
  }

  if (opts.noIndex != null) {
    upsertMeta(
      "name",
      "robots",
      opts.noIndex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    );
  }

  if (opts.canonical !== undefined) {
    upsertLink("canonical", opts.canonical || "");
  }

  // Type/site_name/locale defaults — luôn set khi có meta khác để giữ social card đúng
  upsertMeta("property", "og:type", opts.ogType || "website");
  if (opts.siteName) upsertMeta("property", "og:site_name", opts.siteName);
  if (opts.locale) upsertMeta("property", "og:locale", opts.locale);

  // Xoá các locale:alternate cũ rồi thêm lại danh sách mới
  document
    .querySelectorAll(`meta[property="og:locale:alternate"][${MANAGED}]`)
    .forEach((el) => el.remove());
  if (Array.isArray(opts.localeAlternates)) {
    opts.localeAlternates
      .filter((l) => l && l !== opts.locale)
      .forEach((l) => {
        const el = document.createElement("meta");
        el.setAttribute("property", "og:locale:alternate");
        el.setAttribute("content", l);
        el.setAttribute(MANAGED, "true");
        document.head.appendChild(el);
      });
  }

  if (opts.title != null || opts.description != null) {
    const ogTitle = opts.title ?? document.title;
    const ogDesc =
      opts.description ??
      findMeta("name", "description")?.getAttribute("content") ??
      "";
    upsertMeta("property", "og:title", ogTitle);
    upsertMeta("property", "og:description", ogDesc);
    upsertMeta("name", "twitter:title", ogTitle);
    upsertMeta("name", "twitter:description", ogDesc);
  }

  if (opts.canonical) {
    upsertMeta("property", "og:url", opts.canonical);
  }

  if (opts.ogImage !== undefined) {
    if (opts.ogImage) {
      upsertMeta("property", "og:image", opts.ogImage);
      upsertMeta("property", "og:image:alt", opts.title || opts.siteName || "");
      upsertMeta("name", "twitter:card", "summary_large_image");
      upsertMeta("name", "twitter:image", opts.ogImage);
    } else {
      findMeta("property", "og:image")?.remove();
      findMeta("property", "og:image:alt")?.remove();
      findMeta("name", "twitter:card")?.remove();
      findMeta("name", "twitter:image")?.remove();
    }
  }

  if (opts.alternates !== undefined) {
    upsertAlternates(opts.alternates);
  }

  if (jsonLd !== undefined) {
    upsertJsonLd(jsonLdId, jsonLd);
  }
}
