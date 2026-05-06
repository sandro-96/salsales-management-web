import { MailIcon, PlusCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
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

export function NavMain({ items }) {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const currentPath = window.location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
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
              <SidebarMenuButton
                tooltip={item.label}
                className="cursor-pointer"
              >
                {item.icon && <item.icon />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
