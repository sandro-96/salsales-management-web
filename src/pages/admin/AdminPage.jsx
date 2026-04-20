// src/pages/admin/AdminPage.jsx
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  UserCog,
  LifeBuoy,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/loading/Loading";
import { getAdminDashboard } from "@/api/adminApi";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";

const SUBSCRIPTION_STATUS_COLORS = {
  TRIAL: "#0284c7",
  ACTIVE: "#16a34a",
  EXPIRED: "#dc2626",
  CANCELLED: "#64748b",
};

const formatVnd = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v || 0);

function Kpi({ icon: Icon, label, value, hint, tone = "default" }) {
  const toneCls =
    tone === "warn"
      ? "text-amber-600"
      : tone === "danger"
        ? "text-red-600"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-muted p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className={`text-xl font-semibold ${toneCls}`}>{value}</div>
            {hint && (
              <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const AdminPage = () => {
  const { hasAdminPermission, loading: permLoading } = useAdminPermissions();
  const canView = hasAdminPermission(ADMIN_PERM.DASHBOARD_VIEW);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (permLoading) return;
    if (!canView) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await getAdminDashboard();
        if (!cancelled && res.data?.success) setData(res.data.data);
      } catch (err) {
        if (!cancelled) toast.error("Không thể tải số liệu dashboard");
        console.error("admin dashboard error", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [permLoading, canView]);

  if (permLoading || loading) return <Loading />;

  if (!canView) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Tổng quan quản trị</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bạn không có quyền DASHBOARD_VIEW để xem số liệu tổng quan.
        </p>
      </div>
    );
  }

  const subscriptionData = data?.subscriptionStatusDistribution
    ? Object.entries(data.subscriptionStatusDistribution).map(([k, v]) => ({
        name: k,
        value: v,
        color: SUBSCRIPTION_STATUS_COLORS[k] || "#64748b",
      }))
    : [];

  const trendData =
    data?.newShopsTrend?.map((point, i) => ({
      date: point.date.slice(5), // MM-dd
      shops: point.count,
      users: data?.newUsersTrend?.[i]?.count ?? 0,
    })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tổng quan hệ thống</h1>
        <p className="text-sm text-muted-foreground">
          Cập nhật mỗi 60 giây · Số liệu cache ngắn hạn tại server.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Kpi
          icon={Building2}
          label="Tổng shop"
          value={data?.totalShops ?? 0}
          hint={`Đang hoạt động: ${data?.activeShops ?? 0}`}
        />
        <Kpi
          icon={Users}
          label="Tổng user"
          value={data?.totalUsers ?? 0}
          hint={`Mới trong tháng: ${data?.newUsersThisMonth ?? 0}`}
        />
        <Kpi
          icon={UserCog}
          label="Admin"
          value={data?.totalAdmins ?? 0}
          hint="Tài khoản có ROLE_ADMIN"
        />
        <Kpi
          icon={Wallet}
          label="MRR ước lượng"
          value={formatVnd(data?.mrrVnd)}
          hint="Doanh thu lặp lại hàng tháng"
        />
        <Kpi
          icon={LifeBuoy}
          label="Ticket đang mở"
          value={data?.openTickets ?? 0}
          tone={data?.openTickets > 0 ? "warn" : "default"}
        />
        <Kpi
          icon={AlertTriangle}
          label="Ticket ưu tiên cao"
          value={data?.urgentTickets ?? 0}
          tone={data?.urgentTickets > 0 ? "danger" : "default"}
          hint="HIGH + URGENT"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Phân bố subscription</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {subscriptionData.map((entry, i) => (
                    <Cell key={`c-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={24} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Shop / User mới 30 ngày</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis allowDecimals={false} fontSize={10} />
                <Tooltip />
                <Legend />
                <Bar dataKey="shops" name="Shops" fill="#2563eb" />
                <Bar dataKey="users" name="Users" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPage;
