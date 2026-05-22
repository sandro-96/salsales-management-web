import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applySeoHead } from "@/lib/seoHead";
import { absoluteUrl, getSiteUrl } from "@/lib/siteUrl";
import {
  buildProductJsonLd,
  buildStorefrontBreadcrumbJsonLd,
} from "@/lib/storefrontSeoJsonLd";

const JSON_LD_ID = "storefront-product-jsonld";

function truncate(text, max = 160) {
  if (!text) return "";
  const clean = String(text)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/**
 * SEO cho /s/:slug/products/:id — set title/description/og:image theo product,
 * inject Product + BreadcrumbList. Cleanup khi unmount.
 */
export function useStorefrontProductSeo({ shop, slug, product }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!product?.name || !slug || !shop) return undefined;

    const brand = t("brand.appName");
    const siteUrl = getSiteUrl();
    const title = `${product.name} | ${shop.name}`;
    const description =
      truncate(product.description, 160) ||
      `${product.name} — ${shop.name}. ${t("pages.storefront.header.subtitle")}`;
    const canonical = absoluteUrl(`/s/${slug}/products/${product.id}`);

    const productImages = Array.isArray(product.images) ? product.images : [];
    const variantImages =
      product.variants?.flatMap((v) =>
        Array.isArray(v.images) ? v.images : [],
      ) ?? [];
    const ogImage =
      productImages[0] ||
      variantImages[0] ||
      shop.coverUrl ||
      shop.logoUrl ||
      undefined;

    const jsonLd = [
      buildProductJsonLd(product, shop, { siteUrl, slug }),
      buildStorefrontBreadcrumbJsonLd(shop, {
        siteUrl,
        slug,
        productName: product.name,
      }),
    ].filter(Boolean);

    applySeoHead({
      title,
      description,
      canonical: canonical || undefined,
      ogImage,
      ogType: "product",
      siteName: brand,
      jsonLd: jsonLd.length ? jsonLd : undefined,
      jsonLdId: JSON_LD_ID,
    });

    return () => {
      document.querySelector(`script#${JSON_LD_ID}`)?.remove();
    };
  }, [shop, slug, product, t]);
}
