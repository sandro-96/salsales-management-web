import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { getCurrentUser, updateProfile, changePassword } from "../api/userApi";
import { useAuth } from "../hooks/useAuth";
import { useShop } from "../hooks/useShop";
import { Navigate } from "react-router-dom";
import imageCompression from "browser-image-compression";

const AccountPage = () => {
  const { user: authUser } = useAuth();
  const { selectedShop } = useShop();

  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const countryOptions = [
    { value: "VN", label: "Việt Nam (+84)", phonePattern: "^0(3|5|7|8|9)\\d{8}$" },
    { value: "US", label: "Hoa Kỳ (+1)", phonePattern: "^\\d{10}$" },
    { value: "JP", label: "Nhật Bản (+81)", phonePattern: "^\\d{10}$" },
    { value: "KR", label: "Hàn Quốc (+82)", phonePattern: "^\\d{9,10}$" },
  ];

  const genderOptions = [
    { value: "", label: "Chưa chọn" },
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
  ];

  const countryCode = watch("countryCode"); // Theo dõi countryCode để validate phone

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
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Có lỗi khi đổi mật khẩu.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
      loadUser();
      setAvatarFile(null);
      setPreviewAvatar(null);
      setError("");
    }
  };

  if (!authUser || !selectedShop) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Thông tin tài khoản</h1>
      <p className="text-gray-600 mb-4">
        Email: {user.email} {user.verified ? "(Đã xác thực)" : "(Chưa xác thực)"}
      </p>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 border rounded ${tab === "profile" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => setTab("profile")}
        >
          Hồ sơ
        </button>
        <button
          className={`px-4 py-2 border rounded ${tab === "password" ? "bg-blue-500 text-white" : ""}`}
          onClick={() => setTab("password")}
        >
          Đổi mật khẩu
        </button>
      </div>

      {tab === "profile" && (
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Tên</label>
            <input
              {...register("firstName", {
                required: "Tên không được để trống.",
                maxLength: { value: 50, message: "Tên không được vượt quá 50 ký tự." },
              })}
              className={`border p-2 w-full rounded ${errors.firstName ? "border-red-500" : ""}`}
            />
            {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Họ</label>
            <input
              {...register("lastName", {
                required: "Họ không được để trống.",
                maxLength: { value: 50, message: "Họ không được vượt quá 50 ký tự." },
              })}
              className={`border p-2 w-full rounded ${errors.lastName ? "border-red-500" : ""}`}
            />
            {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tên đệm</label>
            <input
              {...register("middleName", {
                maxLength: { value: 50, message: "Tên đệm không được vượt quá 50 ký tự." },
              })}
              className={`border p-2 w-full rounded ${errors.middleName ? "border-red-500" : ""}`}
            />
            {errors.middleName && <p className="text-red-500 text-xs">{errors.middleName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
            <select
              {...register("countryCode")}
              className={`border p-2 w-full rounded ${errors.countryCode ? "border-red-500" : ""}`}
            >
              <option value="">Chọn mã quốc gia</option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.countryCode && <p className="text-red-500 text-xs">{errors.countryCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input
              {...register("phone", {
                validate: (value) => {
                  if (value && countryCode) {
                    const country = countryOptions.find((c) => c.value === countryCode);
                    if (country && !new RegExp(country.phonePattern).test(value)) {
                      return "Số điện thoại không đúng định dạng.";
                    }
                  }
                  return true;
                },
              })}
              className={`border p-2 w-full rounded ${errors.phone ? "border-red-500" : ""}`}
            />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Địa chỉ</label>
            <input
              {...register("address")}
              className={`border p-2 w-full rounded ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Thành phố</label>
            <input
              {...register("city")}
              className={`border p-2 w-full rounded ${errors.city ? "border-red-500" : ""}`}
            />
            {errors.city && <p className="text-red-500 text-xs">{errors.city.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bang/Tỉnh</label>
            <input
              {...register("state")}
              className={`border p-2 w-full rounded ${errors.state ? "border-red-500" : ""}`}
            />
            {errors.state && <p className="text-red-500 text-xs">{errors.state.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mã bưu điện</label>
            <input
              {...register("zipCode", {
                maxLength: { value: 10, message: "Mã bưu điện không được vượt quá 10 ký tự." },
              })}
              className={`border p-2 w-full rounded ${errors.zipCode ? "border-red-500" : ""}`}
            />
            {errors.zipCode && <p className="text-red-500 text-xs">{errors.zipCode.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Giới tính</label>
            <select
              {...register("gender")}
              className={`border p-2 w-full rounded ${errors.gender ? "border-red-500" : ""}`}
            >
              {genderOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ảnh đại diện</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="border p-2 w-full rounded"
            />
            {previewAvatar && (
              <img src={previewAvatar} alt="Avatar Preview" className="w-24 h-24 rounded-full mt-2" />
            )}
            {user.avatarUrl && !previewAvatar && (
              <img src={`${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${user.avatarUrl}`} alt="Avatar" className="w-24 h-24 rounded-full mt-2" />
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-green-500 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      )}

      {tab === "password" && (
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              {...registerPassword("currentPassword", {
                required: "Mật khẩu hiện tại không được để trống.",
              })}
              className={`border p-2 w-full rounded ${passwordErrors.currentPassword ? "border-red-500" : ""}`}
            />
            {passwordErrors.currentPassword && (
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
            />
            {passwordErrors.newPassword && (
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
            />
            {passwordErrors.confirmNewPassword && (
              <p className="text-red-500 text-xs">{passwordErrors.confirmNewPassword.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-yellow-500 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "Đang đổi..." : "Đổi mật khẩu"}
          </button>
        </form>
      )}

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default AccountPage;