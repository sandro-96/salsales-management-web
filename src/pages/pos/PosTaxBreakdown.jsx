import React from "react";
import { Loader2 } from "lucide-react";

export function PosTaxBreakdown({ loading, taxPreview }) {
  if (!loading && !taxPreview) return null;
  if (loading) {
    return (
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>Thuế</span>
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          Đang tính…
        </span>
      </div>
    );
  }
  const lines = taxPreview.taxes || [];
  return (
    <div className="space-y-1.5">
      {taxPreview.priceIncludesTax && (
        <p className="text-[10px] text-muted-foreground leading-snug">
          Giá món đang áp dạng đã bao gồm thuế (theo chính sách cửa hàng).
        </p>
      )}
      {lines.map((line, idx) => (
        <div
          key={`${line.code}-${line.label}-${idx}`}
          className="flex justify-between items-center text-xs"
        >
          <span className="text-muted-foreground">
            {line.label || line.code || "Thuế"}
            {line.rate > 0 && line.rate <= 1 ? (
              <span className="opacity-80">
                {" "}
                ({(line.rate * 100).toLocaleString("vi-VN")}%)
              </span>
            ) : null}
          </span>
          <span className="tabular-nums font-medium">
            {line.amount.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      ))}
      {lines.length === 0 && taxPreview.taxTotal === 0 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Thuế</span>
          <span className="tabular-nums">0 ₫</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-1 border-t border-border/70">
        <span className="text-sm font-semibold">Tổng thanh toán</span>
        <span className="text-base font-bold text-primary tabular-nums">
          {taxPreview.grandTotal.toLocaleString("vi-VN")} ₫
        </span>
      </div>
    </div>
  );
}
