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
import contactVi from "./locales/pages/contact.vi.json";
import contactEn from "./locales/pages/contact.en.json";
import ordersVi from "./locales/pages/orders.vi.json";
import ordersEn from "./locales/pages/orders.en.json";
import productsVi from "./locales/pages/products.vi.json";
import productsEn from "./locales/pages/products.en.json";
import customersVi from "./locales/pages/customers.vi.json";
import customersEn from "./locales/pages/customers.en.json";
import branchesVi from "./locales/pages/branches.vi.json";
import branchesEn from "./locales/pages/branches.en.json";
import inventoryVi from "./locales/pages/inventory.vi.json";
import inventoryEn from "./locales/pages/inventory.en.json";
import promotionsVi from "./locales/pages/promotions.vi.json";
import promotionsEn from "./locales/pages/promotions.en.json";
import reportsVi from "./locales/pages/reports.vi.json";
import reportsEn from "./locales/pages/reports.en.json";
import staffsVi from "./locales/pages/staffs.vi.json";
import staffsEn from "./locales/pages/staffs.en.json";
import shopsVi from "./locales/pages/shops.vi.json";
import shopsEn from "./locales/pages/shops.en.json";
import accountsVi from "./locales/pages/accounts.vi.json";
import accountsEn from "./locales/pages/accounts.en.json";
import billingVi from "./locales/pages/billing.vi.json";
import billingEn from "./locales/pages/billing.en.json";
import posVi from "./locales/pages/pos.vi.json";
import posEn from "./locales/pages/pos.en.json";
import tablesVi from "./locales/pages/tables.vi.json";
import tablesEn from "./locales/pages/tables.en.json";

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
  contact: contactVi,
  orders: ordersVi,
  products: productsVi,
  customers: customersVi,
  branches: branchesVi,
  inventory: inventoryVi,
  promotions: promotionsVi,
  reports: reportsVi,
  staffs: staffsVi,
  shops: shopsVi,
  accounts: accountsVi,
  billing: billingVi,
  pos: posVi,
  tables: tablesVi,
};

const pagesEn = {
  storefront: storefrontEn,
  notifications: notificationsEn,
  support: supportEn,
  contact: contactEn,
  orders: ordersEn,
  products: productsEn,
  customers: customersEn,
  branches: branchesEn,
  inventory: inventoryEn,
  promotions: promotionsEn,
  reports: reportsEn,
  staffs: staffsEn,
  shops: shopsEn,
  accounts: accountsEn,
  billing: billingEn,
  pos: posEn,
  tables: tablesEn,
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
