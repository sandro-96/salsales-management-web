import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Breadcrumbs from "./Breadcrumbs";
import NotificationBell from "./common/NotificationBell";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import HeaderUserMenu from "@/components/common/HeaderUserMenu.jsx";

export function SiteHeader() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear relative z-20 bg-background">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumbs />
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mr-1"
            aria-label="Đổi chế độ sáng/tối"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <NotificationBell />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
