import { Badge } from "@/components/ui/badge";
import {
  Ban,
  CheckCircle2,
  Clock,
  CreditCard,
  Percent,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const ORDER_STATUS_META = {
  PENDING: {
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40",
    card: {
      header:
        "border-b-amber-200/70 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/10",
      footer:
        "border-t-amber-200/70 bg-amber-50/80 dark:border-amber-500/30 dark:bg-amber-500/10",
      inner:
        "border-amber-200/60 bg-amber-50/50 dark:border-amber-500/25 dark:bg-amber-500/5",
    },
  },
  CONFIRMED: {
    icon: CheckCircle2,
    cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/40",
    card: {
      header:
        "border-b-blue-200/70 bg-blue-50/90 dark:border-blue-500/30 dark:bg-blue-500/10",
      footer:
        "border-t-blue-200/70 bg-blue-50/80 dark:border-blue-500/30 dark:bg-blue-500/10",
      inner:
        "border-blue-200/60 bg-blue-50/50 dark:border-blue-500/25 dark:bg-blue-500/5",
    },
  },
  SHIPPING: {
    icon: Truck,
    cls: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:border-violet-500/40",
    card: {
      header:
        "border-b-violet-200/70 bg-violet-50/90 dark:border-violet-500/30 dark:bg-violet-500/10",
      footer:
        "border-t-violet-200/70 bg-violet-50/80 dark:border-violet-500/30 dark:bg-violet-500/10",
      inner:
        "border-violet-200/60 bg-violet-50/50 dark:border-violet-500/25 dark:bg-violet-500/5",
    },
  },
  COMPLETED: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40",
    card: {
      header:
        "border-b-emerald-200/70 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/10",
      footer:
        "border-t-emerald-200/70 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10",
      inner:
        "border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-500/25 dark:bg-emerald-500/5",
    },
  },
  CANCELLED: {
    icon: Ban,
    cls: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/15 dark:text-red-200 dark:border-red-500/40",
    card: {
      header:
        "border-b-red-200/60 bg-red-50/70 dark:border-red-500/25 dark:bg-red-500/10",
      footer:
        "border-t-red-200/60 bg-red-50/60 dark:border-red-500/25 dark:bg-red-500/10",
      inner:
        "border-red-200/50 bg-red-50/40 dark:border-red-500/20 dark:bg-red-500/5",
    },
  },
};

const DEFAULT_ORDER_CARD_ACCENT = {
  header: "border-b-border/60 bg-muted/30",
  footer: "border-t-border/60 bg-muted/20",
  inner: "border-border/80 bg-muted/20",
};

/** Status tint for list cards: header/footer/product strip only (not full card fill). */
export function orderStatusCardAccent(status) {
  return ORDER_STATUS_META[status]?.card ?? DEFAULT_ORDER_CARD_ACCENT;
}

export function displayOrderCode(order) {
  const code = order?.orderCode?.trim();
  if (code) return code;
  const id = order?.id;
  if (!id) return "—";
  return id.length > 10
    ? `DH-${id.slice(-8).toUpperCase()}`
    : String(id).toUpperCase();
}

export function shortId(id) {
  if (!id) return "";
  const s = String(id);
  return s.length > 10 ? s.slice(-8).toUpperCase() : s.toUpperCase();
}

export function orderHasGuestInfo(order) {
  return !!(order?.guestName?.trim() || order?.guestPhone?.trim());
}

export function orderHasCrmCustomerInfo(order) {
  return !!(
    order?.customerName?.trim() ||
    order?.customerPhone?.trim() ||
    order?.customerId
  );
}

export function OrderStatusBadge({ status }) {
  const { t } = useTranslation();
  const cfg = ORDER_STATUS_META[status] || { icon: Clock, cls: "" };
  const IconComp = cfg.icon;
  const label = t(`pages.orders.status.${status}`, { defaultValue: status });
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {label}
    </Badge>
  );
}

