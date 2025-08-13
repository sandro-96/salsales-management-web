import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { getCurrentUser, updateProfile, changePassword } from "../api/userApi";
import { useAuth } from "../hooks/useAuth";
import { useShop } from "../hooks/useShop";
import { Navigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import {useAlert} from "../hooks/useAlert.js";
import {ALERT_TYPES} from "../constants/alertTypes.js";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";

const AccountPage = () => {
  const { user: authUser, enums } = useAuth();
  const { selectedShop } = useShop();
  const { showAlert } = useAlert();

  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
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
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const countryOptions = enums?.countries || [];
  const genderOptions = [
    { value: "", label: "Chưa chọn" },
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
  ];

  const countryCode = watch("countryCode");

  useEffect(() => {
    if (authUser && selectedShop) {
      loadUser();
    }
  }, [authUser, selectedShop]);

  const loadUser = async () => {
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
      });
      setIsEditMode(false); // Reset to view mode after loading
    } catch (err) {
      setError("Không thể tải thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const MAX_FILE_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.");
      setAvatarFile(null);
      setPreviewAvatar(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Ảnh vượt quá ${MAX_FILE_SIZE_MB}MB. Đang tiến hành nén ảnh...`);
      try {
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        setAvatarFile(compressedFile);
        setPreviewAvatar(URL.createObjectURL(compressedFile));
        setError("");
      } catch (err) {
        setError("Nén ảnh thất bại. Vui lòng chọn ảnh nhỏ hơn.");
        setAvatarFile(null);
        setPreviewAvatar(null);
      }
      return;
    }

    setAvatarFile(selectedFile);
    setPreviewAvatar(URL.createObjectURL(selectedFile));
    setError("");
  };

  const onProfileSubmit = async (data) => {
    try {
      setError("");
      setIsSubmitting(true);
      const formData = new FormData();
      const userData = { ...data };
      if (userData.gender === "") {
        delete userData.gender;
      }
      formData.append("user", new Blob([JSON.stringify(userData)], { type: "application/json" }));
      if (avatarFile) {
        formData.append("file", avatarFile);
      }

      await updateProfile(formData);
      setMessage("Cập nhật thông tin thành công!");
      setAvatarFile(null);
      setPreviewAvatar(null);
      setIsEditMode(false);
      loadUser();
    } catch (err) {
      const errorMessage =
          err.response?.data?.code === "INVALID_PHONE_NUMBER"
              ? "Số điện thoại không đúng định dạng."
              : err.response?.data?.message || "Có lỗi khi cập nhật thông tin.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      setError("");
      setIsSubmitting(true);
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setMessage("Đổi mật khẩu thành công!");
      resetPassword();
      setIsEditMode(false); // Switch back to view mode after save
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Có lỗi khi đổi mật khẩu.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (Object.keys(dirtyFields).length > 0) {
      showAlert({
        title: "Huỷ thay đổi",
        description: "Bạn có chắc muốn hủy các thay đổi? Các thay đổi sẽ không được lưu.",
        type: ALERT_TYPES.WARNING,
        variant: "modal",
        actions: [
          {
            label: "Hủy",
            className: "bg-gray-200 text-gray-800"
          },
          {
            label: "ok",
            className: "bg-red-500 text-white hover:bg-red-600",
            onClick: () => {
              resetForm();
            }
          },
        ],
      });
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setAvatarFile(null);
    setPreviewAvatar(null);
    setError("");
    setIsEditMode(false);
    reset(user);
  }

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // Reset form when exiting edit mode
      reset(user);
      setAvatarFile(null);
      setPreviewAvatar(null);
    } else {
      // Reset form with current user data when entering edit mode
      reset(user);
    }
  };

  if (!authUser || !selectedShop) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <p className="text-center">Đang tải...</p>;

  return (
      <div className="p-4 max-w-4xl mx-auto">
        {
          isSubmitting && <LoadingOverlay text="Đang tải thông tin tài khoản..." />
        }
        <h1 className="text-2xl font-bold mb-4">Thông tin tài khoản</h1>
        <p className="text-gray-600 mb-4">
          Email: {user.email} {user.verified ? "(Đã xác thực)" : "(Chưa xác thực)"}
        </p>

        {/* Sticky Tabs with Hover Effect */}
        <div className="sticky top-0 bg-white z-10 flex gap-2 mb-4 border-b pb-2">
          <button
              className={`px-4 py-2 rounded ${tab === "profile" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              onClick={() => setTab("profile")}
          >
            Hồ sơ
          </button>
          <button
              className={`px-4 py-2 rounded ${tab === "password" ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
              onClick={() => setTab("password")}
          >
            Đổi mật khẩu
          </button>
        </div>

        {/* Profile Form */}
        {tab === "profile" && (
            <div>
              {!isEditMode && (
                  <button
                      onClick={handleEditToggle}
                      className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                  >
                    Chỉnh sửa
                  </button>
              )}
              <form
                  onSubmit={handleSubmit(onProfileSubmit)}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                  style={{ display: isEditMode ? "grid" : "none" }}
              >
                {/* Left and Center Columns: Personal Info */}
                <div className="col-span-2 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Họ</label>
                      <input
                          {...register("lastName", {
                            required: "Họ không được để trống.",
                            maxLength: { value: 50, message: "Họ không được vượt quá 50 ký tự." },
                          })}
                          className={`border p-2 w-full rounded ${errors.lastName ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.lastName && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.lastName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên</label>
                      <input
                          {...register("firstName", {
                            required: "Tên không được để trống.",
                            maxLength: { value: 50, message: "Tên không được vượt quá 50 ký tự." },
                          })}
                          className={`border p-2 w-full rounded ${errors.firstName ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.firstName && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tên đệm</label>
                      <input
                          {...register("middleName", {
                            maxLength: { value: 50, message: "Tên đệm không được vượt quá 50 ký tự." },
                          })}
                          className={`border p-2 w-full rounded ${errors.middleName ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.middleName && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.middleName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
                      <select
                          {...register("countryCode")}
                          className={`border p-2 w-full rounded ${errors.countryCode ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      >
                        <option value="">Chọn mã quốc gia</option>
                        {countryOptions.map((option) => (
                            <option key={option.code} value={option.code}>
                              {option.name} ({option.dialCode})
                            </option>
                        ))}
                      </select>
                      {errors.countryCode && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.countryCode.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                      <input
                          {...register("phone", {
                            validate: (value) => {
                              if (value && countryCode) {
                                const country = countryOptions.find((c) => c.code === countryCode);
                                if (country && !new RegExp(country.phonePattern).test(value)) {
                                  return "Số điện thoại không đúng định dạng.";
                                }
                              }
                              return true;
                            },
                          })}
                          className={`border p-2 w-full rounded ${errors.phone ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.phone && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                    <input
                        {...register("address")}
                        className={`border p-2 w-full rounded ${errors.address ? "border-red-500" : ""}`}
                        disabled={!isEditMode}
                    />
                    {errors.address && isEditMode && (
                        <p className="text-red-500 text-xs">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Thành phố</label>
                      <input
                          {...register("city")}
                          className={`border p-2 w-full rounded ${errors.city ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.city && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.city.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bang/Tỉnh</label>
                      <input
                          {...register("state")}
                          className={`border p-2 w-full rounded ${errors.state ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.state && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.state.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mã bưu điện</label>
                      <input
                          {...register("zipCode", {
                            maxLength: { value: 10, message: "Mã bưu điện không được vượt quá 10 ký tự." },
                          })}
                          className={`border p-2 w-full rounded ${errors.zipCode ? "border-red-500" : ""}`}
                          disabled={!isEditMode}
                      />
                      {errors.zipCode && isEditMode && (
                          <p className="text-red-500 text-xs">{errors.zipCode.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Giới tính</label>
                    <select
                        {...register("gender")}
                        className={`border p-2 w-full rounded ${errors.gender ? "border-red-500" : ""}`}
                        disabled={!isEditMode}
                    >
                      {genderOptions.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                      ))}
                    </select>
                    {errors.gender && isEditMode && (
                        <p className="text-red-500 text-xs">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Avatar and Actions */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
                    {previewAvatar || user.avatarUrl ? (
                        <img
                            src={
                                previewAvatar ||
                                `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${user.avatarUrl}`
                            }
                            alt="Avatar"
                            className="w-40 h-40 rounded-full mx-auto mb-2"
                        />
                    ) : (
                        <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                          <span className="text-gray-500">No Avatar</span>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="border p-2 w-full rounded"
                        disabled={!isEditMode}
                    />
                  </div>
                  {isEditMode && (
                      <div className="flex gap-2 justify-center">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="bg-gray-400 text-white px-4 py-2 rounded"
                        >
                          Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || Object.keys(dirtyFields).length === 0}
                            className={`bg-green-500 text-white px-4 py-2 rounded ${isSubmitting || Object.keys(dirtyFields).length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                  )}
                </div>
              </form>

              {/* View Mode Display */}
              {!isEditMode && tab === "profile" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Họ</label>
                          <p className="border p-2 rounded bg-gray-100">{user.lastName || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tên</label>
                          <p className="border p-2 rounded bg-gray-100">{user.firstName || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Tên đệm</label>
                          <p className="border p-2 rounded bg-gray-100">{user.middleName || "Chưa cập nhật"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
                          <p className="border p-2 rounded bg-gray-100">
                            {countryOptions.find((c) => c.code === user.countryCode)?.name || "Chưa cập nhật"} ({user.countryCode})
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                          <p className="border p-2 rounded bg-gray-100">{user.phone || "Chưa cập nhật"}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                        <p className="border p-2 rounded bg-gray-100">{user.address || "Chưa cập nhật"}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-sm font-medium mb-1">Thành phố</label>
                          <p className="border p-2 rounded bg-gray-100">{user.city || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Bang/Tỉnh</label>
                          <p className="border p-2 rounded bg-gray-100">{user.state || "Chưa cập nhật"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Mã bưu điện</label>
                          <p className="border p-2 rounded bg-gray-100">{user.zipCode || "Chưa cập nhật"}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Giới tính</label>
                        <p className="border p-2 rounded bg-gray-100">
                          {genderOptions.find((g) => g.value === user.gender)?.label || "Chưa cập nhật"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
                        {user.avatarUrl ? (
                            <img
                                src={`${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${user.avatarUrl}`}
                                alt="Avatar"
                                className="w-40 h-40 rounded-full mx-auto mb-2"
                            />
                        ) : (
                            <div className="w-40 h-40 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-2">
                              <span className="text-gray-500">No Avatar</span>
                            </div>
                        )}
                      </div>
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* Password Form */}
        {tab === "password" && (
            <div>
              {!isEditMode && (
                  <button
                      onClick={handleEditToggle}
                      className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
                  >
                    Chỉnh sửa
                  </button>
              )}
              <form
                  onSubmit={handlePasswordSubmit(onPasswordSubmit)}
                  className="space-y-3 max-w-md mx-auto"
                  style={{ display: isEditMode ? "block" : "none" }}
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
                  <input
                      type="password"
                      {...registerPassword("currentPassword", {
                        required: "Mật khẩu hiện tại không được để trống.",
                      })}
                      className={`border p-2 w-full rounded ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
                      disabled={!isEditMode}
                  />
                  {passwordErrors.currentPassword && isEditMode && (
                      <p className="text-red-500 text-xs">{passwordErrors.currentPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                  <input
                      type="password"
                      {...registerPassword("newPassword", {
                        required: "Mật khẩu mới không được để trống.",
                        minLength: { value: 6, message: "Mật khẩu mới phải có ít nhất 6 ký tự." },
                      })}
                      className={`border p-2 w-full rounded ${passwordErrors.newPassword ? "border-red-500" : ""}`}
                      disabled={!isEditMode}
                  />
                  {passwordErrors.newPassword && isEditMode && (
                      <p className="text-red-500 text-xs">{passwordErrors.newPassword.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
                  <input
                      type="password"
                      {...registerPassword("confirmNewPassword", {
                        validate: (value, { newPassword }) =>
                            value === newPassword || "Mật khẩu mới và xác nhận mật khẩu không khớp.",
                      })}
                      className={`border p-2 w-full rounded ${passwordErrors.confirmNewPassword ? "border-red-500" : ""}`}
                      disabled={!isEditMode}
                  />
                  {passwordErrors.confirmNewPassword && isEditMode && (
                      <p className="text-red-500 text-xs">{passwordErrors.confirmNewPassword.message}</p>
                  )}
                </div>
                {isEditMode && (
                    <button
                        type="submit"
                        disabled={isSubmitting || !watch("currentPassword") || !watch("newPassword") || !watch("confirmNewPassword")}
                        className={`bg-yellow-500 text-white px-4 py-2 rounded w-full ${isSubmitting || !watch("currentPassword") || !watch("newPassword") || !watch("confirmNewPassword") ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
                    </button>
                )}
              </form>

              {!isEditMode && tab === "password" && (
                  <div className="max-w-md mx-auto space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
                      <p className="border p-2 rounded bg-gray-100">••••••••</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                      <p className="border p-2 rounded bg-gray-100">Chưa cập nhật</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label>
                      <p className="border p-2 rounded bg-gray-100">Chưa cập nhật</p>
                    </div>
                  </div>
              )}
            </div>
        )}

        {/* Toast Notifications with Auto-Hide */}
        {message && (
            <div
                className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300"
                onAnimationEnd={() => setMessage("")}
                style={{ animation: "fadeOut 3s forwards" }}
            />
        )}
        {error && (
            <div
                className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg transition-opacity duration-300"
                onAnimationEnd={() => setError("")}
                style={{ animation: "fadeOut 3s forwards" }}
            />
        )}
      </div>
  );
};

// CSS Animation for Toast
const styles = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

// Inject CSS
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default AccountPage;