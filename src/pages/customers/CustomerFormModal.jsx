import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createCustomer, updateCustomer } from "../../api/customerApi.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";

export default function CustomerFormModal({
  open,
  onClose,
  customer,
  shopId,
  branches,
  onSuccess,
}) {
  const isEdit = !!customer;
  const { hasShopPermission } = useShopPermissions();
  const canEdit = hasShopPermission(PERM.CUSTOMER_UPDATE);
  const readOnly = isEdit && !canEdit;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [branchId, setBranchId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setEmail(customer.email || "");
      setAddress(customer.address || "");
      setNote(customer.note || "");
      setBranchId(customer.branchId || "");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNote("");
      setBranchId("");
    }
  }, [open, customer]);

  const validate = () => {
    if (!name.trim()) {
      toast.error("Tên khách hàng không được để trống.");
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không hợp lệ.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      note: note.trim() || null,
      branchId: branchId || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const res = await updateCustomer(customer.id, shopId, payload);
        if (res.data?.success) {
          toast.success("Cập nhật khách hàng thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Cập nhật thất bại.");
        }
      } else {
        const res = await createCustomer(shopId, payload);
        if (res.data?.success) {
          toast.success("Tạo khách hàng thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Tạo khách hàng thất bại.");
        }
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {readOnly
              ? "Chi tiết khách hàng"
              : isEdit
                ? "Chỉnh sửa khách hàng"
                : "Thêm khách hàng mới"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit
              ? "Chỉnh sửa thông tin khách hàng."
              : "Điền thông tin để tạo khách hàng mới."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2">
          <div className="space-y-2">
            <Label htmlFor="cust-name">Tên khách hàng *</Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              autoFocus
              disabled={readOnly}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Số điện thoại</Label>
              <Input
                id="cust-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0901234567"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: email@example.com"
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-address">Địa chỉ</Label>
            <Input
              id="cust-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM"
              disabled={readOnly}
            />
          </div>

          <div className="space-y-2">
            <Label>Chi nhánh</Label>
            <Select
              value={branchId || "__none__"}
              onValueChange={(v) => setBranchId(v === "__none__" ? "" : v)}
              disabled={isEdit || readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Không phân biệt chi nhánh" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="__none__">
                  Không phân biệt chi nhánh
                </SelectItem>
                {branches?.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-xs text-muted-foreground">
                Không thể thay đổi chi nhánh khi chỉnh sửa.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-note">Ghi chú</Label>
            <Textarea
              id="cust-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách VIP, hay mua sản phẩm X..."
              rows={3}
              disabled={readOnly}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-0 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly ? "Đóng" : "Hủy"}
          </Button>
          {!readOnly && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit ? "Lưu thay đổi" : "Thêm khách hàng"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
