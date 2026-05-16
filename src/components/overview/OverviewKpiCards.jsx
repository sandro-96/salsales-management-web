import { useTranslation } from "react-i18next";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const KPI_ITEMS = [
  {
    key: "revenue",
    titleKey: "overview.kpi.revenue",
    icon: DollarSign,
    accent:
      "border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/25 dark:to-card",
    iconWrap: "bg-emerald-500/15 ring-emerald-500/20",
    iconCls: "text-emerald-600 dark:text-emerald-400",
    getValue: (s, { formatCurrency }) => formatCurrency(s.totalRevenue),
    isCurrency: true,
  },
  {
    key: "orders",
    titleKey: "overview.kpi.orders",
    icon: ShoppingCart,
    accent:
      "border-sky-200/70 dark:border-sky-900/40 bg-gradient-to-br from-sky-50/80 to-card dark:from-sky-950/25 dark:to-card",
    iconWrap: "bg-sky-500/15 ring-sky-500/20",
    iconCls: "text-sky-600 dark:text-sky-400",
    getValue: (s, { formatNumber }) => formatNumber(s.totalOrders),
    isCurrency: false,
  },
  {
    key: "productsSold",
    titleKey: "overview.kpi.productsSold",
    icon: Package,
    accent:
      "border-violet-200/70 dark:border-violet-900/40 bg-gradient-to-br from-violet-50/80 to-card dark:from-violet-950/25 dark:to-card",
    iconWrap: "bg-violet-500/15 ring-violet-500/20",
    iconCls: "text-violet-600 dark:text-violet-400",
    getValue: (s, { formatNumber }) => formatNumber(s.totalProductsSold),
    isCurrency: false,
  },
  {
    key: "averageOrder",
    titleKey: "overview.kpi.averageOrder",
    icon: TrendingUp,
    accent:
      "border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/20 dark:to-card",
    iconWrap: "bg-amber-500/15 ring-amber-500/20",
    iconCls: "text-amber-600 dark:text-amber-400",
    getValue: (s, { formatCurrency }) => formatCurrency(s.averageOrderValue),
    isCurrency: true,
  },
];

function splitCurrencyDisplay(formatted) {
  if (typeof formatted !== "string") return null;
  if (formatted.endsWith(" VND")) {
    return { main: formatted.slice(0, -4), suffix: " VND" };
  }
  if (formatted.endsWith("đ")) {
    return { main: formatted.slice(0, -1), suffix: "đ" };
  }
  return null;
}

function KpiValue({ formatted, isCurrency }) {
  const parts = isCurrency ? splitCurrencyDisplay(formatted) : null;

  if (parts) {
    return (
      <span className="inline-flex items-baseline gap-0.5 max-w-full min-w-0 whitespace-nowrap">
        <span className="truncate">{parts.main}</span>
        <span className="shrink-0">{parts.suffix}</span>
      </span>
    );
  }

  return <span className="truncate">{formatted}</span>;
}

function KpiCard({ title, value, valueTitle, icon: Icon, accent, iconWrap, iconCls, footer, isCurrency }) {
  return (
    <Card className={cn("shadow-sm min-w-0 py-0 gap-0 overflow-hidden", accent)}>
      <CardContent className="p-2.5 sm:p-6 min-w-0">
        <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
          <p className="text-[10px] sm:text-sm font-medium text-muted-foreground leading-tight line-clamp-2 flex-1 min-w-0">
            {title}
          </p>
          <div
            className={cn(
              "rounded-md sm:rounded-lg p-1.5 sm:p-2 ring-1 shrink-0",
              iconWrap,
            )}
          >
            <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", iconCls)} aria-hidden />
          </div>
        </div>
        <div className="mt-1.5 sm:mt-3 min-w-0 overflow-hidden">
          <p
            className="text-base sm:text-2xl font-bold tabular-nums tracking-tight leading-tight max-w-full"
            title={valueTitle ?? (typeof value === "string" ? value : undefined)}
          >
            <KpiValue formatted={value} isCurrency={isCurrency} />
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate hidden sm:block">
            {footer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewKpiCards({
  summary,
  rangeLabel,
  formatCurrency,
  formatNumber,
  className,
}) {
  const { t } = useTranslation();
  const formatters = { formatCurrency, formatNumber };
  const footer = t("overview.kpi.during", { range: rangeLabel });

  return (
    <div className={cn("min-w-0", className)}>
      <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4 min-w-0">
        {KPI_ITEMS.map((item) => {
          const value = item.getValue(summary, formatters);
          return (
            <KpiCard
              key={item.key}
              title={t(item.titleKey)}
              value={value}
              valueTitle={value}
              icon={item.icon}
              accent={item.accent}
              iconWrap={item.iconWrap}
              iconCls={item.iconCls}
              footer={footer}
              isCurrency={item.isCurrency}
            />
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-1.5 sm:hidden">
        {footer}
      </p>
    </div>
  );
}
