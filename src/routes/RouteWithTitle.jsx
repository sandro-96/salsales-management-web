// src/routes/RouteWithTitle.jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { applySeoHead } from "@/lib/seoHead";
import { absoluteUrl } from "@/lib/siteUrl";

const RouteWithTitle = ({
  element,
  title,
  titleKey,
  seoKey,
  seoPath,
  noIndex = false,
}) => {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    const brand = t("brand.appName");
    const suffix = t("app.documentTitleSuffix");
    const resolvedTitle = titleKey ? t(titleKey) : title;

    let pageTitle = resolvedTitle ? `${resolvedTitle} | ${suffix}` : suffix;
    let description = "";
    let canonicalPath = seoPath ?? pathname;
    let ogImage = "";

    if (seoKey) {
      const base = seoKey;
      const seoTitle = t(`${base}.title`, { brand, defaultValue: "" });
      const seoDesc = t(`${base}.description`, { brand, defaultValue: "" });
      if (seoTitle) pageTitle = seoTitle;
      if (seoDesc) description = seoDesc;
      const pathFromI18n = t(`${base}.path`, { defaultValue: "" });
      if (pathFromI18n) canonicalPath = pathFromI18n;
      const img = t(`${base}.ogImage`, { defaultValue: "" });
      if (img) ogImage = absoluteUrl(img) || img;
    }

    const ogDefault = import.meta.env.VITE_OG_IMAGE_PATH?.trim();
    if (!ogImage && ogDefault) {
      ogImage =
        absoluteUrl(ogDefault) ||
        (typeof window !== "undefined" && ogDefault.startsWith("/")
          ? `${window.location.origin}${ogDefault}`
          : ogDefault);
    }

    const canonical = absoluteUrl(canonicalPath);

    applySeoHead({
      title: pageTitle,
      description,
      canonical: canonical || undefined,
      ogImage: ogImage || undefined,
      noIndex,
    });
  }, [
    title,
    titleKey,
    seoKey,
    seoPath,
    noIndex,
    pathname,
    t,
    i18n.language,
  ]);

  return <>{element}</>;
};

export default RouteWithTitle;
