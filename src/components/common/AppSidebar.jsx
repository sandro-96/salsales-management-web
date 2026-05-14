"use client";

import * as React from "react";
import {
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaSearch,
  FaQuestionCircle,
  FaShoppingCart,
} from "react-icons/fa";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { CreditCard } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { ShopSwitcher } from "../shop-switcher";
import SystemSupportContact from "@/components/common/SystemSupportContact.jsx";

export function AppSidebar({ navItems, ...props }) {
  const { logout, user } = useAuth();
  const { selectedShop, shops, selectedShopId } = useShop();
  const { t } = useTranslation();

  const userData = {
    name: user?.fullName || t("header.userMenu.fallbackName"),
    email: user?.email || t("header.userMenu.fallbackEmail"),
    avatar: user?.avatarUrl ? user.avatarUrl : null,
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarTrigger />
      {shops.length > 0 && (
        <SidebarHeader>
          <ShopSwitcher shops={shops} activeShop={selectedShop} />
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(({ to, icon: Icon, labelKey, label, onClick }) => {
            const text = labelKey ? t(labelKey) : label;
            return (
              <SidebarMenuItem key={to || text}>
                <SidebarMenuButton asChild onClick={onClick}>
                  <NavLink to={to || "#"} className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4" />}
                    {text}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
          {selectedShopId && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/pos" className="flex items-center gap-2">
                  <FaShoppingCart className="h-4 w-4" />
                  {t("nav.pos")}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/shops" className="flex items-center gap-2">
                <FaCog className="h-4 w-4" />
                {t("nav.shops")}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {selectedShopId && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink to="/billing" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {t("nav.billing")}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/search" className="flex items-center gap-2">
                <FaSearch className="h-4 w-4" />
                {t("nav.search")}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/help" className="flex items-center gap-2">
                <FaQuestionCircle className="h-4 w-4" />
                {t("nav.help")}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/accounts" className="flex items-center gap-2">
                <FaUserCircle className="h-4 w-4" />
                {userData.name}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="flex items-center gap-2"
            >
              <FaSignOutAlt className="h-4 w-4" />
              {t("nav.logout")}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-3">
          <SystemSupportContact compact />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
