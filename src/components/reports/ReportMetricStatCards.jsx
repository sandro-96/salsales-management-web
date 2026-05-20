import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CARD_META = {
  orders: {
    iconClass:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    accentClass: "border-sky-500/40 bg-sky-500/[0.04] dark:bg-sky-500/[0.08]",
    valueClass: "text-sky-700 dark:text-sky-300",
  },
  products: {
    iconClass:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    accentClass:
      "border-violet-500/40 bg-violet-500/[0.04] dark:bg-violet-500/[0.08]",
    valueClass: "text-violet-700 dark:text-violet-300",
  },
  revenue: {
    iconClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    accentClass:
      "border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]",
    valueClass: "text-emerald-700 dark:text-emerald-300",
  },
  amount: {
    iconClass:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    accentClass: "border-teal-500/40 bg-teal-500/[0.04] dark:bg-teal-500/[0.08]",
    valueClass: "text-teal-700 dark:text-teal-300",
  },
  avg: {
    iconClass:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
    accentClass: "border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-500/[0.08]",
    valueClass: "text-amber-700 dark:text-amber-200",
  },
};

function MetricCard({
  cardKey,
  title,
  value,
  icon: Icon,
  description,
  hint,
  hintAria,
  loading,
}) {
  const meta = CARD_META[cardKey] ?? CARD_META.orders;

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-sm",
        meta.accentClass,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-1.5 space-y-0 p-2 sm:p-4 sm:pb-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <CardTitle className="truncate text-[10px] sm:text-sm font-medium text-muted-foreground leading-tight">
            {title}
          </CardTitle>
          {hint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="shrink-0 rounded-md text-muted-foreground outline-none ring-offset-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={hintAria}
                >
                  <Info className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-left leading-snug">
                {hint}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md sm:rounded-lg",
              meta.iconClass,
            )}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col px-2 pb-2 pt-0 sm:px-4 sm:pb-4">
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-16 sm:h-8 sm:w-24" />
            <Skeleton className="h-2.5 w-full sm:h-3" />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "text-lg sm:text-2xl font-bold tabular-nums tracking-tight leading-none",
                meta.valueClass,
              )}
            >
              {value}
            </div>
            {description ? (
              <p className="mt-1 line-clamp-2 text-[10px] sm:text-xs text-muted-foreground leading-snug">
                {description}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportMetricStatCards({ items, loading, hintAria }) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:gap-3 lg:grid-cols-5 lg:gap-4 items-stretch">
      {items.map((item) => (
        <MetricCard
          key={item.key}
          cardKey={item.key}
          title={item.title}
          value={item.value}
          icon={item.icon}
          description={item.description}
          hint={item.hint}
          hintAria={hintAria}
          loading={loading}
        />
      ))}
    </div>
  );
}
