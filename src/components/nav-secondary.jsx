import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn, isActiveNavPath } from "@/lib/utils";

export function NavSecondary({ items, groupLabel, ...props }) {
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { t } = useTranslation();

  return (
    <SidebarGroup {...props}>
      {groupLabel ? (
        <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
          {groupLabel}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const to = item.to;
            if (!to) return null;
            const active = isActiveNavPath(pathname, to, item.end);
            const label = item.labelKey ? t(item.labelKey) : item.label;
            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton asChild isActive={active} tooltip={label}>
                  <NavLink
                    to={to}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (isMobile) setOpenMobile(false);
                    }}
                    className={cn(
                      "no-underline outline-none ring-sidebar-ring focus-visible:ring-2",
                    )}
                  >
                    <item.icon />
                    <span>{label}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
