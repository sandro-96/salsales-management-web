import { Shield, UserCheck, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_META = {
  ALL: {
    icon: Users,
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    ringClass: "ring-primary/50 border-primary/30",
    activeBg: "bg-primary/[0.04]",
  },
  INTERNAL: {
    icon: UserCheck,
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    ringClass: "ring-emerald-500/50 border-emerald-500/30",
    activeBg: "bg-emerald-500/[0.06]",
  },
  EXTERNAL: {
    icon: UserPlus,
    iconClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    ringClass: "ring-violet-500/50 border-violet-500/30",
    activeBg: "bg-violet-500/[0.06]",
  },
  MANAGER: {
    icon: Shield,
    iconClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    ringClass: "ring-amber-500/50 border-amber-500/30",
    activeBg: "bg-amber-500/[0.06]",
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

export function StaffListStatCards({
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
      label: t("pages.staffs.list.filterAll"),
      shortLabel: t("pages.staffs.list.filterAllShort"),
      hint: t("pages.staffs.list.statAllHint"),
      value: stats.total,
    },
    {
      key: "INTERNAL",
      label: t("pages.staffs.list.statInternal"),
      shortLabel: t("pages.staffs.list.statInternalShort"),
      hint: t("pages.staffs.list.statInternalHint"),
      value: stats.internal,
    },
    {
      key: "EXTERNAL",
      label: t("pages.staffs.list.statExternal"),
      shortLabel: t("pages.staffs.list.statExternalShort"),
      hint: t("pages.staffs.list.statExternalHint"),
      value: stats.external,
    },
    {
      key: "MANAGER",
      label: t("pages.staffs.list.statManager"),
      shortLabel: t("pages.staffs.list.statManagerShort"),
      hint: t("pages.staffs.list.statManagerHint"),
      value: stats.manager,
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
