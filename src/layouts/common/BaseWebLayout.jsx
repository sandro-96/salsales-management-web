import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const BaseWebLayout = ({ title, navItems }) => {
  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      }}
    >
      <AppSidebar variant="inset" navItems={navItems} />
      <SidebarInset>
        <SiteHeader title={title} />
        <div className="flex flex-1 flex-col min-w-0">
          <div className="@container/main flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex h-full min-w-0 max-w-full flex-col gap-4 md:gap-6">
              <Outlet />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BaseWebLayout;
