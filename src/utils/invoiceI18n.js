import i18n from "@/i18n";
import { normalizeInvoiceLocale } from "./invoiceLocale";

/**
 * Fixed translator for POS receipt strings — uses branch invoice locale, not UI language.
 * @param {string} [invoiceLocale]
 * @returns {import('i18next').TFunction}
 */
export function getInvoiceT(invoiceLocale) {
  const lng = normalizeInvoiceLocale(invoiceLocale);
  return i18n.getFixedT(lng);
}
