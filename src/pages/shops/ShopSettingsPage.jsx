import { useState, useEffect, useCallback } from "react";
import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useAuth } from "../../hooks/useAuth.js";
import axiosInstance from "../../api/axiosInstance";
import { deleteShop } from "../../api/shopApi.js";
import { toast } from "sonner";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { useNavigate, Link } from "react-router-dom";
import imageCompression from "browser-image-compression";
import {
  Store,
  Pencil,
  X,
  Save,
  Loader2,
  Camera,
  MapPin,
  Phone,
  Globe,
  Trash2,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  Briefcase,
  Link2,
  Copy,
  Percent,
  IdCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/constants/countries";
import { getFlagUrl } from "@/utils/commonUtils";
import { useSubscription } from "@/hooks/useSubscription";

function subscriptionPillClass(status) {
  switch (status) {
    case "TRIAL":
      return "bg-sky-100 text-sky-700 border-sky-200";
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "EXPIRED":
      return "bg-red-100 text-red-700 border-red-200";
    case "CANCELLED":
      return "bg-slate-200 text-slate-700 border-slate-300";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function subscriptionPillLabel(sub) {
  if (!sub?.status) return "Đang tải…";
  if (sub.status === "TRIAL") {
    return `Dùng thử · ${sub.trialDaysRemaining ?? 0} ngày`;
  }
  if (sub.status === "ACTIVE") {
    return `Đang hoạt động · ${sub.periodDaysRemaining ?? 0} ngày`;
  }
  if (sub.status === "EXPIRED") return "Hết hạn";
  if (sub.status === "CANCELLED") return "Đã huỷ";
  return sub.status;
}

const ShopSettingsPage = () => {
  const { confirm } = useAlertDialog();
  const { enums } = useAuth();
  const { selectedShop, setSelectedShop, fetchShops, isOwner, shopRole } =
    useShop();
  const { data: subscription } = useSubscription();
  const { hasShopPermission } = useShopPermissions();
  const canManageTax = hasShopPermission(PERM.SHOP_UPDATE);
  const canDeleteShop = hasShopPermission(PERM.SHOP_DELETE);
  const showSubscriptionStatus = isOwner || shopRole === "MANAGER";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxRegistrationNumber, setTaxRegistrationNumber] = useState("");
  const [zaloPageUrl, setZaloPageUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [shopeeUrl, setShopeeUrl] = useState("");
  const [countryCode, setCountryCode] = useState("VN");
  const [active, setActive] = useState(true);
  const [toppingsEnabled, setToppingsEnabled] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const resetForm = useCallback(() => {
    if (!selectedShop) return;
    setName(selectedShop.name || "");
    setType(selectedShop.type || "");
    setBusinessModel(selectedShop.businessModel || "");
    setAddress(selectedShop.address || "");
    setPhone(selectedShop.phone || "");
    setTaxRegistrationNumber(selectedShop.taxRegistrationNumber || "");
    setZaloPageUrl(selectedShop.zaloPageUrl || "");
    setFacebookUrl(selectedShop.facebookUrl || "");
    setTiktokUrl(selectedShop.tiktokUrl || "");
    setShopeeUrl(selectedShop.shopeeUrl || "");
    setCountryCode(selectedShop.countryCode || "VN");
    setActive(selectedShop.active !== false);
    setToppingsEnabled(selectedShop.toppingsEnabled === true);
    setLogoFile(null);
    setLogoPreview(null);
  }, [selectedShop]);

  useEffect(() => {
    if (selectedShop) {
      resetForm();
    }
  }, [selectedShop, resetForm]);

  const cancelEdit = () => {
    setIsEditMode(false);
    resetForm();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      toast.error("Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP");
      return;
    }
    let processed = file;
    if (file.size > 5 * 1024 * 1024) {
      const tid = toast.loading("Đang nén ảnh...");
      try {
        processed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        toast.success("Nén ảnh thành công!", { id: tid });
      } catch {
        toast.error("Nén ảnh thất bại.", { id: tid });
      }
    }
    setLogoFile(processed);
    setLogoPreview(URL.createObjectURL(processed));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Tên cửa hàng không được để trống.");
      return;
    }
    try {
      setIsSubmitting(true);
      const data = {
        name: name.trim(),
        type,
        businessModel,
        address: address.trim(),
        phone: phone.trim(),
        taxRegistrationNumber: taxRegistrationNumber.trim() || null,
        zaloPageUrl: zaloPageUrl.trim() || null,
        facebookUrl: facebookUrl.trim() || null,
        tiktokUrl: tiktokUrl.trim() || null,
        shopeeUrl: shopeeUrl.trim() || null,
        countryCode,
        active,
        toppingsEnabled,
      };
      const formData = new FormData();
      formData.append(
        "shop",
        new Blob([JSON.stringify(data)], { type: "application/json" }),
      );
      if (logoFile) formData.append("file", logoFile);

      const res = await axiosInstance.put(
        `/shop/${selectedShop.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.data.success) {
        toast.success("Cập nhật cửa hàng thành công.");
        const response = res.data.data;
        response.role = selectedShop.role;
        setSelectedShop(response);
        await fetchShops();
        setIsEditMode(false);
      } else {
        toast.error(res.data.message || "Cập nhật thất bại.");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi cập nhật cửa hàng.");
      console.error("Error updating shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShop) return;
    const ok = await confirm(
      "Bạn có chắc muốn xóa cửa hàng này không? Hành động này không thể hoàn tác.",
      {
        title: "Xóa cửa hàng",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      },
    );
    if (!ok) return;

    try {
      setIsSubmitting(true);
      const res = await deleteShop(selectedShop.id);
      if (res.data.success) {
        toast.success("Xóa cửa hàng thành công.");
        setSelectedShop(null);
        await fetchShops();
        navigate("/shops");
      } else {
        toast.error(res.data.message || "Xóa cửa hàng thất bại.");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi xóa cửa hàng.");
      console.error("Error deleting shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySlug = () => {
    if (selectedShop?.slug) {
      navigator.clipboard
        .writeText(selectedShop.slug)
        .then(() => toast.success("Đã sao chép slug!"))
        .catch(() => toast.error("Không thể sao chép."));
    }
  };

  if (!selectedShop) return null;

  const country = COUNTRIES.find((c) => c.code === (isEditMode ? countryCode : selectedShop.countryCode)) || COUNTRIES[0];
  const shopTypeLabel = shopTypes.find((s) => s.value === selectedShop.type)?.label || selectedShop.type;
  const bizModelLabel = businessModels.find((b) => b.value === selectedShop.businessModel)?.label || selectedShop.businessModel;
  const subscriptionPillCls = subscriptionPillClass(subscription?.status);
  const logoSrc = logoPreview || selectedShop.logoUrl;

  return (
    <div className="flex-1 flex-col gap-6 p-4 md:p-8 md:flex max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Cài đặt cửa hàng
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin và cấu hình cửa hàng
        </p>
      </div>

      {canManageTax && (
        <Card className="mb-6 border-dashed">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">Chính sách thuế</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cấu hình VAT và thuế khác cho POS — chỉ Chủ cửa hàng và Quản lý.
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" asChild>
              <Link to="/tax-policies">Mở cài đặt thuế</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shop identity card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group shrink-0">
              <Avatar className="h-24 w-24 rounded-xl border-2">
                <AvatarImage
                  src={logoSrc}
                  alt={selectedShop.name}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                  <Store className="h-10 w-10" />
                </AvatarFallback>
              </Avatar>
              {isEditMode && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="text-lg font-semibold truncate">
                {selectedShop.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-1.5">
                {selectedShop.active ? (
                  <Badge className="text-[10px] gap-0.5 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Hoạt động
                  </Badge>
                ) : (
                  <Badge className="text-[10px] gap-0.5 bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
                    <XCircle className="h-2.5 w-2.5" /> Tạm ngưng
                  </Badge>
                )}
                {showSubscriptionStatus && (
                  <Link to="/billing" className="contents">
                    <Badge
                      className={`text-[10px] gap-0.5 cursor-pointer ${subscriptionPillCls}`}
                      title="Xem chi tiết gói dịch vụ"
                    >
                      {subscription?.status === "ACTIVE" ? (
                        <CreditCard className="h-2.5 w-2.5" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                      {subscriptionPillLabel(subscription)}
                    </Badge>
                  </Link>
                )}
                {selectedShop.slug && (
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-1 cursor-pointer hover:bg-muted"
                    onClick={copySlug}
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    {selectedShop.slug}
                    <Copy className="h-2.5 w-2.5 ml-0.5" />
                  </Badge>
                )}
              </div>
            </div>

            <div className="shrink-0 flex gap-2">
              {!isEditMode
                ? canManageTax && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Pencil className="h-4 w-4 mr-1" /> Chỉnh sửa
                    </Button>
                  )
                : (
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" /> Hủy
                    </Button>
                  )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shop details */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">
            Thông tin cửa hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <FieldWrapper label="Tên cửa hàng" icon={Store}>
            {isEditMode ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên cửa hàng"
              />
            ) : (
              <FieldValue>{selectedShop.name}</FieldValue>
            )}
          </FieldWrapper>

          <Separator />

          {/* Type & Business model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Loại hình kinh doanh" icon={Building2}>
              {isEditMode ? (
                <Select
                  value={type}
                  onValueChange={(val) => {
                    setType(val);
                    const st = shopTypes.find((s) => s.value === val);
                    if (st?.defaultBusinessModel) {
                      setBusinessModel(st.defaultBusinessModel);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn loại hình" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {shopTypes.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue>{shopTypeLabel}</FieldValue>
              )}
            </FieldWrapper>
            <FieldWrapper label="Mô hình kinh doanh" icon={Briefcase}>
              {isEditMode ? (
                <Select
                  value={businessModel}
                  onValueChange={setBusinessModel}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn mô hình" />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {businessModels.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue>{bizModelLabel}</FieldValue>
              )}
            </FieldWrapper>
          </div>

          <Separator />

          {/* Country & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Quốc gia" icon={Globe}>
              {isEditMode ? (
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <img
                          src={getFlagUrl(countryCode)}
                          alt="flag"
                          className="w-5 h-4 rounded-sm"
                        />
                        <span>
                          {COUNTRIES.find((c) => c.code === countryCode)?.name}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        <div className="flex items-center gap-2">
                          <img
                            src={getFlagUrl(c.code)}
                            alt={c.name}
                            className="w-5 h-4 rounded-sm object-cover"
                          />
                          <span>
                            {c.name} ({c.dialCode})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FieldValue>
                  {country && (
                    <span className="flex items-center gap-2">
                      <img
                        src={getFlagUrl(country.code)}
                        alt={country.name}
                        className="w-5 h-4 rounded-sm"
                      />
                      {country.name}
                    </span>
                  )}
                </FieldValue>
              )}
            </FieldWrapper>
            <FieldWrapper label="Số điện thoại" icon={Phone}>
              {isEditMode ? (
                <div className="flex">
                  <span className="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-muted-foreground text-xs flex items-center">
                    {country.dialCode}
                  </span>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="flex-1 rounded-l-none"
                  />
                </div>
              ) : (
                <FieldValue>
                  {selectedShop.phone
                    ? `${country?.dialCode || ""} ${selectedShop.phone}`
                    : null}
                </FieldValue>
              )}
            </FieldWrapper>
          </div>

          <Separator />

          {/* Address */}
          <FieldWrapper label="Địa chỉ" icon={MapPin}>
            {isEditMode ? (
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Nhập địa chỉ chi tiết"
                rows={2}
              />
            ) : (
              <FieldValue>{selectedShop.address}</FieldValue>
            )}
          </FieldWrapper>

          <Separator />

          <FieldWrapper label="Mã số thuế (MST)" icon={IdCard}>
            {isEditMode ? (
              <Input
                value={taxRegistrationNumber}
                onChange={(e) => setTaxRegistrationNumber(e.target.value)}
                placeholder="Ví dụ: 0123456789"
                maxLength={32}
              />
            ) : (
              <FieldValue>{selectedShop.taxRegistrationNumber}</FieldValue>
            )}
          </FieldWrapper>
          {isEditMode && (
            <p className="text-xs text-muted-foreground -mt-2">
              MST mặc định của cửa hàng. Chi nhánh có thể nhập MST riêng trong
              cài đặt chi nhánh; để trống ở chi nhánh thì dùng MST này.
            </p>
          )}

          <Separator />

          <div className="space-y-1">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Liên kết Zalo, Facebook, TikTok, Shopee
            </Label>
            <p className="text-xs text-muted-foreground pb-2">
              Dán URL đầy đủ (ví dụ https://zalo.me/...) để hiển thị trên cài đặt
              và kênh marketing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Zalo Page / OA">
              {isEditMode ? (
                <Input
                  value={zaloPageUrl}
                  onChange={(e) => setZaloPageUrl(e.target.value)}
                  placeholder="https://zalo.me/..."
                />
              ) : selectedShop.zaloPageUrl ? (
                <a
                  href={selectedShop.zaloPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.zaloPageUrl}
                </a>
              ) : (
                <FieldValue />
              )}
            </FieldWrapper>
            <FieldWrapper label="Facebook">
              {isEditMode ? (
                <Input
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://www.facebook.com/..."
                />
              ) : selectedShop.facebookUrl ? (
                <a
                  href={selectedShop.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.facebookUrl}
                </a>
              ) : (
                <FieldValue />
              )}
            </FieldWrapper>
            <FieldWrapper label="TikTok">
              {isEditMode ? (
                <Input
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@..."
                />
              ) : selectedShop.tiktokUrl ? (
                <a
                  href={selectedShop.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.tiktokUrl}
                </a>
              ) : (
                <FieldValue />
              )}
            </FieldWrapper>
            <FieldWrapper label="Shopee">
              {isEditMode ? (
                <Input
                  value={shopeeUrl}
                  onChange={(e) => setShopeeUrl(e.target.value)}
                  placeholder="https://shopee.vn/..."
                />
              ) : selectedShop.shopeeUrl ? (
                <a
                  href={selectedShop.shopeeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline py-2 px-3 rounded-md bg-muted/50 inline-block max-w-full truncate"
                >
                  {selectedShop.shopeeUrl}
                </a>
              ) : (
                <FieldValue />
              )}
            </FieldWrapper>
          </div>

          {/* Tính năng topping — mặc định tắt; bật để cấu hình & POS */}
          <Separator />
          <FieldWrapper label="Topping (POS / sản phẩm)">
            {isEditMode ? (
              <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
                <p className="text-sm text-muted-foreground pr-2">
                  Khi bật: POS có thể chọn topping; trang sản phẩm hiện nút &quot;Cài
                  đặt topping&quot; và form sản phẩm cho phép gán topping.
                </p>
                <Switch
                  checked={toppingsEnabled}
                  onCheckedChange={setToppingsEnabled}
                  className="shrink-0"
                />
              </div>
            ) : (
              <FieldValue>
                {selectedShop.toppingsEnabled ? "Đang bật" : "Đang tắt"}
              </FieldValue>
            )}
          </FieldWrapper>

          {/* Status toggle in edit mode */}
          {isEditMode && (
            <>
              <Separator />
              <FieldWrapper label="Trạng thái hoạt động">
                <Select
                  value={active ? "true" : "false"}
                  onValueChange={(v) => setActive(v === "true")}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Tạm ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>
            </>
          )}

          {/* Save / Delete actions */}
          {isEditMode && (
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {canDeleteShop && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-destructive">
              Vùng nguy hiểm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Xóa cửa hàng</p>
                <p className="text-sm text-muted-foreground">
                  Xóa vĩnh viễn cửa hàng và tất cả dữ liệu liên quan. Hành
                  động này không thể hoàn tác.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Xóa cửa hàng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function FieldWrapper({ label, icon: IconComp, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        {IconComp && <IconComp className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
    </div>
  );
}

function FieldValue({ children }) {
  return (
    <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 min-h-9 flex items-center">
      {children || (
        <span className="text-muted-foreground">Chưa cập nhật</span>
      )}
    </p>
  );
}

export default ShopSettingsPage;
