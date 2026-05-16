import {
  AlertTriangle,
  EyeOff,
  Package,
  PackageX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_META = {
  ALL: {
    icon: Package,
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    ringClass: "ring-primary/50 border-primary/30",
    activeBg: "bg-primary/[0.04]",
  },
  LOW_STOCK: {
    icon: AlertTriangle,
    iconClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    ringClass: "ring-amber-500/50 border-amber-500/30",
    activeBg: "bg-amber-500/[0.06]",
  },
  OUT_OF_STOCK: {
    icon: PackageX,
    iconClass:
      "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    ringClass: "ring-red-500/50 border-red-500/30",
    activeBg: "bg-red-500/[0.06]",
  },
  NOT_TRACKED: {
    icon: EyeOff,
    iconClass:
      "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
    ringClass: "ring-gray-400/50 border-gray-400/30",
    activeBg: "bg-muted/50",
  },
};

function StatCard({
  cardKey,
  label,
  hint,
  value,
  active,
  loading,
  onSelect,
  numberLocale,
}) {
  const meta = CARD_META[cardKey];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="cursor-pointer text-left w-full min-w-0"
      aria-pressed={active}
    >
      <Card
        className={cn(
          "h-full py-0 transition-all hover:shadow-sm",
          active
            ? cn("ring-2 shadow-sm", meta.ringClass, meta.activeBg)
            : "hover:bg-muted/30",
        )}
      >
        <CardContent
          className={cn(
            "p-2.5 sm:p-5 min-w-0",
            "flex flex-col items-center justify-center gap-1 text-center",
            "sm:flex-row sm:items-center sm:gap-3 sm:text-left",
          )}
        >
          <div
            className={cn(
              "flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl",
              meta.iconClass,
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div className="min-w-0 w-full sm:flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-1 sm:items-start">
                <Skeleton className="h-2.5 w-12 sm:h-3 sm:w-20" />
                <Skeleton className="h-6 w-8 sm:h-8 sm:w-12" />
                <Skeleton className="hidden sm:block h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate leading-tight">
                  {label}
                </p>
                <p className="text-xl sm:text-3xl font-bold tabular-nums tracking-tight leading-none mt-0.5">
                  {Number(value).toLocaleString(numberLocale)}
                </p>
                {hint ? (
                  <p className="hidden sm:block text-xs text-muted-foreground/90 mt-1 line-clamp-2 leading-snug">
                    {hint}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function InventoryStatCards({
  summary,
  activeFilter,
  loading,
  onFilterChange,
  numberLocale,
}) {
  const { t } = useTranslation();

  const totalProducts =
    (summary?.trackedProducts ?? 0) + (summary?.notTracked ?? 0);

  const cards = [
    {
      key: "ALL",
      label: t("pages.inventory.list.filterAll"),
      hint: t("pages.inventory.list.statAllHint", {
        stock: (summary?.totalStock ?? 0).toLocaleString(numberLocale),
      }),
      value: totalProducts,
    },
    {
      key: "LOW_STOCK",
      label: t("pages.inventory.list.statLowStock"),
      hint: t("pages.inventory.list.statLowStockHint"),
      value: summary?.lowStock ?? 0,
    },
    {
      key: "OUT_OF_STOCK",
      label: t("pages.inventory.list.statOutOfStock"),
      hint: t("pages.inventory.list.statOutOfStockHint"),
      value: summary?.outOfStock ?? 0,
    },
  ];

  if ((summary?.notTracked ?? 0) > 0) {
    cards.push({
      key: "NOT_TRACKED",
      label: t("pages.inventory.list.statNotTracked"),
      hint: t("pages.inventory.list.statNotTrackedHint"),
      value: summary.notTracked,
    });
  }

  return (
    <div
      className={cn(
        "grid gap-2 sm:gap-3 min-w-0",
        cards.length >= 4
          ? "grid-cols-2 lg:grid-cols-4"
          : "grid-cols-3",
      )}
    >
      {cards.map((card) => (
        <StatCard
          key={card.key}
          cardKey={card.key}
          label={card.label}
          hint={card.hint}
          value={card.value}
          active={activeFilter === card.key}
          loading={loading}
          numberLocale={numberLocale}
          onSelect={() => onFilterChange(card.key)}
        />
      ))}
    </div>
  );
}
