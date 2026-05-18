import * as React from "react";
import {
  HelpCircleIcon,
  History,
  Home,
  PhoneIcon,
  Plus,
  StoreIcon,
  ShoppingCart,
  Table,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ShopSwitcher } from "./shop-switcher";
import { BranchSwitcher } from "./branch-switcher";
import { useShop } from "@/hooks/useShop";
import { useShopPermissions } from "@/hooks/useShopPermissions";
import { useNavOrderBadge } from "@/hooks/useNavOrderBadge";
import {
  ensureFnbTablesNav,
  filterNavByShopPermissions,
} from "@/utils/navPermissionMap";
import { groupNavItems } from "@/utils/navGroups";
import { PERM } from "@/constants/shopPermissions";
import { Button } from "@/components/ui/button";

const ZERO_SHOP_NAV = [
  { to: "/main", icon: Home, labelKey: "nav.home" },
  { to: "/history", icon: History, labelKey: "nav.history" },
  { to: "/shops", icon: StoreIcon, labelKey: "nav.shopsLabel" },
];

export function AppSidebar({ navItems, ...props }) {
  const navigate = useNavigate();
  const { shops, selectedShopId, selectedBranchId, selectedIndustry, isOwner } =
    useShop();
  const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } =
    useShopPermissions();
  const { t } = useTranslation();
  const permHelpers = React.useMemo(
    () => ({ hasShopPermission, hasAnyShopPermission, hasAllShopPermissions }),
    [hasShopPermission, hasAnyShopPermission, hasAllShopPermissions],
  );

  const canViewOrders = hasAnyShopPermission([
    PERM.ORDER_VIEW,
    PERM.ORDER_CREATE,
  ]);

  const orderBadge = useNavOrderBadge({
    shopId: selectedShopId,
    branchId: selectedBranchId,
    enabled: !!selectedShopId && canViewOrders,
  });

  const mainNavItems = React.useMemo(() => {
    let base = Array.isArray(navItems) ? navItems : [];
    if (selectedShopId && !base.some((item) => item.to === "/pos")) {
      base = [
        {
          to: "/pos",
          icon: ShoppingCart,
          labelKey: "nav.pos",
          requiredAny: [PERM.ORDER_CREATE],
        },
        ...base,
      ];
    }
    const canAccessTables =
      isOwner ||
      hasAnyShopPermission([
        PERM.TABLE_VIEW,
        PERM.TABLE_CREATE,
        PERM.TABLE_UPDATE,
      ]);

    let filtered = filterNavByShopPermissions(base, permHelpers, {
      skipFilter: isOwner,
    });

    filtered = ensureFnbTablesNav(filtered, {
      industry: selectedIndustry,
      canAccessTables,
      TableIcon: Table,
    });

    return filtered;
  }, [
    selectedShopId,
    selectedIndustry,
    isOwner,
    navItems,
    permHelpers,
    hasAnyShopPermission,
  ]);

  const { pinnedItem, navGroups } = React.useMemo(() => {
    const pos = mainNavItems.find((i) => i.to === "/pos") ?? null;
    const rest = mainNavItems
      .filter((i) => i.to !== "/pos")
      .map((i) =>
        i.to === "/orders" && orderBadge > 0
          ? { ...i, badge: orderBadge, badgeVariant: "warning" }
          : i,
      );
    const groups = groupNavItems(rest);
    return {
      pinnedItem: pos,
      navGroups: groups,
    };
  }, [mainNavItems, orderBadge]);

  const hasShops = shops.length > 0;

  const navSecondary = React.useMemo(() => {
    const items = [
      { labelKey: "nav.history", to: "/history", icon: History },
      { labelKey: "nav.shopsLabel", to: "/shops", icon: StoreIcon },
      { labelKey: "nav.contact", to: "/contact", icon: PhoneIcon },
      {
        labelKey: "nav.supportTickets",
        to: "/support",
        icon: HelpCircleIcon,
      },
    ];
    const zeroShopMainPaths = new Set(ZERO_SHOP_NAV.map((i) => i.to));
    return items.filter((i) => {
      if (i.allow === false) return false;
      if (!hasShops && zeroShopMainPaths.has(i.to)) return false;
      return true;
    });
  }, [hasShops]);

  const showGroupLabels = navGroups.length > 1;

  const zeroShopNavGroups = React.useMemo(
    () => [{ section: "other", items: ZERO_SHOP_NAV }],
    [],
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {hasShops ? (
        <SidebarHeader className="gap-1 border-b border-sidebar-border/60 pb-2">
          <ShopSwitcher />
          <BranchSwitcher />
        </SidebarHeader>
      ) : (
        <SidebarHeader className="gap-2 border-b border-sidebar-border/60 px-2 pb-3 pt-1">
          <div className="flex items-center gap-2 px-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
              <StoreIcon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">
                {t("sidebar.noShop.title")}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {t("sidebar.noShop.hint")}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="success"
            className="w-full"
            onClick={() => navigate("/shops/create")}
          >
            <Plus className="size-4" />
            {t("sidebar.noShop.create")}
          </Button>
        </SidebarHeader>
      )}
      <SidebarContent className="gap-0 overflow-y-auto">
        {!hasShops ? (
          <NavMain groups={zeroShopNavGroups} showGroupLabels={false} />
        ) : selectedShopId ? (
          <NavMain
            pinnedItem={pinnedItem}
            groups={navGroups}
            showGroupLabels={showGroupLabels}
          />
        ) : (
          <p className="px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            {t("nav.selectShopHint")}
          </p>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 pt-2">
        <NavSecondary items={navSecondary} groupLabel={t("nav.groupOther")} />
      </SidebarFooter>
    </Sidebar>
  );
}
