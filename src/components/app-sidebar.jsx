import * as React from "react";
import {
  HelpCircleIcon,
  PhoneIcon,
  StoreIcon,
  ShoppingCart,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

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
import { filterNavByShopPermissions } from "@/utils/navPermissionMap";
import { groupNavItems } from "@/utils/navGroups";
import { PERM } from "@/constants/shopPermissions";
export function AppSidebar({ navItems, ...props }) {
  const { shops, selectedShopId, selectedBranchId } = useShop();
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
    return filterNavByShopPermissions(base, permHelpers);
  }, [selectedShopId, navItems, permHelpers]);

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

  const navSecondary = React.useMemo(() => {
    const items = [
      { labelKey: "nav.shopsLabel", to: "/shops", icon: StoreIcon },
      { labelKey: "nav.contact", to: "/contact", icon: PhoneIcon },
      {
        labelKey: "nav.supportTickets",
        to: "/support",
        icon: HelpCircleIcon,
      },
    ];
    return items.filter((i) => i.allow !== false);
  }, []);

  const showGroupLabels = navGroups.length > 1;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {shops.length > 0 ? (
        <SidebarHeader className="gap-1 border-b border-sidebar-border/60 pb-2">
          <ShopSwitcher />
          <BranchSwitcher />
        </SidebarHeader>
      ) : (
        <SidebarHeader className="border-b border-sidebar-border/60 pb-2">
          <Link
            to="/shops"
            className="flex items-center gap-2 px-2 py-1.5 text-sm font-semibold text-sidebar-foreground no-underline hover:text-sidebar-accent-foreground"
          >
            <StoreIcon className="h-4 w-4 shrink-0" />
            {t("nav.shopsLabel")}
          </Link>
        </SidebarHeader>
      )}
      <SidebarContent className="gap-0 overflow-y-auto">
        {selectedShopId ? (
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
