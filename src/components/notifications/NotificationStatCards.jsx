import { Bell, CheckCheck, MailOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_META = {
  __all__: {
    icon: Bell,
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    ringClass: "ring-primary/50 border-primary/30",
    activeBg: "bg-primary/[0.04]",
  },
  false: {
    icon: MailOpen,
    iconClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    ringClass: "ring-amber-500/50 border-amber-500/30",
    activeBg: "bg-amber-500/[0.06]",
  },
  true: {
    icon: CheckCheck,
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    ringClass: "ring-emerald-500/50 border-emerald-500/30",
    activeBg: "bg-emerald-500/[0.06]",
  },
};

function StatCard({
  filterKey,
  label,
  shortLabel,
  hint,
  value,
  active,
  loading,
  onSelect,
  numberLocale,
}) {
  const meta = CARD_META[filterKey] ?? CARD_META.__all__;
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
            "p-1.5 sm:p-3 lg:p-4 min-w-0",
            "flex flex-col items-center justify-center gap-0.5 text-center",
            "sm:flex-row sm:items-center sm:gap-2.5 sm:text-left",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg",
              meta.iconClass,
            )}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden />
          </div>
          <div className="min-w-0 w-full sm:flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-0.5 sm:items-start">
                <Skeleton className="h-2 w-8 sm:h-3 sm:w-16" />
                <Skeleton className="h-4 w-5 sm:h-6 sm:w-10" />
              </div>
            ) : (
              <>
                <p className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground leading-tight line-clamp-1 w-full">
                  <span className="sm:hidden">{shortLabel ?? label}</span>
                  <span className="hidden sm:inline">{label}</span>
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-bold tabular-nums tracking-tight leading-none">
                  {Number(value).toLocaleString(numberLocale)}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export function NotificationStatCards({
  stats,
  activeFilter,
  loading,
  onFilterChange,
  numberLocale,
}) {
  const { t } = useTranslation();

  const cards = [
    {
      key: "__all__",
      label: t("pages.notifications.statAll"),
      shortLabel: t("pages.notifications.statAllShort"),
      hint: t("pages.notifications.statAllHint"),
      value: stats.total,
    },
    {
      key: "false",
      label: t("pages.notifications.filterUnread"),
      shortLabel: t("pages.notifications.statUnreadShort"),
      hint: t("pages.notifications.statUnreadHint"),
      value: stats.unread,
    },
    {
      key: "true",
      label: t("pages.notifications.filterRead"),
      shortLabel: t("pages.notifications.statReadShort"),
      hint: t("pages.notifications.statReadHint"),
      value: stats.read,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-3 gap-1.5 sm:gap-2 lg:gap-3">
      {cards.map((card) => (
        <StatCard
          key={card.key}
          filterKey={card.key}
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
