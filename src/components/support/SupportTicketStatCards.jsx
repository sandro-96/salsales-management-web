import {
  CheckCircle2,
  CircleDot,
  Loader2,
  Ticket,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CARD_META = {
  __all__: {
    icon: Ticket,
    iconClass:
      "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary",
    ringClass: "ring-primary/50 border-primary/30",
    activeBg: "bg-primary/[0.04]",
  },
  OPEN: {
    icon: CircleDot,
    iconClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    ringClass: "ring-amber-500/50 border-amber-500/30",
    activeBg: "bg-amber-500/[0.06]",
  },
  IN_PROGRESS: {
    icon: Loader2,
    iconClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    ringClass: "ring-sky-500/50 border-sky-500/30",
    activeBg: "bg-sky-500/[0.06]",
  },
  RESOLVED: {
    icon: CheckCircle2,
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    ringClass: "ring-emerald-500/50 border-emerald-500/30",
    activeBg: "bg-emerald-500/[0.06]",
  },
  CLOSED: {
    icon: XCircle,
    iconClass:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    ringClass: "ring-slate-400/50 border-slate-400/30",
    activeBg: "bg-muted/40",
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
            "lg:flex-row lg:items-center lg:gap-2.5 lg:text-left",
          )}
        >
          <div
            className={cn(
              "flex h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 items-center justify-center rounded-md sm:rounded-lg",
              meta.iconClass,
            )}
          >
            <Icon className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5" aria-hidden />
          </div>
          <div className="min-w-0 w-full lg:flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center gap-0.5 lg:items-start">
                <Skeleton className="h-2 w-8 lg:h-3 lg:w-16" />
                <Skeleton className="h-4 w-5 sm:h-6 sm:w-10" />
              </div>
            ) : (
              <>
                <p className="text-[9px] sm:text-[10px] lg:text-xs font-medium text-muted-foreground leading-tight line-clamp-1 w-full">
                  <span className="lg:hidden">{shortLabel ?? label}</span>
                  <span className="hidden lg:inline">{label}</span>
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

export function SupportTicketStatCards({
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
      label: t("pages.support.list.statAll"),
      shortLabel: t("pages.support.list.statAllShort"),
      hint: t("pages.support.list.statAllHint"),
      value: stats.total,
    },
    {
      key: "OPEN",
      label: t("pages.support.ticketStatus.OPEN"),
      shortLabel: t("pages.support.list.statOpenShort"),
      hint: t("pages.support.list.statOpenHint"),
      value: stats.open,
    },
    {
      key: "IN_PROGRESS",
      label: t("pages.support.ticketStatus.IN_PROGRESS"),
      shortLabel: t("pages.support.list.statInProgressShort"),
      hint: t("pages.support.list.statInProgressHint"),
      value: stats.inProgress,
    },
    {
      key: "RESOLVED",
      label: t("pages.support.ticketStatus.RESOLVED"),
      shortLabel: t("pages.support.list.statResolvedShort"),
      hint: t("pages.support.list.statResolvedHint"),
      value: stats.resolved,
    },
    {
      key: "CLOSED",
      label: t("pages.support.ticketStatus.CLOSED"),
      shortLabel: t("pages.support.list.statClosedShort"),
      hint: t("pages.support.list.statClosedHint"),
      value: stats.closed,
    },
  ];

  return (
    <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5 lg:gap-3">
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
