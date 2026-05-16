/** Branch invoice locale: independent of UI language. */

export const INVOICE_LOCALES = ["vi", "en"];

export function normalizeInvoiceLocale(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  return v.startsWith("en") ? "en" : "vi";
}

/** @param {{ invoiceLocale?: string } | null | undefined} branch */
export function resolveInvoiceLocale(branch) {
  return normalizeInvoiceLocale(branch?.invoiceLocale);
}
