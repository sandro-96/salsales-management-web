import {
  CalendarClock,
  CalendarX,
  CirclePause,
  Tag,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_META = {
  ALL: {
    icon: Tag,
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    ringClass: "ring-primary/50 border-primary/30",
    activeBg: "bg-primary/[0.04]",
  },
  ACTIVE: {
    icon: Zap,
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    ringClass: "ring-emerald-500/50 border-emerald-500/30",
    activeBg: "bg-emerald-500/[0.06]",
  },
  UPCOMING: {
    icon: CalendarClock,
    iconClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    ringClass: "ring-sky-500/50 border-sky-500/30",
    activeBg: "bg-sky-500/[0.06]",
  },
  EXPIRED: {
    icon: CalendarX,
    iconClass:
      "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    ringClass: "ring-red-500/50 border-red-500/30",
    activeBg: "bg-red-500/[0.06]",
  },
  PAUSED: {
    icon: CirclePause,
    iconClass:
      "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300",
    ringClass: "ring-gray-400/50 border-gray-400/30",
    activeBg: "bg-muted/50",
  },
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
  const meta = CARD_META[cardKey];
  const Icon = meta.icon;

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
            ? cn("ring-2 shadow-sm", meta.ringClass, meta.activeBg)
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
              "flex h-6 w-6 sm:h-9 sm:w-9 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-md sm:rounded-lg lg:rounded-xl",
              meta.iconClass,
            )}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" aria-hidden />
          </div>
          <div className="min-w-0 w-full lg:flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-1 lg:items-start">
                <Skeleton className="h-2.5 w-12 lg:h-3 lg:w-20" />
                <Skeleton className="h-5 w-8 sm:h-6 sm:w-10 lg:h-8 lg:w-12" />
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

export function PromotionListStatCards({
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
      label: t("pages.promotions.list.filterAll"),
      shortLabel: t("pages.promotions.list.filterAllShort"),
      hint: t("pages.promotions.list.statAllHint"),
      value: stats.total,
    },
    {
      key: "ACTIVE",
      label: t("pages.promotions.list.statusActive"),
      shortLabel: t("pages.promotions.list.statusActiveShort"),
      hint: t("pages.promotions.list.statActiveHint"),
      value: stats.active,
    },
    {
      key: "UPCOMING",
      label: t("pages.promotions.list.statusUpcoming"),
      shortLabel: t("pages.promotions.list.statusUpcomingShort"),
      hint: t("pages.promotions.list.statUpcomingHint"),
      value: stats.upcoming,
    },
    {
      key: "EXPIRED",
      label: t("pages.promotions.list.statusExpired"),
      shortLabel: t("pages.promotions.list.statusExpiredShort"),
      hint: t("pages.promotions.list.statExpiredHint"),
      value: stats.expired,
    },
  ];

  if (stats.paused > 0) {
    cards.push({
      key: "PAUSED",
      label: t("pages.promotions.list.statusPaused"),
      shortLabel: t("pages.promotions.list.statusPausedShort"),
      hint: t("pages.promotions.list.statPausedHint"),
      value: stats.paused,
    });
  }

  return (
    <div
      className={cn(
        "grid min-w-0 gap-1.5 sm:gap-2 lg:gap-3",
        cards.length >= 5 ? "grid-cols-5" : "grid-cols-4",
      )}
    >
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
