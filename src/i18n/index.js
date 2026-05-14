import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import vi from "./locales/vi.json";
import en from "./locales/en.json";
import storefrontVi from "./locales/pages/storefront.vi.json";
import storefrontEn from "./locales/pages/storefront.en.json";
import notificationsVi from "./locales/pages/notifications.vi.json";
import notificationsEn from "./locales/pages/notifications.en.json";
import supportVi from "./locales/pages/support.vi.json";
import supportEn from "./locales/pages/support.en.json";

export const SUPPORTED_LANGUAGES = [
  { code: "vi", labelKey: "language.vi" },
  { code: "en", labelKey: "language.en" },
];

export const DEFAULT_LANGUAGE = "vi";
export const LANGUAGE_STORAGE_KEY = "app.language";

const pagesVi = {
  storefront: storefrontVi,
  notifications: notificationsVi,
  support: supportVi,
};

const pagesEn = {
  storefront: storefrontEn,
  notifications: notificationsEn,
  support: supportEn,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: { ...vi, pages: pagesVi } },
      en: { translation: { ...en, pages: pagesEn } },
    },
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false,
    },
  });

if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language || DEFAULT_LANGUAGE;
  i18n.on("languageChanged", (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
