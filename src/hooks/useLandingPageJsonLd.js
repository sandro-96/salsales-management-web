import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { applySeoHead } from "@/lib/seoHead";
import { buildLandingJsonLd } from "@/lib/landingSeoJsonLd";
import { getSiteUrl } from "@/lib/siteUrl";

/** FAQ + SoftwareApplication JSON-LD on marketing landing. */
export function useLandingPageJsonLd() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const brand = t("brand.appName");
    const jsonLd = buildLandingJsonLd(t, { brand, siteUrl: getSiteUrl() });
    applySeoHead({ jsonLd });
  }, [t, i18n.language]);
}
