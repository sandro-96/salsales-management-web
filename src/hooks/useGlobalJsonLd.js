import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applySeoHead } from "@/lib/seoHead";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Inject site-wide structured data (Organization + WebSite) at the root.
 * Per-page schemas (FAQPage, SoftwareApplication, BreadcrumbList) are added
 * separately with a different jsonLdId so they don't collide.
 *
 * Helps Google build a Knowledge Panel for the brand and adds a sitelinks
 * search box when applicable.
 */
export function useGlobalJsonLd() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const brand = t("brand.appName");
    const description = t("pages.landing.seo.description", { defaultValue: "" });
    const siteUrl = getSiteUrl();
    const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim() || "";
    const supportPhone = import.meta.env.VITE_SUPPORT_PHONE?.trim() || "";

    const blocks = [];

    const organization = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: brand,
      legalName: "Chu Thanh Trí",
      url: siteUrl || undefined,
      logo: siteUrl ? `${siteUrl}/apple-touch-icon.png` : undefined,
      sameAs: [],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: supportEmail || undefined,
          telephone: supportPhone || undefined,
          areaServed: "VN",
          availableLanguage: ["Vietnamese", "English"],
        },
      ],
      description: description || undefined,
    };
    blocks.push(organization);

    if (siteUrl) {
      blocks.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: brand,
        url: siteUrl,
        inLanguage: i18n.language || "vi",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/s/{search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
    }

    applySeoHead({ jsonLd: blocks, jsonLdId: "global-jsonld" });
  }, [t, i18n.language]);
}
