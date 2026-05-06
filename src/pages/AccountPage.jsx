import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { getCurrentUser, updateProfile, changePassword } from "../api/userApi";
import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { handleFileChange } from "../utils/fileUtils.js";
import {
  User,
  Lock,
  Camera,
  MapPin,
  Phone,
  Globe,
  Mail,
  Shield,
  Pencil,
  X,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const GENDER_MAP = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const AccountPage = () => {
  const { user: authUser, enums, isUserContextReady } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const countryOptions = enums?.countries || [];

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
    control,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      countryCode: "",
      gender: "",
      birthDate: null,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const countryCode = watch("countryCode");

  const refreshUserSnapshot = useCallback(async () => {
    try {
      const res = await getCurrentUser();
      const data = res.data?.data ?? res.data;
      if (data) setUser(data);
    } catch {
      /* bỏ qua — không chặn UI sau đổi MK */
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCurrentUser();
      const data = res.data.data;
      setUser(data);
      reset({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        middleName: data.middleName || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        countryCode: data.countryCode || "",
        gender: data.gender || "",
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
      });
      setIsEditMode(false);
    } catch {
      toast.error("Không thể tải thông tin tài khoản.");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    if (authUser && isUserContextReady) {
      loadUser();
    }
  }, [authUser, isUserContextReady, loadUser]);

  const onProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      const userData = { ...data };
      if (userData.gender === "") delete userData.gender;
      if (userData.birthDate instanceof Date) {
        userData.birthDate = userData.birthDate.toISOString().split("T")[0];
      }
      formData.append(
        "user",
        new Blob([JSON.stringify(userData)], { type: "application/json" }),
      );
      if (avatarFile) formData.append("file", avatarFile);

      await updateProfile(formData);
      toast.success("Cập nhật thông tin thành công!");
      setAvatarFile(null);
      setPreviewAvatar(null);
      loadUser();
    } catch (err) {
      const msg =
        err.response?.data?.code === "INVALID_PHONE_NUMBER"
          ? "Số điện thoại không đúng định dạng."
          : err.response?.data?.message || "Có lỗi khi cập nhật thông tin.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Backend chỉ set false cho tài khoản chỉ Google; undefined = API cũ → vẫn bắt MK hiện tại */
  const requiresCurrentPassword = user?.passwordSet !== false;
  const googleOnlyNoPassword = user?.passwordSet === false;

  const onPasswordSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const payload = { newPassword: data.newPassword };
      if (requiresCurrentPassword) {
        payload.currentPassword = data.currentPassword;
      }
      await changePassword(payload);
      toast.success(
        googleOnlyNoPassword
          ? "Đã đặt mật khẩu đăng nhập. Bạn có thể đăng nhập bằng email và mật khẩu."
          : "Đổi mật khẩu thành công!",
      );
      resetPassword();
      await refreshUserSnapshot();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi khi đổi mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setIsEditMode(false);
    setAvatarFile(null);
    setPreviewAvatar(null);
    if (user) reset(user);
  };

  if (!authUser && isUserContextReady) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="flex-1 flex-col gap-6 p-4 md:p-8 md:flex max-w-4xl mx-auto w-full">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  const avatarSrc = previewAvatar || user?.avatarUrl;
  const fullName = [user?.lastName, user?.middleName, user?.firstName]
    .filter(Boolean)
    .join(" ");
  const country = countryOptions.find((c) => c.code === user?.countryCode);
  const hasDirtyFields = Object.keys(dirtyFields).length > 0 || !!avatarFile;

  return (
    <div className="flex-1 flex-col gap-6 p-4 md:p-8 md:flex max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Tài khoản</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin cá nhân và bảo mật
        </p>
      </div>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1" /> Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-1" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* ─── Profile Tab ─── */}
        <TabsContent value="profile" className="mt-2 space-y-6">
          {/* Avatar + basic info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  <Avatar className="h-24 w-24 border-2">
                    <AvatarImage src={avatarSrc} alt="Avatar" className="object-cover" />
                    <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                      {user?.firstName?.[0] || user?.lastName?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {isEditMode && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) =>
                          handleFileChange({
                            event: e,
                            setError: setFileError,
                            setFile: setAvatarFile,
                            setPreview: setPreviewAvatar,
                          })
                        }
                      />
                    </label>
                  )}
                </div>

                {/* Name + email + meta */}
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold">
                    {fullName || "Chưa cập nhật tên"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {user?.email}
                    </span>
                    <Badge
                      className={`text-[10px] ${user?.verified ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100"}`}
                    >
                      <Shield className="h-2.5 w-2.5 mr-0.5" />
                      {user?.verified ? "Đã xác thực" : "Chưa xác thực"}
                    </Badge>
                  </div>
                  {fileError && isEditMode && (
                    <p className="text-destructive text-xs mt-1">{fileError}</p>
                  )}
                </div>

                {/* Edit toggle */}
                <div className="shrink-0">
                  {!isEditMode ? (
                    <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                      <Pencil className="h-4 w-4 mr-1" /> Chỉnh sửa
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" /> Hủy
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail info card */}
          <form onSubmit={handleSubmit(onProfileSubmit)}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-medium">Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldWrapper label="Họ" error={errors.lastName}>
                    {isEditMode ? (
                      <Input
                        {...register("lastName", {
                          required: "Họ không được để trống.",
                          maxLength: { value: 50, message: "Tối đa 50 ký tự." },
                        })}
                        placeholder="Nguyễn"
                      />
                    ) : (
                      <FieldValue>{user?.lastName}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Tên đệm" error={errors.middleName}>
                    {isEditMode ? (
                      <Input
                        {...register("middleName", {
                          maxLength: { value: 50, message: "Tối đa 50 ký tự." },
                        })}
                        placeholder="Văn"
                      />
                    ) : (
                      <FieldValue>{user?.middleName}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Tên" error={errors.firstName}>
                    {isEditMode ? (
                      <Input
                        {...register("firstName", {
                          required: "Tên không được để trống.",
                          maxLength: { value: 50, message: "Tối đa 50 ký tự." },
                        })}
                        placeholder="An"
                      />
                    ) : (
                      <FieldValue>{user?.firstName}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label="Quốc gia" icon={Globe}>
                    {isEditMode ? (
                      <Controller
                        name="countryCode"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn quốc gia" />
                            </SelectTrigger>
                            <SelectContent>
                              {countryOptions.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.name} ({c.dialCode})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <FieldValue>{country?.name || null}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Số điện thoại" icon={Phone} error={errors.phone}>
                    {isEditMode ? (
                      <Input
                        {...register("phone", {
                          validate: (value) => {
                            if (value && countryCode) {
                              const c = countryOptions.find((o) => o.code === countryCode);
                              if (c && !new RegExp(c.phonePattern).test(value))
                                return "Số điện thoại không đúng định dạng.";
                            }
                            return true;
                          },
                        })}
                        placeholder="0912345678"
                      />
                    ) : (
                      <FieldValue>{user?.phone}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Address */}
                <FieldWrapper label="Địa chỉ" icon={MapPin} error={errors.address}>
                  {isEditMode ? (
                    <Input {...register("address")} placeholder="123 Đường ABC" />
                  ) : (
                    <FieldValue>{user?.address}</FieldValue>
                  )}
                </FieldWrapper>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldWrapper label="Thành phố" error={errors.city}>
                    {isEditMode ? (
                      <Input {...register("city")} placeholder="TP. Hồ Chí Minh" />
                    ) : (
                      <FieldValue>{user?.city}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Tỉnh / Bang" error={errors.state}>
                    {isEditMode ? (
                      <Input {...register("state")} placeholder="" />
                    ) : (
                      <FieldValue>{user?.state}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Mã bưu điện" error={errors.zipCode}>
                    {isEditMode ? (
                      <Input
                        {...register("zipCode", {
                          maxLength: { value: 10, message: "Tối đa 10 ký tự." },
                        })}
                        placeholder="70000"
                      />
                    ) : (
                      <FieldValue>{user?.zipCode}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Gender & Birth date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label="Giới tính">
                    {isEditMode ? (
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">Nam</SelectItem>
                              <SelectItem value="FEMALE">Nữ</SelectItem>
                              <SelectItem value="OTHER">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <FieldValue>{GENDER_MAP[user?.gender] || null}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label="Ngày sinh">
                    {isEditMode ? (
                      <Controller
                        name="birthDate"
                        control={control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value
                                  ? format(field.value, "dd/MM/yyyy", { locale: vi })
                                  : "Chọn ngày sinh"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={vi}
                                captionLayout="dropdown-buttons"
                                fromYear={1940}
                                toYear={new Date().getFullYear()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                    ) : (
                      <FieldValue>
                        {user?.birthDate
                          ? format(new Date(user.birthDate), "dd/MM/yyyy", { locale: vi })
                          : null}
                      </FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                {/* Actions */}
                {isEditMode && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !hasDirtyFields}>
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
          </form>
        </TabsContent>

        {/* ─── Security Tab ─── */}
        <TabsContent value="security" className="mt-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-medium">
                {googleOnlyNoPassword ? "Đặt mật khẩu đăng nhập" : "Đổi mật khẩu"}
              </CardTitle>
              {googleOnlyNoPassword ? (
                <p className="text-sm text-muted-foreground font-normal pt-1">
                  Tài khoản của bạn đăng nhập qua Google và chưa có mật khẩu cục bộ.
                  Đặt mật khẩu bên dưới nếu bạn muốn đăng nhập thêm bằng email và mật
                  khẩu (vẫn có thể dùng Google như hiện tại).
                </p>
              ) : null}
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                className="max-w-md space-y-4"
              >
                {requiresCurrentPassword ? (
                  <FieldWrapper
                    label="Mật khẩu hiện tại"
                    error={passwordErrors.currentPassword}
                  >
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        {...registerPassword("currentPassword", {
                          required: "Không được để trống.",
                        })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        tabIndex={-1}
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FieldWrapper>
                ) : null}

                <FieldWrapper
                  label="Mật khẩu mới"
                  error={passwordErrors.newPassword}
                >
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      {...registerPassword("newPassword", {
                        required: "Không được để trống.",
                        minLength: { value: 6, message: "Ít nhất 6 ký tự." },
                      })}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowNewPw(!showNewPw)}
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FieldWrapper>

                <FieldWrapper
                  label="Xác nhận mật khẩu mới"
                  error={passwordErrors.confirmNewPassword}
                >
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      {...registerPassword("confirmNewPassword", {
                        validate: (value) => {
                          const newPw = watchPassword("newPassword");
                          return value === newPw || "Mật khẩu không khớp.";
                        },
                      })}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      tabIndex={-1}
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FieldWrapper>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (requiresCurrentPassword && !watchPassword("currentPassword")) ||
                      !watchPassword("newPassword") ||
                      !watchPassword("confirmNewPassword")
                    }
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Lock className="h-4 w-4 mr-1" />
                    )}
                    {isSubmitting
                      ? "Đang xử lý..."
                      : googleOnlyNoPassword
                        ? "Đặt mật khẩu"
                        : "Đổi mật khẩu"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function FieldWrapper({ label, icon: IconComp, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        {IconComp && <IconComp className="h-3.5 w-3.5" />}
        {label}
      </Label>
      {children}
      {error && <p className="text-destructive text-xs">{error.message}</p>}
    </div>
  );
}

function FieldValue({ children }) {
  return (
    <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 min-h-9 flex items-center">
      {children || <span className="text-muted-foreground">Chưa cập nhật</span>}
    </p>
  );
}

export default AccountPage;
