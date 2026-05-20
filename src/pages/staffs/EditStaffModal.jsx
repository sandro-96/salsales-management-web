import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, RotateCcw, Shield } from "lucide-react";

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
import {
  buildShopRolesAssignable,
  getShopRoleLabel,
} from "@/utils/shopLabels";
import { FormSectionCard, FieldLabel } from "@/components/forms/FormSectionCard.jsx";
import { cn } from "@/lib/utils";

const buildPermissionGroups = (t) => [
  {
    key: "products",
    label: t("pages.staffs.editModal.permGroup.products"),
    permissions: [
      { value: "PRODUCT_VIEW", permKey: "view" },
      { value: "PRODUCT_CREATE", permKey: "create" },
      { value: "PRODUCT_UPDATE", permKey: "update" },
      { value: "PRODUCT_DELETE", permKey: "delete" },
      { value: "PRODUCT_IMPORT", permKey: "import" },
      { value: "PRODUCT_EXPORT", permKey: "export" },
      { value: "PRODUCT_UPDATE_STATUS", permKey: "updateStatus" },
      { value: "PRODUCT_VIEW_LOW_STOCK", permKey: "viewLowStock" },
    ],
  },
  {
    key: "orders",
    label: t("pages.staffs.editModal.permGroup.orders"),
    permissions: [
      { value: "ORDER_VIEW", permKey: "view" },
      { value: "ORDER_CREATE", permKey: "create" },
      { value: "ORDER_UPDATE", permKey: "update" },
      { value: "ORDER_CANCEL", permKey: "cancel" },
      { value: "ORDER_PAYMENT_CONFIRM", permKey: "paymentConfirm" },
    ],
  },
  {
    key: "customers",
    label: t("pages.staffs.editModal.permGroup.customers"),
    permissions: [
      { value: "CUSTOMER_VIEW", permKey: "view" },
      { value: "CUSTOMER_UPDATE", permKey: "update" },
      { value: "CUSTOMER_DELETE", permKey: "delete" },
    ],
  },
  {
    key: "promotions",
    label: t("pages.staffs.editModal.permGroup.promotions"),
    permissions: [
      { value: "PROMOTION_VIEW", permKey: "view" },
      { value: "PROMOTION_CREATE", permKey: "create" },
      { value: "PROMOTION_UPDATE", permKey: "update" },
      { value: "PROMOTION_DELETE", permKey: "delete" },
    ],
  },
  {
    key: "tables",
    label: t("pages.staffs.editModal.permGroup.tables"),
    permissions: [
      { value: "TABLE_VIEW", permKey: "view" },
      { value: "TABLE_CREATE", permKey: "create" },
      { value: "TABLE_UPDATE", permKey: "update" },
      { value: "TABLE_DELETE", permKey: "delete" },
    ],
  },
  {
    key: "shop",
    label: t("pages.staffs.editModal.permGroup.shop"),
    permissions: [
      { value: "SHOP_VIEW", permKey: "view" },
      { value: "SHOP_UPDATE", permKey: "update" },
      { value: "SHOP_DELETE", permKey: "delete" },
      { value: "SHOP_MANAGE", permKey: "manage" },
    ],
  },
  {
    key: "staffUser",
    label: t("pages.staffs.editModal.permGroup.staffUser"),
    permissions: [
      { value: "SHOP_USER_VIEW", permKey: "view" },
      { value: "SHOP_USER_CREATE", permKey: "staffCreate" },
      { value: "SHOP_USER_UPDATE", permKey: "update" },
      { value: "SHOP_USER_DELETE", permKey: "delete" },
    ],
  },
  {
    key: "branch",
    label: t("pages.staffs.editModal.permGroup.branch"),
    permissions: [
      { value: "BRANCH_VIEW", permKey: "view" },
      { value: "BRANCH_UPDATE", permKey: "update" },
      { value: "BRANCH_MANAGE", permKey: "manage" },
    ],
  },
  {
    key: "inventoryReport",
    label: t("pages.staffs.editModal.permGroup.inventoryReport"),
    permissions: [
      { value: "INVENTORY_VIEW", permKey: "viewInventory" },
      { value: "INVENTORY_MANAGE", permKey: "manageInventory" },
      { value: "REPORT_VIEW", permKey: "viewReport" },
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
  const { t } = useTranslation();
  const permissionGroups = useMemo(() => buildPermissionGroups(t), [t]);
  const assignableRoles = useMemo(() => buildShopRolesAssignable(t), [t]);
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
          toast.error(roleRes.data?.message || t("pages.staffs.editModal.roleUpdateFail"));
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
        toast.success(t("pages.staffs.editModal.updateSuccess"));
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(permRes.data?.message || t("pages.staffs.editModal.permUpdateFail"));
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg || t("pages.staffs.editModal.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!staff) return null;

  const staffName = staff.fullName || staff.email;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-h-[min(92dvh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-4 py-4 text-left sm:px-6">
          <DialogTitle>{t("pages.staffs.editModal.title")}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("pages.staffs.editModal.description", { name: staffName })}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 [scrollbar-gutter:stable]">
          <div className="flex flex-col gap-4">
          <FormSectionCard title={t("pages.staffs.editModal.sectionStaff")}>
          <div className="flex items-center gap-3">
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
              {getShopRoleLabel(t, staff.role) || staff.role}
            </Badge>
          </div>

          </FormSectionCard>

          <FormSectionCard
            title={t("pages.staffs.editModal.sectionRole")}
            description={t("pages.staffs.editModal.sectionRoleDesc")}
          >
            
            <div className="space-y-2">
              <FieldLabel icon={Shield}>
                {t("pages.staffs.editModal.roleLabel")}
              </FieldLabel>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {assignableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleChanged && (
                <p className="rounded-md border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  {t("pages.staffs.editModal.roleChangeWarning")}
                </p>
              )}
            </div>
          </FormSectionCard>

          <FormSectionCard
            title={t("pages.staffs.editModal.sectionPermissions")}
            description={t("pages.staffs.editModal.sectionPermissionsDesc")}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={resetToDefault}
                disabled={roleChanged}
              >
                <RotateCcw className="h-3 w-3" />
                {t("pages.staffs.editModal.resetDefault")}
              </Button>
            }
          >
            {roleChanged && (
              <p className="text-xs text-muted-foreground italic">
                {t("pages.staffs.editModal.permissionsResetHint")}
              </p>
            )}

            <div
              className={cn(
                "space-y-3",
                roleChanged && "pointer-events-none opacity-50",
              )}
            >
              {permissionGroups.map((group) => {
                const allPerms = group.permissions.map((p) => p.value);
                const checkedCount = allPerms.filter((p) =>
                  selectedPermissions.has(p),
                ).length;
                const allChecked = checkedCount === allPerms.length;
                const someChecked = checkedCount > 0 && !allChecked;

                return (
                  <div
                    key={group.key}
                    className="space-y-2 rounded-lg border p-3"
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
                      <span className="ml-auto text-xs text-muted-foreground">
                        {checkedCount}/{allPerms.length}
                      </span>
                    </div>
                    <div className="ml-6 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {group.permissions.map((perm) => (
                        <label
                          key={perm.value}
                          className="flex cursor-pointer items-center gap-2 py-0.5 text-sm"
                        >
                          <Checkbox
                            checked={selectedPermissions.has(perm.value)}
                            onCheckedChange={() =>
                              togglePermission(perm.value)
                            }
                          />
                          {t(`pages.staffs.editModal.perm.${perm.permKey}`)}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </FormSectionCard>
          </div>
        </div>

        <DialogFooter className="relative z-10 shrink-0 gap-2 border-t bg-background px-4 py-4 sm:gap-0 sm:px-6">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("pages.staffs.editModal.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasChanges}
            variant="success"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {t("pages.staffs.editModal.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
