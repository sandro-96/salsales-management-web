// src/pages/admin/security/AdminSecurityPage.jsx
// Trang bảo mật cá nhân: bật/tắt 2FA TOTP cho admin. Dùng QR server-side
// (api.qrserver) để tránh thêm dependency. Secret + otpauth URI được hiển
// thị kèm input 6 số để xác nhận.
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  getSession,
  twoFactorSetup,
  twoFactorVerify,
  twoFactorDisable,
} from "@/api/adminApi";

const qrUrl = (uri) =>
  uri
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}`
    : null;

export default function AdminSecurityPage() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Session trả role + impersonation. Để biết 2FA đã bật hay chưa ta gọi
      // setup chỉ khi user yêu cầu; ở đây chỉ lấy thông tin cơ bản.
      await getSession();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onSetup = async () => {
    setSubmitting(true);
    try {
      const res = await twoFactorSetup();
      setSetupData(res.data?.data);
      toast.success("Đã sinh secret. Quét QR bằng app Authenticator.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể setup 2FA");
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async () => {
    if (!/^\d{6}$/.test(code)) {
      toast.error("Mã 2FA phải gồm 6 số");
      return;
    }
    setSubmitting(true);
    try {
      await twoFactorVerify(code);
      toast.success("Đã bật 2FA thành công");
      setEnabled(true);
      setSetupData(null);
      setCode("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setSubmitting(false);
    }
  };

  const onDisable = async () => {
    if (!/^\d{6}$/.test(disableCode)) {
      toast.error("Mã 2FA phải gồm 6 số");
      return;
    }
    setSubmitting(true);
    try {
      await twoFactorDisable(disableCode);
      toast.success("Đã tắt 2FA");
      setEnabled(false);
      setDisableCode("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Mã không hợp lệ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Bảo mật tài khoản</h1>
        <p className="text-sm text-muted-foreground">
          Cấu hình xác thực 2 lớp (2FA TOTP) cho tài khoản admin của bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Xác thực 2 lớp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Dùng app Authenticator (Google Authenticator, Microsoft
                Authenticator, 1Password,...) để sinh mã 6 số mỗi 30 giây.
              </p>

              {!setupData && !enabled && (
                <Button onClick={onSetup} disabled={submitting}>
                  Bật 2FA ngay
                </Button>
              )}

              {setupData && (
                <div className="space-y-3 rounded-md border p-4">
                  <div className="text-sm">
                    Quét mã QR dưới đây, sau đó nhập 6 số app sinh ra:
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <img
                      alt="TOTP QR"
                      src={qrUrl(setupData.otpAuthUri)}
                      className="border rounded-md w-[220px] h-[220px]"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label>Secret (nhập tay nếu không quét được)</Label>
                        <Input readOnly value={setupData.secret} />
                      </div>
                      <div>
                        <Label>Mã 6 số hiện tại</Label>
                        <Input
                          value={code}
                          onChange={(e) =>
                            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                      <Button onClick={onVerify} disabled={submitting}>
                        Xác nhận bật 2FA
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {enabled && (
                <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-sm text-amber-800">
                    <ShieldOff className="h-4 w-4" />
                    2FA đang bật. Nhập mã hiện tại để tắt.
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1 space-y-1">
                      <Label>Mã 6 số</Label>
                      <Input
                        value={disableCode}
                        onChange={(e) =>
                          setDisableCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        maxLength={6}
                      />
                    </div>
                    <Button
                      variant="destructive"
                      onClick={onDisable}
                      disabled={submitting}
                    >
                      Tắt 2FA
                    </Button>
                  </div>
                </div>
              )}

              <Separator />
              <p className="text-xs text-muted-foreground">
                Sau khi bật 2FA, hãy lưu secret vào nơi an toàn. Nếu mất thiết
                bị, bạn sẽ cần liên hệ admin cấp cao để được reset.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
