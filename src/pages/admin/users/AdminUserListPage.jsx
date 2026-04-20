// src/pages/admin/users/AdminUserListPage.jsx
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

import { listAdminUsers } from "@/api/adminApi";

const ROLE_LABELS = {
  ROLE_USER: "User",
  ROLE_ADMIN: "Admin",
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy", { locale: vi });
  } catch {
    return d;
  }
};

export default function AdminUserListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);

  const page = Number(sp.get("page") || 0);
  const size = 20;
  const role = sp.get("role") || "all";
  const status = sp.get("status") || "all";
  const [keyword, setKeyword] = useState(sp.get("keyword") || "");

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size };
      if (role !== "all") params.role = role;
      if (status !== "all") params.status = status;
      const kw = sp.get("keyword");
      if (kw) params.keyword = kw;
      const res = await listAdminUsers(params);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách user");
    } finally {
      setLoading(false);
    }
  }, [page, role, status, sp]);

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
        <h1 className="text-2xl font-semibold">Danh sách user</h1>
        <p className="text-sm text-muted-foreground">
          Mọi tài khoản trong hệ thống — filter theo vai trò / trạng thái.
        </p>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Từ khoá</label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Email / họ tên / SĐT"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
        </div>
        <div className="w-full md:w-40">
          <label className="text-xs text-muted-foreground">Vai trò</label>
          <Select value={role} onValueChange={(v) => updateParam("role", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="ROLE_USER">User</SelectItem>
              <SelectItem value="ROLE_ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-40">
          <label className="text-xs text-muted-foreground">Trạng thái</label>
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
        <Button onClick={onSearch}>Tìm kiếm</Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Shop sở hữu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tạo lúc</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                </TableCell>
              </TableRow>
            )}
            {!loading && data.content?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Không có user phù hợp.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.content?.map((u) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/users/${u.id}`)}
                >
                  <TableCell className="font-medium">
                    {u.email}
                    {!u.verified && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Chưa xác thực
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{u.fullName || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={u.role === "ROLE_ADMIN" ? "default" : "secondary"}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.ownedShopCount} / {u.memberShopCount} (sở hữu / tham gia)
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Locked</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
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
    </div>
  );
}
