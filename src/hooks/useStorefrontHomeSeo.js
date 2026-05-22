import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applySeoHead } from "@/lib/seoHead";
import { absoluteUrl, getSiteUrl } from "@/lib/siteUrl";
import {
  buildItemListJsonLd,
  buildStorefrontBreadcrumbJsonLd,
  buildStoreJsonLd,
} from "@/lib/storefrontSeoJsonLd";

const JSON_LD_ID = "storefront-home-jsonld";

/**
 * SEO cho /s/:slug — set title/description theo shop, inject Store + ItemList
 * + Breadcrumb. Cleanup khi unmount để không leak schema sang trang khác.
 */
export function useStorefrontHomeSeo({ shop, slug, products }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!shop?.name || !slug) return undefined;

    const brand = t("brand.appName");
    const siteUrl = getSiteUrl();
    const title = `${shop.name} — ${t("pages.storefront.header.subtitle")}`;
    const description =
      shop.description ||
      shop.shortDescription ||
      t("pages.storefront.home.subtitleDefault");
    const canonical = absoluteUrl(`/s/${slug}`);
    const ogImage =
      shop.coverUrl ||
      shop.logoUrl ||
      (import.meta.env.VITE_OG_IMAGE_PATH
        ? absoluteUrl(import.meta.env.VITE_OG_IMAGE_PATH) || undefined
        : undefined);

    const jsonLd = [
      buildStoreJsonLd(shop, { siteUrl, slug, brand }),
      buildStorefrontBreadcrumbJsonLd(shop, { siteUrl, slug }),
      buildItemListJsonLd(products, { siteUrl, slug }),
    ].filter(Boolean);

    applySeoHead({
      title,
      description,
      canonical: canonical || undefined,
      ogImage: ogImage || undefined,
      ogType: "website",
      siteName: brand,
      jsonLd: jsonLd.length ? jsonLd : undefined,
      jsonLdId: JSON_LD_ID,
    });

    return () => {
      // Cleanup JSON-LD này; meta tags sẽ được route kế tiếp override qua RouteWithTitle.
      document.querySelector(`script#${JSON_LD_ID}`)?.remove();
    };
  }, [shop, slug, products, t]);
}
