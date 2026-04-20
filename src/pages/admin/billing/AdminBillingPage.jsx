// src/pages/admin/billing/AdminBillingPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Clock,
  CreditCard,
  Wallet,
  Hourglass,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import {
  getAdminBillingOverview,
  listAdminPaymentTransactions,
  listAdminSubscriptions,
  resolveAdminPaymentTransaction,
  resyncAdminPaymentTransaction,
} from "@/api/adminApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const ACTION_OPTIONS = [
  "PAYMENT",
  "PAYMENT_FAILED",
  "ADMIN_EXTEND",
  "ADMIN_OVERRIDE",
  "TRIAL_EXPIRED",
  "PERIOD_EXPIRED",
  "CANCELLED",
];

const TXN_STATUS_OPTIONS = ["PENDING", "SUCCESS", "FAILED", "CANCELLED"];
const GATEWAY_OPTIONS = ["VNPAY", "MOMO", "MANUAL"];

function txnStatusBadge(status) {
  const cls =
    status === "SUCCESS"
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      : status === "PENDING"
        ? "bg-sky-100 text-sky-800 hover:bg-sky-100"
        : status === "FAILED"
          ? "bg-red-100 text-red-800 hover:bg-red-100"
          : "bg-slate-200 text-slate-700 hover:bg-slate-200";
  return <Badge className={cls}>{status || "—"}</Badge>;
}

const formatVnd = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v || 0);

const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return d;
  }
};

