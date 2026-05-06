// src/pages/admin/users/AdminUserDetailPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Unlock,
  UserCog,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import {
  ADMIN_PERM,
  ADMIN_PERMISSIONS,
  ADMIN_PERMISSION_PRESETS,
} from "@/constants/adminPermissions";
import {
  getAdminUserDetail,
  updateAdminUserStatus,
  updateAdminUserPermissions,
  resetAdminUserPassword,
  resendAdminUserVerification,
} from "@/api/adminApi";
import { startImpersonationFlow } from "@/utils/impersonation";

const PRESET_OPTIONS = [
  { value: "CUSTOM", label: "Tuỳ chỉnh" },
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "SUPPORT_ADMIN", label: "Support Admin" },
  { value: "BILLING_ADMIN", label: "Billing Admin" },
  { value: "CONTENT_ADMIN", label: "Content Admin" },
];

const ALL_PERMS = Object.values(ADMIN_PERMISSIONS);

const fmt = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return d;
  }
};

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { hasAdminPermission } = useAdminPermissions();
  const canManage = hasAdminPermission(ADMIN_PERM.USER_MANAGE);
  const canImpersonate = hasAdminPermission(ADMIN_PERM.IMPERSONATE);

  const handleImpersonate = async () => {
    if (!data?.user) return;
    if (
      !window.confirm(
        `Bạn sắp giả danh ${data.user.email}. Mọi hành động sẽ ghi vào audit log. Tiếp tục?`,
      )
    ) {
      return;
    }
    try {
      await startImpersonationFlow(data.user.id);
      window.dispatchEvent(new Event("impersonation-change"));
      toast.success("Đã giả danh. Đang chuyển về dashboard user.");
      navigate("/", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể giả danh user");
    }
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [permsOpen, setPermsOpen] = useState(false);
  const [preset, setPreset] = useState("CUSTOM");
  const [permsSelected, setPermsSelected] = useState([]);
  const [permsSubmitting, setPermsSubmitting] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUserDetail(userId);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được chi tiết user");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openPermsDialog = () => {
    setPreset("CUSTOM");
    setPermsSelected(Array.from(data?.summary?.adminPermissions || []));
    setPermsOpen(true);
  };

  useEffect(() => {
    if (preset === "CUSTOM") return;
    const list = ADMIN_PERMISSION_PRESETS[preset] || [];
    setPermsSelected(list);
  }, [preset]);

  const effectivePerms = useMemo(() => {
    if (preset === "CUSTOM") return permsSelected;
    return ADMIN_PERMISSION_PRESETS[preset] || [];
  }, [preset, permsSelected]);

  if (loading) return <Loading />;
  if (!data) return <div className="p-6">Không tìm thấy.</div>;

  const u = data.summary || {};
  const perms = Array.from(u.adminPermissions || []);
  const isAdminUser = u.role === "ROLE_ADMIN";

  const togglePerm = (p) => {
    setPreset("CUSTOM");
    setPermsSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleToggleStatus = async () => {
    setStatusSubmitting(true);
    try {
      await updateAdminUserStatus(u.id, {
        active: !u.active,
        reason: statusReason || null,
      });
      toast.success(u.active ? "Đã khoá user" : "Đã mở khoá user");
      setStatusOpen(false);
      setStatusReason("");
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleSavePerms = async () => {
    setPermsSubmitting(true);
    try {
      await updateAdminUserPermissions(u.id, {
        permissions: preset === "CUSTOM" ? permsSelected : null,
        preset: preset === "CUSTOM" ? null : preset,
      });
      toast.success("Đã cập nhật quyền admin");
      setPermsOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật quyền thất bại");
    } finally {
      setPermsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    setResetSubmitting(true);
    try {
      await resetAdminUserPassword(u.id);
      toast.success("Đã gửi email reset password");
      setResetOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Reset password thất bại");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResendVerify = async () => {
    setVerifySubmitting(true);
    try {
      await resendAdminUserVerification(u.id);
      toast.success("Đã gửi lại email xác thực");
      setVerifyOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Gửi lại xác thực thất bại");
    } finally {
      setVerifySubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Danh sách
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {u.fullName || u.email}
            {u.active ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="destructive">Locked</Badge>
            )}
            <Badge variant={isAdminUser ? "default" : "secondary"}>{u.role}</Badge>
            {u.verified ? (
              <Badge variant="outline">Đã xác thực</Badge>
            ) : (
              <Badge variant="outline" className="text-amber-700 border-amber-300 dark:text-amber-300 dark:border-amber-500/40">
                Chưa xác thực
              </Badge>
            )}
          </CardTitle>
          {canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={u.active ? "destructive" : "default"}
                onClick={() => setStatusOpen(true)}
              >
                {u.active ? (
                  <>
                    <Lock className="h-4 w-4 mr-1" /> Khoá
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-1" /> Mở khoá
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setResetOpen(true)}
              >
                <KeyRound className="h-4 w-4 mr-1" /> Reset password
              </Button>
              {!u.verified && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVerifyOpen(true)}
                >
                  <Mail className="h-4 w-4 mr-1" /> Gửi lại xác thực
                </Button>
              )}
              {isAdminUser && (
                <Button size="sm" variant="secondary" onClick={openPermsDialog}>
                  <ShieldCheck className="h-4 w-4 mr-1" /> Quyền admin
                </Button>
              )}
              {canImpersonate && !isAdminUser && (
                <Button size="sm" variant="outline" onClick={handleImpersonate}>
                  <UserCog className="h-4 w-4 mr-1" /> Giả danh
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-muted-foreground">User ID</div>
              <div className="font-mono">{u.id}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div>{u.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Đăng nhập gần nhất</div>
              <div>{fmt(u.lastLoginAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tạo lúc</div>
              <div>{fmt(u.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Shop sở hữu</div>
              <div>{u.ownedShopCount ?? 0}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Shop tham gia</div>
              <div>{u.memberShopCount ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdminUser && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quyền admin</CardTitle>
          </CardHeader>
          <CardContent>
            {perms.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa gán quyền.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => (
                  <Badge
                    key={p}
                    variant="secondary"
                    className="font-mono text-[11px]"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Shop memberships</CardTitle>
        </CardHeader>
        <CardContent>
          {(!data.memberships || data.memberships.length === 0) && (
            <div className="text-sm text-muted-foreground py-6 text-center">
              Không có shop nào.
            </div>
          )}
          <ul className="space-y-2">
            {data.memberships?.map((m, i) => (
              <li
                key={`${m.shopId}-${i}`}
                className="flex items-center gap-3 border rounded-md p-3 text-sm"
              >
                <div className="flex-1">
                  <Link
                    to={`/admin/shops/${m.shopId}`}
                    className="font-medium hover:underline"
                  >
                    {m.shopName || m.shopId}
                  </Link>
                </div>
                {m.owner ? (
                  <Badge>Owner</Badge>
                ) : (
                  <Badge variant="secondary">{m.role}</Badge>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Separator />
      <p className="text-xs text-muted-foreground">
        Thao tác ghi chỉ hiển thị nếu admin hiện tại có {ADMIN_PERM.USER_MANAGE}.
      </p>

      {/* Lock / Unlock */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{u.active ? "Khoá user" : "Mở khoá user"}</DialogTitle>
            <DialogDescription>
              {u.active
                ? "User sẽ không thể đăng nhập cho đến khi được mở khoá."
                : "User có thể đăng nhập trở lại sau khi mở khoá."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Lý do (tuỳ chọn)</Label>
            <Textarea
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder="Ghi chú nội bộ"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStatusOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant={u.active ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={statusSubmitting}
            >
              {u.active ? "Khoá" : "Mở khoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin permissions */}
      <Dialog open={permsOpen} onOpenChange={setPermsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gán quyền admin</DialogTitle>
            <DialogDescription>
              Chọn preset hoặc tuỳ chỉnh danh sách {ADMIN_PERM.SHOP_MANAGE} / {ADMIN_PERM.BILLING_MANAGE} / …
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMS.map((p) => {
                const checked = effectivePerms.includes(p);
                return (
                  <label
                    key={p}
                    className="flex items-center gap-2 rounded-md border p-2 text-xs font-mono cursor-pointer"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => togglePerm(p)}
                    />
                    {p}
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPermsOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSavePerms} disabled={permsSubmitting}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password confirm */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ gửi email reset password đến {u.email}. Liên kết sẽ hết hạn sau 15 phút.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleResetPassword} disabled={resetSubmitting}>
              Gửi email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resend verify confirm */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi lại email xác thực</DialogTitle>
            <DialogDescription>
              Email xác thực mới sẽ được gửi đến {u.email}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setVerifyOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleResendVerify} disabled={verifySubmitting}>
              Gửi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
