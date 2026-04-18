import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  updateStaffRole,
  updateStaffPermissions,
} from "../../api/staffApi.js";
import { SHOP_ROLE_LABELS, SHOP_ROLES_ASSIGNABLE } from "../../constants/shopRoles.js";

const PERMISSION_GROUPS = [
  {
    label: "Sản phẩm",
    permissions: [
      { value: "PRODUCT_VIEW", label: "Xem" },
      { value: "PRODUCT_CREATE", label: "Tạo" },
      { value: "PRODUCT_UPDATE", label: "Sửa" },
      { value: "PRODUCT_DELETE", label: "Xóa" },
      { value: "PRODUCT_IMPORT", label: "Nhập Excel" },
      { value: "PRODUCT_EXPORT", label: "Xuất Excel" },
      { value: "PRODUCT_UPDATE_STATUS", label: "Đổi trạng thái" },
      { value: "PRODUCT_VIEW_LOW_STOCK", label: "Xem tồn kho thấp" },
    ],
  },
  {
    label: "Đơn hàng",
    permissions: [
      { value: "ORDER_VIEW", label: "Xem" },
      { value: "ORDER_CREATE", label: "Tạo" },
      { value: "ORDER_UPDATE", label: "Sửa" },
      { value: "ORDER_CANCEL", label: "Hủy" },
      { value: "ORDER_PAYMENT_CONFIRM", label: "Xác nhận thanh toán" },
    ],
  },
  {
    label: "Khách hàng",
    permissions: [
      { value: "CUSTOMER_VIEW", label: "Xem" },
      { value: "CUSTOMER_UPDATE", label: "Sửa" },
      { value: "CUSTOMER_DELETE", label: "Xóa" },
    ],
  },
  {
    label: "Khuyến mãi",
    permissions: [
      { value: "PROMOTION_VIEW", label: "Xem" },
      { value: "PROMOTION_CREATE", label: "Tạo" },
      { value: "PROMOTION_UPDATE", label: "Sửa" },
      { value: "PROMOTION_DELETE", label: "Xóa" },
    ],
  },
  {
    label: "Bàn",
    permissions: [
      { value: "TABLE_VIEW", label: "Xem" },
      { value: "TABLE_CREATE", label: "Tạo" },
      { value: "TABLE_UPDATE", label: "Sửa" },
      { value: "TABLE_DELETE", label: "Xóa" },
    ],
  },
  {
    label: "Cửa hàng",
    permissions: [
      { value: "SHOP_VIEW", label: "Xem" },
      { value: "SHOP_UPDATE", label: "Sửa" },
      { value: "SHOP_DELETE", label: "Xóa" },
      { value: "SHOP_MANAGE", label: "Quản lý" },
    ],
  },
  {
    label: "Nhân viên",
    permissions: [
      { value: "SHOP_USER_VIEW", label: "Xem" },
      { value: "SHOP_USER_CREATE", label: "Thêm" },
      { value: "SHOP_USER_UPDATE", label: "Sửa" },
      { value: "SHOP_USER_DELETE", label: "Xóa" },
    ],
  },
  {
    label: "Chi nhánh",
    permissions: [
      { value: "BRANCH_VIEW", label: "Xem" },
      { value: "BRANCH_UPDATE", label: "Sửa" },
      { value: "BRANCH_MANAGE", label: "Quản lý" },
    ],
  },
  {
    label: "Kho & Báo cáo",
    permissions: [
      { value: "INVENTORY_VIEW", label: "Xem kho" },
      { value: "INVENTORY_MANAGE", label: "Quản lý kho" },
      { value: "REPORT_VIEW", label: "Xem báo cáo" },
    ],
  },
];

const DEFAULT_PERMISSIONS = {
  MANAGER: [
    "PRODUCT_VIEW", "PRODUCT_CREATE", "PRODUCT_UPDATE", "PRODUCT_DELETE",
    "PRODUCT_IMPORT", "PRODUCT_EXPORT", "PRODUCT_UPDATE_STATUS", "PRODUCT_VIEW_LOW_STOCK",
    "ORDER_VIEW", "ORDER_CREATE", "ORDER_UPDATE", "ORDER_PAYMENT_CONFIRM",
    "CUSTOMER_VIEW", "CUSTOMER_UPDATE", "CUSTOMER_DELETE",
    "PROMOTION_VIEW", "PROMOTION_CREATE", "PROMOTION_UPDATE", "PROMOTION_DELETE",
    "TABLE_VIEW", "TABLE_CREATE", "TABLE_UPDATE", "TABLE_DELETE",
    "SHOP_VIEW", "SHOP_UPDATE",
    "SHOP_USER_VIEW", "SHOP_USER_CREATE", "SHOP_USER_UPDATE",
    "BRANCH_VIEW", "BRANCH_MANAGE",
    "INVENTORY_VIEW", "INVENTORY_MANAGE", "REPORT_VIEW",
  ],
  STAFF: [
    "ORDER_VIEW", "ORDER_CREATE", "ORDER_UPDATE",
    "CUSTOMER_VIEW", "PRODUCT_VIEW",
    "PROMOTION_VIEW", "TABLE_VIEW", "BRANCH_VIEW", "INVENTORY_VIEW", "SHOP_VIEW",
  ],
  CASHIER: [
    "ORDER_VIEW", "ORDER_CREATE", "ORDER_UPDATE", "ORDER_PAYMENT_CONFIRM", "ORDER_CANCEL",
    "PRODUCT_VIEW", "PROMOTION_VIEW", "TABLE_VIEW", "BRANCH_VIEW", "SHOP_VIEW",
    "CUSTOMER_VIEW", "CUSTOMER_UPDATE",
  ],
};

