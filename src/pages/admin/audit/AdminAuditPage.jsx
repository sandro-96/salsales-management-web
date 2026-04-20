// src/pages/admin/audit/AdminAuditPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import { listAdminAuditLogs } from "@/api/adminApi";

const fmt = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm:ss", { locale: vi });
  } catch {
    return d;
  }
};

const statusBadge = (s) => {
  if (s === "SUCCESS") return <Badge variant="secondary">SUCCESS</Badge>;
  if (s === "FAIL") return <Badge variant="destructive">FAIL</Badge>;
  return <Badge variant="outline">{s || "—"}</Badge>;
};

export default function AdminAuditPage() {
  const { hasAdminPermission, loading: permLoading } = useAdminPermissions();
  const canView = hasAdminPermission(ADMIN_PERM.AUDIT_VIEW);

  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") || 0);
  const size = 25;

  const [filters, setFilters] = useState({
    actorId: sp.get("actorId") || "",
    resource: sp.get("resource") || "",
    action: sp.get("action") || "",
    targetId: sp.get("targetId") || "",
  });

  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = { page, size, sort: "createdAt,desc" };
      for (const k of ["actorId", "resource", "action", "targetId"]) {
        const v = sp.get(k);
        if (v) params[k] = v;
      }
      const res = await listAdminAuditLogs(params);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được audit log");
    } finally {
      setLoading(false);
    }
  }, [canView, page, sp]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = () => {
    const n = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v && v.trim()) n.set(k, v.trim());
    }
    n.set("page", "0");
    setSp(n);
  };

  const onReset = () => {
    setFilters({ actorId: "", resource: "", action: "", targetId: "" });
    setSp(new URLSearchParams());
  };

  const totalPages = Math.max(1, Math.ceil((data.totalElements || 0) / size));

  if (permLoading) return <Loading />;
  if (!canView) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bạn không có quyền AUDIT_VIEW.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldAlert className="h-5 w-5" /> Audit log
        </h1>
        <p className="text-sm text-muted-foreground">
          Lịch sử hành động của admin (shop/user/billing/catalog/broadcast/auth).
        </p>
      </div>

      <Card className="p-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <Label>Actor ID</Label>
          <Input
            value={filters.actorId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, actorId: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Resource</Label>
          <Input
            value={filters.resource}
            onChange={(e) =>
              setFilters((f) => ({ ...f, resource: e.target.value }))
            }
            placeholder="SHOP / USER / BILLING ..."
          />
        </div>
        <div>
          <Label>Action</Label>
          <Input
            value={filters.action}
            onChange={(e) =>
              setFilters((f) => ({ ...f, action: e.target.value }))
            }
            placeholder="UPDATE_STATUS ..."
          />
        </div>
        <div>
          <Label>Target ID</Label>
          <Input
            value={filters.targetId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, targetId: e.target.value }))
            }
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSearch}>Lọc</Button>
          <Button variant="ghost" onClick={onReset}>
            Reset
          </Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                </TableCell>
              </TableRow>
            )}
            {!loading && data.content?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có log phù hợp.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.content?.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetail(row)}
                >
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmt(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{row.actorEmail || "—"}</div>
                    <div className="text-muted-foreground">{row.actorId}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.resource || "—"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.action}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{row.targetLabel || row.targetId || "—"}</div>
                    {row.targetLabel && row.targetId && (
                      <div className="text-muted-foreground">{row.targetId}</div>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.ip || "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">
          Trang {page + 1} / {totalPages} · Tổng {data.totalElements || 0}
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

      {detail && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Chi tiết log</div>
            <Button size="sm" variant="ghost" onClick={() => setDetail(null)}>
              Đóng
            </Button>
          </div>
          <pre className="mt-2 text-xs bg-muted/30 p-3 rounded overflow-auto max-h-96">
            {JSON.stringify(detail, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
