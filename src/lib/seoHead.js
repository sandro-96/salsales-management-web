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
  const sel = `link[rel="${rel}"][${MANAGED}]`;
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
      opts.noIndex ? "noindex, nofollow" : "index, follow",
    );
  }

  if (opts.canonical !== undefined) {
    upsertLink("canonical", opts.canonical || "");
  }

  if (opts.title != null || opts.description != null) {
    const ogTitle = opts.title ?? document.title;
    const ogDesc = opts.description ?? findMeta("name", "description")?.getAttribute("content") ?? "";
    upsertMeta("property", "og:title", ogTitle);
    upsertMeta("property", "og:description", ogDesc);
    upsertMeta("name", "twitter:title", ogTitle);
    upsertMeta("name", "twitter:description", ogDesc);
  }

  if (opts.ogType != null) {
    upsertMeta("property", "og:type", opts.ogType);
  }

  if (opts.canonical) {
    upsertMeta("property", "og:url", opts.canonical);
  }

  if (opts.ogImage !== undefined) {
    if (opts.ogImage) {
      upsertMeta("property", "og:image", opts.ogImage);
      upsertMeta("name", "twitter:card", "summary_large_image");
      upsertMeta("name", "twitter:image", opts.ogImage);
    } else {
      findMeta("property", "og:image")?.remove();
      findMeta("name", "twitter:card")?.remove();
      findMeta("name", "twitter:image")?.remove();
    }
  }

  if (jsonLd !== undefined) {
    upsertJsonLd(jsonLdId, jsonLd);
  }
}
