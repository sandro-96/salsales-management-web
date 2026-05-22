import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applySeoHead } from "@/lib/seoHead";
import { buildLandingJsonLd } from "@/lib/landingSeoJsonLd";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Landing-specific structured data: BreadcrumbList, SoftwareApplication, FAQPage.
 * Sử dụng jsonLdId riêng để không đè JSON-LD của route hay global.
 */
export function useLandingPageJsonLd() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const brand = t("brand.appName");
    const jsonLd = buildLandingJsonLd(t, { brand, siteUrl: getSiteUrl() });
    applySeoHead({ jsonLd, jsonLdId: "landing-jsonld" });
  }, [t, i18n.language]);
}