export default function EditStaffModal({
  open,
  onClose,
  staff,
  shopId,
  onSuccess,
}) {
  const [role, setRole] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && staff) {
      setRole(staff.role || "STAFF");
      setSelectedPermissions(
        new Set(Array.isArray(staff.permissions) ? staff.permissions : []),
      );
    }
  }, [open, staff]);

  const roleChanged = staff && role !== staff.role;

  const permissionsChanged = useMemo(() => {
    if (!staff) return false;
    const original = new Set(
      Array.isArray(staff.permissions) ? staff.permissions : [],
    );
    if (original.size !== selectedPermissions.size) return true;
    for (const p of selectedPermissions) {
      if (!original.has(p)) return true;
    }
    return false;
  }, [staff, selectedPermissions]);

  const hasChanges = roleChanged || permissionsChanged;

  const togglePermission = (perm) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
      return next;
    });
  };

  const toggleGroupAll = (group) => {
    const allPerms = group.permissions.map((p) => p.value);
    const allChecked = allPerms.every((p) => selectedPermissions.has(p));
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        allPerms.forEach((p) => next.delete(p));
      } else {
        allPerms.forEach((p) => next.add(p));
      }
      return next;
    });
  };

  const resetToDefault = () => {
    const defaults = DEFAULT_PERMISSIONS[role] || [];
    setSelectedPermissions(new Set(defaults));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (roleChanged) {
        const roleRes = await updateStaffRole(shopId, staff.userId, {
          role,
        });
        if (!roleRes.data?.success) {
          toast.error(roleRes.data?.message || "Cập nhật vai trò thất bại.");
          return;
        }
      }

      const permsToSave = roleChanged
        ? new Set(DEFAULT_PERMISSIONS[role] || [])
        : selectedPermissions;

      const permRes = await updateStaffPermissions(shopId, staff.userId, {
        permissions: [...permsToSave],
      });
      if (permRes.data?.success) {
        toast.success("Cập nhật thành công.");
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(permRes.data?.message || "Cập nhật quyền thất bại.");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!staff) return null;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[640px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Chỉnh sửa nhân viên</DialogTitle>
          <DialogDescription>
            Thay đổi vai trò và phân quyền cho{" "}
            <span className="font-medium">
              {staff.fullName || staff.email}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1 py-2">
          {/* Staff info */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            {staff.avatarUrl ? (
              <img
                src={staff.avatarUrl}
                alt={staff.fullName}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                {(staff.fullName || staff.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {staff.fullName || "-"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {staff.email}
              </p>
            </div>
            <Badge variant="outline">
              {SHOP_ROLE_LABELS[staff.role] || staff.role}
            </Badge>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Vai trò</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {SHOP_ROLES_ASSIGNABLE.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {roleChanged && (
              <p className="text-xs text-amber-600">
                Thay đổi vai trò sẽ đặt lại quyền về mặc định của vai trò mới.
              </p>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Phân quyền chi tiết</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={resetToDefault}
              >
                <RotateCcw className="h-3 w-3" />
                Đặt lại mặc định
              </Button>
            </div>

            {roleChanged && (
              <p className="text-xs text-muted-foreground italic">
                Quyền sẽ được đặt lại theo vai trò mới sau khi lưu.
              </p>
            )}

            <div
              className={`space-y-3 ${roleChanged ? "opacity-50 pointer-events-none" : ""}`}
            >
              {PERMISSION_GROUPS.map((group) => {
                const allPerms = group.permissions.map((p) => p.value);
                const checkedCount = allPerms.filter((p) =>
                  selectedPermissions.has(p),
                ).length;
                const allChecked = checkedCount === allPerms.length;
                const someChecked = checkedCount > 0 && !allChecked;

                return (
                  <div
                    key={group.label}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allChecked}
                        indeterminate={someChecked}
                        onCheckedChange={() => toggleGroupAll(group)}
                      />
                      <span className="text-sm font-medium">
                        {group.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {checkedCount}/{allPerms.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 ml-6">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.value}
                          className="flex items-center gap-2 cursor-pointer text-sm py-0.5"
                        >
                          <Checkbox
                            checked={selectedPermissions.has(perm.value)}
                            onCheckedChange={() =>
                              togglePermission(perm.value)
                            }
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasChanges}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
