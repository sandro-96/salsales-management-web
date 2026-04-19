import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LifeBuoy, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/common/NotificationBell";
import { getNotifications } from "@/api/notificationApi.js";

const NAV_ITEMS = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/admin/support",
    label: "Hỗ trợ",
    icon: LifeBuoy,
    badgeKey: "support",
  },
];

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { count: supportBadge } = useAdminSupportBadge();

  const badges = { support: supportBadge };

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r bg-background flex flex-col">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="font-bold tracking-tight">SalesApp Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, badgeKey }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {badgeKey && badges[badgeKey] > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                  {badges[badgeKey] > 99 ? "99+" : badges[badgeKey]}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        <Separator />

        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 border-b bg-background flex items-center gap-2 px-6">
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
