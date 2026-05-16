import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart3,
  ClipboardList,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useShopPermissions } from "@/hooks/useShopPermissions";
import { PERM } from "@/constants/shopPermissions";
import { cn } from "@/lib/utils";

const ACTIONS = [
  {
    key: "pos",
    to: "/pos",
    icon: ShoppingCart,
    labelKey: "overview.quickActions.pos",
    descKey: "overview.quickActions.posDesc",
    perms: [PERM.ORDER_CREATE],
    accent:
      "border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/35",
    iconCls: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "orders",
    to: "/orders",
    icon: ClipboardList,
    labelKey: "overview.quickActions.orders",
    descKey: "overview.quickActions.ordersDesc",
    perms: [PERM.ORDER_VIEW, PERM.ORDER_CREATE],
    accent:
      "border-sky-200/80 bg-sky-50/50 hover:bg-sky-50 dark:border-sky-900/40 dark:bg-sky-950/20 dark:hover:bg-sky-950/35",
    iconCls: "text-sky-600 dark:text-sky-400",
  },
  {
    key: "products",
    to: "/products",
    icon: Package,
    labelKey: "overview.quickActions.products",
    descKey: "overview.quickActions.productsDesc",
    perms: [PERM.PRODUCT_VIEW],
    accent:
      "border-violet-200/80 bg-violet-50/50 hover:bg-violet-50 dark:border-violet-900/40 dark:bg-violet-950/20 dark:hover:bg-violet-950/35",
    iconCls: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "reports",
    to: "/reports",
    icon: BarChart3,
    labelKey: "overview.quickActions.reports",
    descKey: "overview.quickActions.reportsDesc",
    perms: [PERM.REPORT_VIEW],
    accent:
      "border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/35",
    iconCls: "text-amber-600 dark:text-amber-400",
  },
];

export function OverviewQuickActions({ className }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hasAnyShopPermission } = useShopPermissions();

  const visible = ACTIONS.filter((a) => hasAnyShopPermission(a.perms));
  if (visible.length === 0) return null;

  return (
    <section
      className={cn("space-y-1.5 sm:space-y-2 min-w-0", className)}
      aria-label={t("overview.quickActions.title")}
    >
      <h2 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("overview.quickActions.title")}
      </h2>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3 min-w-0">
        {visible.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.key}
              className={cn(
                "cursor-pointer transition-colors shadow-sm min-w-0 py-0 gap-0",
                action.accent,
              )}
              onClick={() => navigate(action.to)}
            >
              <CardContent
                className={cn(
                  "p-2 sm:p-4 min-w-0",
                  "flex flex-col items-center justify-center gap-1 text-center",
                  "sm:items-stretch sm:justify-start sm:text-left sm:gap-2",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-md sm:rounded-lg bg-background/80 ring-1 ring-border/60",
                    action.iconCls,
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] sm:text-sm font-semibold leading-tight line-clamp-2">
                    {t(action.labelKey)}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 hidden sm:block">
                    {t(action.descKey)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
