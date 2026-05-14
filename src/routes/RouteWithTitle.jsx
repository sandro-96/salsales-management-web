// src/routes/RouteWithTitle.jsx
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const RouteWithTitle = ({ element, title, titleKey }) => {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const resolvedTitle = titleKey ? t(titleKey) : title;
    if (resolvedTitle) {
      document.title = `${resolvedTitle} | ${t("app.documentTitleSuffix")}`;
    }
  }, [title, titleKey, t, i18n.language]);

  return <>{element}</>;
};

export default RouteWithTitle;
