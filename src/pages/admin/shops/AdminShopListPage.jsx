// src/pages/admin/shops/AdminShopListPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { listAdminShops } from "@/api/adminApi";

const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "TRIAL", label: "Dùng thử" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "EXPIRED", label: "Hết hạn" },
  { value: "CANCELLED", label: "Đã huỷ" },
];

function renderSubscriptionBadge(status) {
  switch (status) {
    case "TRIAL":
      return (
        <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-100">Trial</Badge>
      );
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
          Active
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">Expired</Badge>;
    case "CANCELLED":
      return (
        <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status || "—"}</Badge>;
  }
}

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy", { locale: vi });
  } catch {
    return d;
  }
};

export default function AdminShopListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);

  const page = Number(sp.get("page") || 0);
  const size = 20;
  const status = sp.get("status") || "all";
  const subscriptionStatus = sp.get("subscriptionStatus") || "all";
  const [keyword, setKeyword] = useState(sp.get("keyword") || "");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (status !== "all") params.status = status;
      if (subscriptionStatus !== "all")
        params.subscriptionStatus = subscriptionStatus;
      const kw = sp.get("keyword");
      if (kw) params.keyword = kw;
      const res = await listAdminShops(params);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách shop");
    } finally {
      setLoading(false);
    }
  }, [page, status, subscriptionStatus, sp]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onSearch = () => {
    const n = new URLSearchParams(sp);
    if (keyword.trim()) n.set("keyword", keyword.trim());
    else n.delete("keyword");
    n.set("page", "0");
    setSp(n);
  };

  const updateParam = (key, val) => {
    const n = new URLSearchParams(sp);
    if (val && val !== "all") n.set(key, val);
    else n.delete(key);
    n.set("page", "0");
    setSp(n);
  };

  const totalPages = Math.max(1, Math.ceil((data.totalElements || 0) / size));

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Danh sách shop</h1>
        <p className="text-sm text-muted-foreground">
          Quản trị shop toàn hệ thống — filter theo trạng thái hệ thống,
          subscription, hoặc từ khoá.
        </p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Từ khoá</label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tên / slug / địa chỉ"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
        </div>
        <div className="w-full md:w-44">
          <label className="text-xs text-muted-foreground">Trạng thái shop</label>
          <Select value={status} onValueChange={(v) => updateParam("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="locked">Bị khoá</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <label className="text-xs text-muted-foreground">Subscription</label>
          <Select
            value={subscriptionStatus}
            onValueChange={(v) => updateParam("subscriptionStatus", v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onSearch}>Tìm kiếm</Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Chủ shop</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Còn lại</TableHead>
              <TableHead>Hạn chu kỳ</TableHead>
              <TableHead>Tạo lúc</TableHead>
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
                  Không có shop phù hợp.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.content?.map((s) => {
                const expiryDate =
                  s.subscriptionStatus === "TRIAL"
                    ? s.trialEndsAt
                    : s.currentPeriodEnd;
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/shops/${s.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div>{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        /{s.slug}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{s.ownerName || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.ownerEmail}
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderSubscriptionBadge(s.subscriptionStatus)}
                    </TableCell>
                    <TableCell>
                      {s.active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Locked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {s.daysRemaining != null
                        ? `${s.daysRemaining} ngày`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDate(expiryDate)}</TableCell>
                    <TableCell>{formatDate(s.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
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
    </div>
  );
}
