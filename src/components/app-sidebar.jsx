import * as React from "react";
import { HelpCircleIcon, StoreIcon } from "lucide-react";

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

export function AppSidebar({ navItems, ...props }) {
  const { user } = useAuth();
  const { shops } = useShop();

  const navSecondary = [
    {
      label: "Shops",
      to: "/shops",
      icon: StoreIcon,
    },
    {
      label: "Get Help",
      to: "/supports",
      icon: HelpCircleIcon,
    },
  ];

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
          <BranchSwitcher />
        </SidebarHeader>
      )}
      <SidebarContent>
        <NavMain items={navItems} />
        {/* <NavDocuments items={data.documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
