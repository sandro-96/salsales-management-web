import * as React from "react";
import { HelpCircleIcon, StoreIcon, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";

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
import { filterNavByShopPermissions } from "@/utils/navPermissionMap";
import { PERM } from "@/constants/shopPermissions";
import SystemSupportContact from "@/components/common/SystemSupportContact.jsx";

export function AppSidebar({ navItems, ...props }) {
  const { shops, selectedShopId } = useShop();
  const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } =
    useShopPermissions();
  const { t } = useTranslation();
  const permHelpers = React.useMemo(
    () => ({ hasShopPermission, hasAnyShopPermission, hasAllShopPermissions }),
    [hasShopPermission, hasAnyShopPermission, hasAllShopPermissions],
  );

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

  const navSecondary = React.useMemo(() => {
    const items = [
      { labelKey: "nav.shopsLabel", to: "/shops", icon: StoreIcon },
      {
        labelKey: "nav.support",
        to: "/support",
        icon: HelpCircleIcon,
      },
    ];
    return items.filter((i) => i.allow !== false);
  }, []);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {shops.length > 0 && (
        <SidebarHeader>
          <ShopSwitcher />
          {/* <BranchSwitcher /> */}
        </SidebarHeader>
      )}
      <SidebarContent>
        <NavMain items={mainNavItems} groupLabel={t("nav.groupMain")} />
        {/* <NavDocuments items={data.documents} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={navSecondary} groupLabel={t("nav.groupOther")} />
        <div className="mt-2">
          <SystemSupportContact compact />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