function Kpi({ icon: Icon, label, value, tone = "default" }) {
  const toneCls =
    tone === "warn"
      ? "text-amber-600"
      : tone === "danger"
        ? "text-red-600"
        : tone === "info"
          ? "text-sky-700"
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function actionBadge(action) {
  const cls =
    action === "PAYMENT" || action === "ADMIN_EXTEND"
      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
      : action === "PAYMENT_FAILED" ||
          action === "TRIAL_EXPIRED" ||
          action === "PERIOD_EXPIRED" ||
          action === "CANCELLED"
        ? "bg-red-100 text-red-800 hover:bg-red-100"
        : "bg-slate-200 text-slate-700 hover:bg-slate-200";
  return <Badge className={cls}>{action}</Badge>;
}

export default function AdminBillingPage() {
  const navigate = useNavigate();
  const { hasAdminPermission, loading: permLoading } = useAdminPermissions();
  const canView = hasAdminPermission(ADMIN_PERM.BILLING_VIEW);

  const [sp, setSp] = useSearchParams();
  const months = Number(sp.get("months") || 6);
  const page = Number(sp.get("page") || 0);
  const size = 20;
  const shopId = sp.get("shopId") || "";
  const actionType = sp.get("actionType") || "all";

  const tab = sp.get("tab") || "subscriptions";
  const txnStatus = sp.get("txnStatus") || "all";
  const txnGateway = sp.get("txnGateway") || "all";

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [subs, setSubs] = useState({ content: [], totalElements: 0 });
  const [subsLoading, setSubsLoading] = useState(true);
  const [txns, setTxns] = useState({ content: [], totalElements: 0 });
  const [txnsLoading, setTxnsLoading] = useState(true);
  const [keyword, setKeyword] = useState(shopId);

  // Resolve PENDING txn (manual admin action).
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveStatus, setResolveStatus] = useState("CANCELLED");
  const [resolveReason, setResolveReason] = useState("");
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Resync with gateway — track per-row loading state by txn id.
  const [resyncingId, setResyncingId] = useState(null);
  const canManage = hasAdminPermission(ADMIN_PERM.BILLING_MANAGE);

  const handleResync = async (txnId) => {
    if (!txnId || resyncingId) return;
    setResyncingId(txnId);
    try {
      const res = await resyncAdminPaymentTransaction(txnId);
      const data = res.data?.data;
      if (!data) {
        toast.error("Gateway không trả dữ liệu");
        return;
      }
      const status = data.gatewayStatus;
      const msg = data.gatewayMessage || status;
      if (status === "SUCCESS" && data.applied) {
        toast.success(`Gateway xác nhận SUCCESS — đã ghi nhận thanh toán. ${msg}`);
      } else if (status === "FAILED" && data.applied) {
        toast.success(`Gateway báo FAILED — đã đóng txn. ${msg}`);
      } else if (status === "PENDING") {
        toast.info(`Gateway vẫn PENDING — chưa update. ${msg}`);
      } else {
        toast.warning(`Không resync được (${status}): ${msg}`);
      }
      // Reload để thấy trạng thái mới.
      loadTxns();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không gọi được gateway query API",
      );
    } finally {
      setResyncingId(null);
    }
  };

  const loadOverview = useCallback(async () => {
    if (!canView) return;
    setOverviewLoading(true);
    try {
      const res = await getAdminBillingOverview({ months });
      if (res.data?.success) setOverview(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được dữ liệu billing");
    } finally {
      setOverviewLoading(false);
    }
  }, [canView, months]);

  const loadSubs = useCallback(async () => {
    if (!canView || tab !== "subscriptions") return;
    setSubsLoading(true);
    try {
      const params = { page, size, sort: "createdAt,desc" };
      if (shopId) params.shopId = shopId;
      if (actionType !== "all") params.actionType = actionType;
      const res = await listAdminSubscriptions(params);
      if (res.data?.success) setSubs(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được lịch sử subscription");
    } finally {
      setSubsLoading(false);
    }
  }, [canView, tab, page, shopId, actionType]);

  const loadTxns = useCallback(async () => {
    if (!canView || tab !== "transactions") return;
    setTxnsLoading(true);
    try {
      const params = { page, size, sort: "createdAt,desc" };
      if (shopId) params.shopId = shopId;
      if (txnStatus !== "all") params.status = txnStatus;
      if (txnGateway !== "all") params.gateway = txnGateway;
      const res = await listAdminPaymentTransactions(params);
      if (res.data?.success) setTxns(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được payment transactions");
    } finally {
      setTxnsLoading(false);
    }
  }, [canView, tab, page, shopId, txnStatus, txnGateway]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadSubs();
  }, [loadSubs]);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  const mrrChart = useMemo(() => {
    if (!overview) return [];
    const trend = overview.mrrTrend || [];
    const subsTrend = overview.newSubscriptions || [];
    const renewals = overview.renewals || [];
    return trend.map((p, i) => ({
      month: p.month,
      mrr: p.value,
      newSubs: subsTrend[i]?.value ?? 0,
      renewals: renewals[i]?.value ?? 0,
    }));
  }, [overview]);

  const statusDistribution = overview?.subscriptionStatusDistribution || {};

  const updateParam = (key, val) => {
    const n = new URLSearchParams(sp);
    if (val && val !== "all") n.set(key, val);
    else n.delete(key);
    n.set("page", "0");
    setSp(n);
  };

  const currentList = tab === "transactions" ? txns : subs;
  const totalPages = Math.max(1, Math.ceil((currentList.totalElements || 0) / size));
  const changeTab = (v) => {
    const n = new URLSearchParams(sp);
    n.set("tab", v);
    n.set("page", "0");
    setSp(n);
  };

  if (permLoading) return <Loading />;
  if (!canView) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bạn không có quyền BILLING_VIEW.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Billing &amp; Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Mô hình mới: TRIAL 30 ngày → BASIC 99.000đ/tháng. Cache server 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Khoảng</label>
          <Select
            value={String(months)}
            onValueChange={(v) => {
              const n = new URLSearchParams(sp);
              n.set("months", v);
              setSp(n);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[3, 6, 12, 24].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} tháng
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {overviewLoading ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi
              icon={Wallet}
              label="MRR ước tính"
              value={formatVnd(overview?.mrrVnd)}
            />
            <Kpi
              icon={CreditCard}
              label="Shop ACTIVE (đang trả phí)"
              value={overview?.activePaidShops ?? 0}
            />
            <Kpi
              icon={Hourglass}
              label="Đang dùng thử (TRIAL)"
              value={overview?.trialShops ?? 0}
              tone="info"
            />
            <Kpi
              icon={Clock}
              label="Sắp hết hạn (7 ngày)"
              value={overview?.expiringIn7Days ?? 0}
              tone={overview?.expiringIn7Days > 0 ? "warn" : "default"}
            />
            <Kpi
              icon={AlertTriangle}
              label="Đã hết hạn chưa gia hạn"
              value={overview?.expiredUnrenewed ?? 0}
              tone={overview?.expiredUnrenewed > 0 ? "danger" : "default"}
            />
            <StatusCard label="Phân bố subscription" dist={statusDistribution} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Doanh thu ghi nhận theo tháng (VND)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mrrChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis
                      fontSize={10}
                      tickFormatter={(v) => (v / 1_000_000).toFixed(1) + "tr"}
                    />
                    <Tooltip formatter={(v) => formatVnd(v)} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mrr"
                      name="Doanh thu ghi nhận"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Subscription mới / gia hạn
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mrrChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={10} />
                    <YAxis allowDecimals={false} fontSize={10} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newSubs" name="Mới" fill="#16a34a" />
                    <Bar dataKey="renewals" name="Gia hạn" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Tabs value={tab} onValueChange={changeTab} className="space-y-3">
        <TabsList>
          <TabsTrigger value="subscriptions">Lịch sử subscription</TabsTrigger>
          <TabsTrigger value="transactions">Giao dịch gateway</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="space-y-3">
          <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Shop ID</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Filter theo shop id"
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    updateParam("shopId", keyword.trim());
                }}
              />
            </div>
            <div className="w-full md:w-56">
              <label className="text-xs text-muted-foreground">
                Action type
              </label>
              <Select
                value={actionType}
                onValueChange={(v) => updateParam("actionType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => updateParam("shopId", keyword.trim())}>
              Lọc
            </Button>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead>Giao dịch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subsLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải…
                    </TableCell>
                  </TableRow>
                )}
                {!subsLoading && subs.content?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không có giao dịch phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!subsLoading &&
                  subs.content?.map((h) => (
                    <TableRow
                      key={h.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        h.shopId && navigate(`/admin/shops/${h.shopId}`)
                      }
                    >
                      <TableCell>{fmtDate(h.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{h.shopName || "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {h.shopId}
                        </div>
                      </TableCell>
                      <TableCell>{actionBadge(h.actionType)}</TableCell>
                      <TableCell>
                        {h.durationMonths ? `${h.durationMonths} tháng` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {h.paymentMethod || "—"}
                        {h.transactionId ? (
                          <div className="font-mono text-muted-foreground">
                            {h.transactionId}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-3">
          <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Shop ID</label>
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Filter theo shop id"
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    updateParam("shopId", keyword.trim());
                }}
              />
            </div>
            <div className="w-full md:w-40">
              <label className="text-xs text-muted-foreground">Trạng thái</label>
              <Select
                value={txnStatus}
                onValueChange={(v) => updateParam("txnStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {TXN_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-40">
              <label className="text-xs text-muted-foreground">Gateway</label>
              <Select
                value={txnGateway}
                onValueChange={(v) => updateParam("txnGateway", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {GATEWAY_OPTIONS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => updateParam("shopId", keyword.trim())}>
              Lọc
            </Button>
          </Card>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Mã gateway</TableHead>
                  {canManage && <TableHead className="w-[180px]">Thao tác</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {txnsLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 7 : 6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Đang tải…
                    </TableCell>
                  </TableRow>
                )}
                {!txnsLoading && txns.content?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canManage ? 7 : 6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không có giao dịch phù hợp.
                    </TableCell>
                  </TableRow>
                )}
                {!txnsLoading &&
                  txns.content?.map((t) => (
                    <TableRow
                      key={t.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        t.shopId && navigate(`/admin/shops/${t.shopId}`)
                      }
                    >
                      <TableCell>
                        <div>{fmtDate(t.createdAt)}</div>
                        {t.completedAt ? (
                          <div className="text-[10px] text-muted-foreground">
                            Hoàn tất {fmtDate(t.completedAt)}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{t.shopName || "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {t.shopId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.gateway}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatVnd(t.amountVnd)}
                      </TableCell>
                      <TableCell>
                        {txnStatusBadge(t.status)}
                        {t.failureReason ? (
                          <div className="text-[10px] text-red-600 max-w-[180px] truncate">
                            {t.failureReason}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-mono">{t.providerTxnRef}</div>
                        {t.providerTransNo ? (
                          <div className="font-mono text-muted-foreground">
                            {t.providerTransNo}
                          </div>
                        ) : null}
                      </TableCell>
                      {canManage && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {t.status === "PENDING" ? (
                            <div className="flex flex-wrap gap-1">
                              {t.gateway !== "MANUAL" && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  disabled={resyncingId === t.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleResync(t.id);
                                  }}
                                  title="Gọi gateway để tra trạng thái thực tế"
                                >
                                  {resyncingId === t.id ? "Đang…" : "Resync"}
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setResolveTarget(t);
                                  setResolveStatus("CANCELLED");
                                  setResolveReason("");
                                }}
                              >
                                Resolve
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">
          Trang {page + 1} / {totalPages} · Tổng {currentList.totalElements || 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page - 1));
            setSp(n);
          }}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page + 1));
            setSp(n);
          }}
        >
          Sau
        </Button>
      </div>

      <Dialog
        open={!!resolveTarget}
        onOpenChange={(v) => {
          if (!v && !resolveSubmitting) {
            setResolveTarget(null);
            setResolveReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đánh dấu giao dịch đã giải quyết</DialogTitle>
            <DialogDescription>
              Chỉ dùng khi txn PENDING đã treo lâu và chắc chắn không được
              gateway confirm. Nếu cần bù thời hạn, hãy dùng "Gia hạn shop" —
              không thể set SUCCESS thủ công ở đây.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-md border p-3 bg-muted/40 text-xs space-y-1">
              <div>
                <span className="text-muted-foreground">Ref: </span>
                <span className="font-mono">{resolveTarget?.providerTxnRef}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Shop: </span>
                {resolveTarget?.shopName || resolveTarget?.shopId}
              </div>
              <div>
                <span className="text-muted-foreground">Gateway: </span>
                {resolveTarget?.gateway} · {formatVnd(resolveTarget?.amountVnd)}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Trạng thái mới</label>
              <Select value={resolveStatus} onValueChange={setResolveStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">
                Lý do (bắt buộc)
              </label>
              <Textarea
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                placeholder="Ví dụ: Shop xác nhận không thanh toán, gateway không trả IPN sau 24h…"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              disabled={resolveSubmitting}
              onClick={() => {
                setResolveTarget(null);
                setResolveReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              disabled={
                resolveSubmitting ||
                !resolveReason.trim() ||
                !resolveTarget?.id
              }
              onClick={async () => {
                setResolveSubmitting(true);
                try {
                  await resolveAdminPaymentTransaction(resolveTarget.id, {
                    status: resolveStatus,
                    reason: resolveReason.trim(),
                  });
                  toast.success("Đã cập nhật trạng thái giao dịch");
                  setResolveTarget(null);
                  setResolveReason("");
                  loadTxns();
                } catch (err) {
                  toast.error(
                    err.response?.data?.message ||
                      "Không cập nhật được giao dịch",
                  );
                } finally {
                  setResolveSubmitting(false);
                }
              }}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusCard({ label, dist }) {
  const entries = Object.entries(dist || {});
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        {entries.length === 0 ? (
          <div className="text-sm text-muted-foreground">—</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {entries.map(([k, v]) => (
              <Badge
                key={k}
                variant="outline"
                className="text-xs font-normal tabular-nums"
              >
                {k}: {v}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
