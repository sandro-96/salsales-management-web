"use client";

import * as React from "react";
import {
  FaCog,
  FaUserCircle,
  FaSignOutAlt,
  FaSearch,
  FaQuestionCircle,
  FaFolder,
  FaChartBar,
  FaTachometerAlt,
  FaUsers,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useShop } from "@/hooks/useShop";
import { ShopSwitcher } from "../shop-switcher";

export function AppSidebar({ navItems, ...props }) {
  const { logout, user } = useAuth();
  const { selectedShop, shops, setSelectedShop } = useShop();

  console.log("selectedShop", selectedShop);

  const userData = {
    name: user?.fullName || "Người dùng",
    email: user?.email || "email@example.com",
    avatar: user?.avatarUrl
      ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${
          user.avatarUrl
        }`
      : null,
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarTrigger />
      <SidebarHeader>
        <ShopSwitcher shops={shops} activeShop={selectedShop} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map(({ to, icon: Icon, label, onClick }) => (
            <SidebarMenuItem key={to || label}>
              <SidebarMenuButton asChild onClick={onClick}>
                <NavLink to={to || "#"} className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarMenu className="mt-auto">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/shops" className="flex items-center gap-2">
                <FaCog className="h-4 w-4" />
                Cửa hàng
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/search" className="flex items-center gap-2">
                <FaSearch className="h-4 w-4" />
                Tìm kiếm
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink to="/help" className="flex items-center gap-2">
                <FaQuestionCircle className="h-4 w-4" />
                Trợ giúp
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
              Đăng xuất
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
