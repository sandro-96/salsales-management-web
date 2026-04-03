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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { addStaff } from "../../api/staffApi.js";

const ROLES = [
  { value: "MANAGER", label: "Quản lý" },
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Nhân viên" },
];

export default function AddStaffModal({ open, onClose, shopId, onSuccess }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("STAFF");
    }
  }, [open]);

  const validate = () => {
    if (!email.trim()) {
      toast.error("Email không được để trống.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Email không hợp lệ.");
      return false;
    }
    if (!role) {
      toast.error("Vui lòng chọn vai trò.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await addStaff(shopId, {
        email: email.trim(),
        role,
      });
      if (res.data?.success) {
        toast.success("Thêm nhân viên thành công.");
        onSuccess?.();
        onClose?.();
      } else {
        toast.error(res.data?.message || "Thêm nhân viên thất bại.");
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      if (msg) {
        toast.error(msg);
      } else {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      <DialogContent
        className="sm:max-w-[440px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Thêm nhân viên</DialogTitle>
          <DialogDescription>
            Nhập email của người dùng đã có tài khoản để thêm vào cửa hàng.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email *</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Người dùng phải đã đăng ký tài khoản trên hệ thống.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Vai trò *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Thêm nhân viên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
