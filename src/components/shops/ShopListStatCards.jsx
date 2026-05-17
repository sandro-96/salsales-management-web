import { CheckCircle2, Crown, Store, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_ICONS = {
  ALL: Store,
  ACTIVE: CheckCircle2,
  INACTIVE: XCircle,
  OWNER: Crown,
};

function StatCard({
  cardKey,
  label,
  shortLabel,
  hint,
  value,
  active,
  loading,
  onSelect,
  numberLocale,
}) {
  const Icon = CARD_ICONS[cardKey] ?? Store;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="cursor-pointer text-left w-full min-w-0"
      aria-pressed={active}
      title={hint || label}
    >
      <Card
        className={cn(
          "h-full py-0 transition-all hover:shadow-sm overflow-hidden",
          active
            ? "ring-2 ring-primary/40 bg-muted/30 shadow-sm"
            : "hover:bg-muted/30",
        )}
      >
        <CardContent
          className={cn(
            "p-1.5 sm:p-3 lg:p-5 min-w-0",
            "flex flex-col items-center justify-center gap-0.5 text-center",
            "lg:flex-row lg:items-center lg:gap-3 lg:text-left",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 sm:h-9 sm:w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-md sm:rounded-lg lg:rounded-xl bg-muted text-muted-foreground",
              active && "text-primary",
            )}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" aria-hidden />
          </div>
          <div className="min-w-0 w-full lg:flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-0.5 lg:items-start">
                <Skeleton className="h-2 w-8 lg:h-3 lg:w-20" />
                <Skeleton className="h-4 w-5 sm:h-6 sm:w-10 lg:h-8 lg:w-12" />
                <Skeleton className="hidden lg:block h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-[9px] sm:text-[11px] lg:text-xs font-medium text-muted-foreground leading-tight line-clamp-1 lg:line-clamp-none lg:truncate w-full">
                  <span className="lg:hidden">{shortLabel ?? label}</span>
                  <span className="hidden lg:inline">{label}</span>
                </p>
                <p className="text-base sm:text-xl lg:text-3xl font-bold tabular-nums tracking-tight leading-none">
                  {Number(value).toLocaleString(numberLocale)}
                </p>
                {hint ? (
                  <p className="hidden lg:block text-xs text-muted-foreground/90 mt-1 line-clamp-2 leading-snug">
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

export function ShopListStatCards({
  stats,
  activeFilter,
  loading,
  onFilterChange,
  numberLocale,
}) {
  const { t } = useTranslation();

  const cards = [
    {
      key: "ALL",
      label: t("pages.shops.list.filterAll"),
      shortLabel: t("pages.shops.list.filterAllShort"),
      hint: t("pages.shops.list.statAllHint"),
      value: stats.total,
    },
    {
      key: "ACTIVE",
      label: t("pages.shops.list.statActive"),
      shortLabel: t("pages.shops.list.statActiveShort"),
      hint: t("pages.shops.list.statActiveHint"),
      value: stats.active,
    },
    {
      key: "INACTIVE",
      label: t("pages.shops.list.statInactive"),
      shortLabel: t("pages.shops.list.statInactiveShort"),
      hint: t("pages.shops.list.statInactiveHint"),
      value: stats.inactive,
    },
    {
      key: "OWNER",
      label: t("pages.shops.list.statOwner"),
      shortLabel: t("pages.shops.list.statOwnerShort"),
      hint: t("pages.shops.list.statOwnerHint"),
      value: stats.owner,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-4 gap-1.5 sm:gap-2 lg:gap-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          cardKey={card.key}
          label={card.label}
          shortLabel={card.shortLabel}
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