export function PaymentCollectionBadge({ paid, paymentStatus }) {
  const { t } = useTranslation();
  if (paid) {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40">
        <CreditCard className="h-3 w-3" /> {t("pages.orders.payment.paid")}
      </Badge>
    );
  }
  if (paymentStatus === "PENDING_COLLECTION") {
    return (
      <Badge className="gap-1 text-[11px] bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40">
        <Truck className="h-3 w-3" /> {t("pages.orders.payment.pendingCod")}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px] gap-1">
      {t("pages.orders.payment.unpaid")}
    </Badge>
  );
}

export function orderHasPositiveTax(tax) {
  if (!tax) return false;
  const total = tax.taxTotal ?? 0;
  if (total > 0.005) return true;
  return (tax.taxes || []).some((l) => (l.amount ?? 0) > 0.005);
}

export function fmtVndInt(v, locale = "vi-VN") {
  if (v == null) return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString(locale) + " ₫";
}

export function orderTaxSummaryTooltip(order, tr, locale = "vi-VN") {
  const tax = order.taxSnapshot;
  if (!tax) {
    return tr("pages.orders.tax.noSnapshotLong");
  }
  const lines = [
    tax.priceIncludesTax
      ? tr("pages.orders.tax.policyIncludes")
      : tr("pages.orders.tax.policyExcludes"),
    tr("pages.orders.tax.subtotalBase", {
      amount: fmtVndInt(tax.netAmount ?? 0, locale),
    }),
  ];
  if (orderHasPositiveTax(tax)) {
    lines.push(
      tr("pages.orders.tax.taxTotal", {
        amount: fmtVndInt(tax.taxTotal ?? 0, locale),
      }),
    );
    (tax.taxes || []).forEach((x) => {
      if ((x.amount ?? 0) > 0.005) {
        lines.push(
          tr("pages.orders.tax.taxLine", {
            label: x.label,
            amount: fmtVndInt(x.amount ?? 0, locale),
          }),
        );
      }
    });
  } else {
    lines.push(tr("pages.orders.tax.noTaxOnOrder"));
  }
  lines.push(
    tr("pages.orders.tax.grandTotal", {
      amount: fmtVndInt(tax.grandTotal ?? order.totalPrice ?? 0, locale),
    }),
  );
  return lines.join("\n");
}

export function OrderTaxBadge({ order }) {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const tax = order.taxSnapshot;
  if (!tax) {
    return (
      <span
        className="text-[11px] text-muted-foreground tabular-nums"
        title={t("pages.orders.tax.noSnapshotTitle")}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        —
      </span>
    );
  }
  const has = orderHasPositiveTax(tax);
  return (
    <Badge
      variant={has ? "default" : "secondary"}
      className={
        has
          ? "text-[10px] gap-0.5 font-normal bg-sky-600 text-white hover:bg-sky-600/90 border-0 cursor-help"
          : "text-[10px] font-normal cursor-help"
      }
      title={orderTaxSummaryTooltip(order, t, numberLocale)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Percent className="h-3 w-3 opacity-90" />
      {has ? t("pages.orders.tax.hasTax") : t("pages.orders.tax.noTax")}
    </Badge>
  );
}

export function orderCustomerLabel(order, t) {
  const crm = [order.customerName?.trim(), order.customerPhone?.trim()]
    .filter(Boolean)
    .join(" · ");
  const guest = [order.guestName?.trim(), order.guestPhone?.trim()]
    .filter(Boolean)
    .join(" · ");
  if (!crm && !guest) return null;
  if (crm && guest) {
    return { primary: crm, secondary: `${t("pages.orders.list.posGuestPrefix")}${guest}` };
  }
  if (crm) return { primary: crm, secondary: null };
  return { primary: guest, secondary: null };
}

export function orderTotalAmount(order) {
  return order.taxSnapshot?.grandTotal ?? order.totalPrice ?? 0;
}

export function orderItemQty(order) {
  const items = order.items ?? [];
  return items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
}
