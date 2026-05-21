import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import RouteOutletSuspense from "@/components/routing/RouteOutletSuspense.jsx";
import {
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Building2,
  Users,
  Wallet,
  Package,
  Megaphone,
  ClipboardList,
  ShieldCheck,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/common/NotificationBell";
import ImpersonationBanner from "@/components/common/ImpersonationBanner";
import { getNotifications } from "@/api/notificationApi.js";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    end: true,
    requirePerm: ADMIN_PERM.DASHBOARD_VIEW,
  },
  {
    to: "/admin/shops",
    label: "Shops",
    icon: Building2,
    requirePerm: ADMIN_PERM.SHOP_VIEW,
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users,
    requirePerm: ADMIN_PERM.USER_VIEW,
  },
  {
    to: "/admin/billing",
    label: "Billing",
    icon: Wallet,
    requirePerm: ADMIN_PERM.BILLING_VIEW,
  },
  {
    to: "/admin/catalog",
    label: "Catalog",
    icon: Package,
    requirePerm: ADMIN_PERM.CATALOG_MANAGE,
  },
  {
    to: "/admin/broadcasts",
    label: "Broadcast",
    icon: Megaphone,
    requirePerm: ADMIN_PERM.BROADCAST_SEND,
  },
  {
    to: "/admin/audit",
    label: "Audit log",
    icon: ClipboardList,
    requirePerm: ADMIN_PERM.AUDIT_VIEW,
  },
  {
    to: "/admin/support",
    label: "Hỗ trợ",
    icon: LifeBuoy,
    badgeKey: "support",
    requirePerm: ADMIN_PERM.SUPPORT_VIEW,
  },
  {
    to: "/admin/security",
    label: "Bảo mật (2FA)",
    icon: ShieldCheck,
  },
];

/** Khớp menu admin với pathname (ổn định với RR7; NavLink isActive đôi khi sai với một số path). */
function adminNavPathActive(pathname, to, end) {
  const base = to === "/" ? "/" : to.replace(/\/$/, "");
  if (end) return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function AdminSidebarNavLink({
  to,
  label,
  end,
  badgeKey,
  badges,
  className,
  labelClassName,
}) {
  const { pathname } = useLocation();
  const active = adminNavPathActive(pathname, to, end);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        className,
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-muted",
      )}
    >
      <span
        className={["flex-1", labelClassName].filter(Boolean).join(" ")}
      >
        {label}
      </span>
      {badgeKey && badges[badgeKey] > 0 && (
        <Badge
          variant="destructive"
          className="h-5 px-1.5 text-[10px] shrink-0"
        >
          {badges[badgeKey] > 99 ? "99+" : badges[badgeKey]}
        </Badge>
      )}
    </Link>
  );
}

/**
 * Đếm nhanh số notification TICKET_* chưa đọc để hiện badge
 * trên sidebar admin. Fetch 30 notification gần nhất + lọc client-side.
 *
 * Không dùng STOMP subscribe ở đây (tránh duplicate với `NotificationBell` đã
 * subscribe cùng 1 topic `/topic/notifications/{userId}`); thay vào đó dựa
 * vào polling 60s + event `admin-support-badge-refresh` do Bell phát khi
 * nhận TICKET_* để cập nhật gần-realtime.
 */
function useAdminSupportBadge() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await getNotifications({ page: 0, size: 30, read: "false" });
      const data = res.data?.data;
      const list = data?.content ?? (Array.isArray(data) ? data : []);
      const next = list.filter(
        (n) =>
          !n.read &&
          (n.type === "TICKET_CREATED" || n.type === "TICKET_REPLIED"),
      ).length;
      setCount(next);
    } catch (err) {
      console.error("Fetch admin support badge error:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("admin-support-badge-refresh", handler);
    return () =>
      window.removeEventListener("admin-support-badge-refresh", handler);
  }, [refresh]);

  return { count, refresh };
}

const AdminLayout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: supportBadge } = useAdminSupportBadge();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const badges = { support: supportBadge };

  // Admin luôn thấy đủ menu; quyền sẽ thể hiện bằng UI (mờ) và route guard/back-end vẫn enforce.
  const visibleNav = NAV_ITEMS;

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30 flex-col">
      <ImpersonationBanner />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 border-r bg-background flex-col overflow-hidden">
          <div className="h-14 flex items-center px-5 border-b">
            <span className="coiny-regular text-2xl uppercase tracking-tight">
              {t("brand.appName")}
            </span>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {visibleNav.map(({ to, label, end, badgeKey }) => (
              <AdminSidebarNavLink
                key={to}
                to={to}
                label={label}
                end={end}
                badgeKey={badgeKey}
                badges={badges}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
              />
            ))}
          </nav>

          <Separator />

          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center gap-2 px-3 md:px-6">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Mở menu admin"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 gap-0">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="h-14 flex items-center px-5 border-b shrink-0">
                    <span className="text-2xl coiny-regular uppercase">
                      {t("brand.appName")}
                    </span>
                  </div>

                  <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
                    {visibleNav.map(({ to, label, end, badgeKey }) => (
                      <SheetClose asChild key={to}>
                        <AdminSidebarNavLink
                          to={to}
                          label={label}
                          end={end}
                          badgeKey={badgeKey}
                          badges={badges}
                          labelClassName="truncate"
                          className="w-full flex items-center gap-3 rounded-md px-3 h-10 text-sm transition-colors"
                        />
                      </SheetClose>
                    ))}
                  </nav>

                  <Separator />

                  <div className="p-3 shrink-0">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-10"
                        onClick={onLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2 shrink-0" />
                        Đăng xuất
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.email}
              </span>
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-y-auto">
            <RouteOutletSuspense />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
