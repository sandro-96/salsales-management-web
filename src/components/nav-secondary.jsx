"use client";
import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NavSecondary({ items, ...props }) {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentPath = window.location.pathname;

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.label}
              onClick={() => {
                navigate(item.to);
                if (isMobile) setOpenMobile(false);
              }}
              className={cn(
                "rounded-md",
                item.to === currentPath && "bg-accent text-accent-foreground"
              )}
            >
              <SidebarMenuButton>
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
