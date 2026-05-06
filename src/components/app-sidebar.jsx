import * as React from "react";
import { HelpCircleIcon, StoreIcon, ShoppingCart } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ShopSwitcher } from "./shop-switcher";
import { BranchSwitcher } from "./branch-switcher";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { useShopPermissions } from "@/hooks/useShopPermissions";
import { filterNavByShopPermissions } from "@/utils/navPermissionMap";
import { PERM } from "@/constants/shopPermissions";

export function AppSidebar({ navItems, ...props }) {
  const { user } = useAuth();
  const { shops, selectedShopId, isOwner, shopRole } = useShop();
  const { hasShopPermission, hasAnyShopPermission, hasAllShopPermissions } =
    useShopPermissions();
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
          label: "Bán hàng",
          requiredAny: [PERM.ORDER_CREATE],
        },
        ...base,
      ];
    }
    return filterNavByShopPermissions(base, permHelpers);
  }, [selectedShopId, navItems, permHelpers]);

  const navSecondary = React.useMemo(() => {
    const items = [
      { label: "Shops", to: "/shops", icon: StoreIcon },
      {
        label: "Hỗ trợ",
        to: "/support",
        icon: HelpCircleIcon,
        // /support backend dùng @RequireRole (OWNER/MANAGER); ẩn với role khác.
        allow: isOwner || shopRole === "MANAGER" || !selectedShopId,
      },
    ];
    return items.filter((i) => i.allow !== false);
  }, [isOwner, shopRole, selectedShopId]);

  const userData = {
    name: user?.fullName || "Người dùng",
    email: user?.email || "email@example.com",
    avatar: user?.avatarUrl ? user.avatarUrl : null,
  };
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {shops.length > 0 && (
        <SidebarHeader>
          <ShopSwitcher />
          {/* <BranchSwitcher /> */}
        </SidebarHeader>
      )}
      <SidebarContent>
        <NavMain items={mainNavItems} />
        {/* <NavDocuments items={data.documents} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={navSecondary} />
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
