import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
  buildUpdateProfileFormData,
} from "../api/userApi";
import { resolveApiError } from "../utils/apiMessage.js";
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
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
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

const AccountPage = () => {
  const { user: authUser, enums, isUserContextReady } = useAuth();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("en") ? enUS : vi;

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
  const emptyLabel = t("pages.accounts.notUpdated");

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
      toast.error(t("pages.accounts.toast.loadFail"));
    } finally {
      setLoading(false);
    }
  }, [reset, t]);

  useEffect(() => {
    if (authUser && isUserContextReady) {
      loadUser();
    }
  }, [authUser, isUserContextReady, loadUser]);

  const onProfileSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const userData = { ...data };
      if (userData.gender === "") delete userData.gender;
      if (!String(userData.phone ?? "").trim()) {
        delete userData.phone;
        delete userData.countryCode;
      }
      if (userData.birthDate instanceof Date) {
        userData.birthDate = userData.birthDate.toISOString().split("T")[0];
      }
      const formData = buildUpdateProfileFormData(userData, avatarFile);

      await updateProfile(formData);
      toast.success(t("pages.accounts.toast.updateSuccess"));
      setAvatarFile(null);
      setPreviewAvatar(null);
      loadUser();
    } catch (err) {
      const msg =
        resolveApiError(t, err) || t("pages.accounts.toast.updateFail");
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
          ? t("pages.accounts.toast.passwordSetSuccess")
          : t("pages.accounts.toast.passwordChangeSuccess"),
      );
      resetPassword();
      await refreshUserSnapshot();
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("pages.accounts.toast.passwordChangeFail"),
      );
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
        <ListPageHeader
          icon={User}
          title={t("pages.accounts.title")}
          subtitle={t("pages.accounts.subtitle")}
        />
      </div>

      <Tabs defaultValue="profile" className="gap-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1" /> {t("pages.accounts.tabs.profile")}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-1" /> {t("pages.accounts.tabs.security")}
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
                    {fullName || t("pages.accounts.nameNotSet")}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {user?.email}
                    </span>
                    <Badge
                      className={`text-[10px] ${user?.verified ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15" : "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40 dark:hover:bg-amber-500/15"}`}
                    >
                      <Shield className="h-2.5 w-2.5 mr-0.5" />
                      {user?.verified ? t("pages.accounts.verified") : t("pages.accounts.unverified")}
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
                      <Pencil className="h-4 w-4 mr-1" /> {t("pages.accounts.edit")}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" /> {t("pages.accounts.cancel")}
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
                <CardTitle className="text-base font-medium">
                  {t("pages.accounts.profile.personalInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldWrapper label={t("pages.accounts.profile.lastNameRequired")} error={errors.lastName}>
                    {isEditMode ? (
                      <Input
                        {...register("lastName", {
                          required: t("pages.accounts.validation.lastNameRequired"),
                          maxLength: { value: 50, message: t("pages.accounts.validation.max50") },
                        })}
                        placeholder={t("pages.accounts.profile.placeholders.lastName")}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.lastName}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.middleName")} error={errors.middleName}>
                    {isEditMode ? (
                      <Input
                        {...register("middleName", {
                          maxLength: { value: 50, message: t("pages.accounts.validation.max50") },
                        })}
                        placeholder={t("pages.accounts.profile.placeholders.middleName")}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.middleName}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.firstNameRequired")} error={errors.firstName}>
                    {isEditMode ? (
                      <Input
                        {...register("firstName", {
                          required: t("pages.accounts.validation.firstNameRequired"),
                          maxLength: { value: 50, message: t("pages.accounts.validation.max50") },
                        })}
                        placeholder={t("pages.accounts.profile.placeholders.firstName")}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.firstName}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label={t("pages.accounts.profile.country")} icon={Globe}>
                    {isEditMode ? (
                      <Controller
                        name="countryCode"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("pages.accounts.profile.selectCountry")} />
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
                      <FieldValue emptyLabel={emptyLabel}>{country?.name || null}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.phone")} icon={Phone} error={errors.phone}>
                    {isEditMode ? (
                      <Input
                        {...register("phone", {
                          validate: (value) => {
                            if (value && countryCode) {
                              const c = countryOptions.find((o) => o.code === countryCode);
                              if (c && !new RegExp(c.phonePattern).test(value))
                                return t("pages.accounts.validation.phoneInvalid");
                            }
                            return true;
                          },
                        })}
                        placeholder={t("pages.accounts.profile.placeholders.phone")}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.phone}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Address */}
                <FieldWrapper label={t("pages.accounts.profile.address")} icon={MapPin} error={errors.address}>
                  {isEditMode ? (
                    <Input {...register("address")} placeholder={t("pages.accounts.profile.placeholders.address")} />
                  ) : (
                    <FieldValue emptyLabel={emptyLabel}>{user?.address}</FieldValue>
                  )}
                </FieldWrapper>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FieldWrapper label={t("pages.accounts.profile.city")} error={errors.city}>
                    {isEditMode ? (
                      <Input {...register("city")} placeholder={t("pages.accounts.profile.placeholders.city")} />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.city}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.state")} error={errors.state}>
                    {isEditMode ? (
                      <Input {...register("state")} placeholder="" />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.state}</FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.zipCode")} error={errors.zipCode}>
                    {isEditMode ? (
                      <Input
                        {...register("zipCode", {
                          maxLength: { value: 10, message: t("pages.accounts.validation.max10") },
                        })}
                        placeholder={t("pages.accounts.profile.placeholders.zipCode")}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>{user?.zipCode}</FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                <Separator />

                {/* Gender & Birth date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FieldWrapper label={t("pages.accounts.profile.gender")}>
                    {isEditMode ? (
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("pages.accounts.profile.selectGender")} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MALE">{t("pages.accounts.gender.MALE")}</SelectItem>
                              <SelectItem value="FEMALE">{t("pages.accounts.gender.FEMALE")}</SelectItem>
                              <SelectItem value="OTHER">{t("pages.accounts.gender.OTHER")}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <FieldValue emptyLabel={emptyLabel}>
                        {user?.gender ? t(`pages.accounts.gender.${user.gender}`) : null}
                      </FieldValue>
                    )}
                  </FieldWrapper>
                  <FieldWrapper label={t("pages.accounts.profile.birthDate")}>
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
                                  ? format(field.value, "dd/MM/yyyy", { locale: dateLocale })
                                  : t("pages.accounts.profile.selectBirthDate")}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={dateLocale}
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
                      <FieldValue emptyLabel={emptyLabel}>
                        {user?.birthDate
                          ? format(new Date(user.birthDate), "dd/MM/yyyy", { locale: dateLocale })
                          : null}
                      </FieldValue>
                    )}
                  </FieldWrapper>
                </div>

                {/* Actions */}
                {isEditMode && (
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      {t("pages.accounts.cancel")}
                    </Button>
                    <Button type="submit" disabled={isSubmitting || !hasDirtyFields}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      {isSubmitting ? t("pages.accounts.saving") : t("pages.accounts.save")}
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
                {googleOnlyNoPassword
                  ? t("pages.accounts.security.setPassword")
                  : t("pages.accounts.security.changePassword")}
              </CardTitle>
              {googleOnlyNoPassword ? (
                <p className="text-sm text-muted-foreground font-normal pt-1">
                  {t("pages.accounts.security.googleOnlyHint")}
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
                    label={t("pages.accounts.security.currentPassword")}
                    error={passwordErrors.currentPassword}
                  >
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        {...registerPassword("currentPassword", {
                          required: t("pages.accounts.validation.required"),
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
                  label={t("pages.accounts.security.newPassword")}
                  error={passwordErrors.newPassword}
                >
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      {...registerPassword("newPassword", {
                        required: t("pages.accounts.validation.required"),
                        minLength: { value: 6, message: t("pages.accounts.validation.passwordMin") },
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
                  label={t("pages.accounts.security.confirmPassword")}
                  error={passwordErrors.confirmNewPassword}
                >
                  <div className="relative">
                    <Input
                      type={showConfirmPw ? "text" : "password"}
                      {...registerPassword("confirmNewPassword", {
                        validate: (value) => {
                          const newPw = watchPassword("newPassword");
                          return value === newPw || t("pages.accounts.validation.passwordMismatch");
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
                      ? t("pages.accounts.processing")
                      : googleOnlyNoPassword
                        ? t("pages.accounts.security.setPasswordBtn")
                        : t("pages.accounts.security.changePasswordBtn")}
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

function FieldValue({ children, emptyLabel }) {
  return (
    <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 min-h-9 flex items-center">
      {children || <span className="text-muted-foreground">{emptyLabel}</span>}
    </p>
  );
}

export default AccountPage;
