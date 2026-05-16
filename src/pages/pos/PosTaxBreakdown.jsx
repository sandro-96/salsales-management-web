import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

import { posNumberLocale } from "../../utils/posHelpers";

export function PosTaxBreakdown({ loading, taxPreview }) {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);

  if (!loading && !taxPreview) return null;
  if (loading) {
    return (
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{t("pages.pos.tax.tax")}</span>
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          {t("pages.pos.tax.calculating")}
        </span>
      </div>
    );
  }
  const lines = taxPreview.taxes || [];
  return (
    <div className="space-y-1.5">
      {taxPreview.priceIncludesTax && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          {t("pages.pos.tax.priceIncludesTaxHint")}
        </p>
      )}
      {lines.map((line, idx) => (
        <div
          key={`${line.code}-${line.label}-${idx}`}
          className="flex justify-between items-center text-xs"
        >
          <span className="text-muted-foreground">
            {line.label || line.code || t("pages.pos.tax.fallbackTaxLabel")}
            {line.rate > 0 && line.rate <= 1 ? (
              <span className="opacity-80">
                {" "}
                ({(line.rate * 100).toLocaleString(numberLocale)}%)
              </span>
            ) : null}
          </span>
          <span className="tabular-nums font-medium">
            {line.amount.toLocaleString(numberLocale)} ₫
          </span>
        </div>
      ))}
      {lines.length === 0 && taxPreview.taxTotal === 0 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>{t("pages.pos.tax.tax")}</span>
          <span className="tabular-nums">{t("pages.pos.tax.zeroTax")}</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-1 border-t border-border/70">
        <span className="text-sm font-semibold">{t("pages.pos.tax.grandTotal")}</span>
        <span className="text-base font-bold text-primary tabular-nums">
          {taxPreview.grandTotal.toLocaleString(numberLocale)} ₫
        </span>
      </div>
    </div>
  );
}
