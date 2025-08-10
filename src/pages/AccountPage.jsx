import React, { useState, useEffect } from "react";
import { getCurrentUser, updateProfile, changePassword } from "../api/userApi";
import { useAuth } from "../hooks/useAuth";
import { useShop } from "../hooks/useShop";
import { Navigate } from "react-router-dom";

const AccountPage = () => {
  const { user: authUser } = useAuth();
  const { selectedShop } = useShop();

  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");

  const genderOptions = [
    { value: "", label: "Chưa chọn" },
    { value: "male", label: "Nam" },
    { value: "female", label: "Nữ" },
    { value: "other", label: "Khác" },
  ];

  const timezoneOptions = [
    { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+7)" },
    { value: "UTC", label: "UTC" },
    { value: "America/New_York", label: "America/New_York (GMT-5)" },
    { value: "Europe/London", label: "Europe/London (GMT+0)" },
  ];

  const languageOptions = [
    { value: "vi", label: "Tiếng Việt" },
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
  ];

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
      setForm({
        fullName: data.fullName || "",
        phone: data.phone || "",
        businessType: data.businessType || "",
        city: data.city || "",
        state: data.state || "",
        zipCode: data.zipCode || "",
        timezone: data.timezone || "",
        currency: data.currency || "",
        language: data.language || "",
        address: data.address || "",
        countryCode: data.countryCode || "",
        gender: data.gender || "",
        birthDate: data.birthDate || "",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleProfileUpdate = async () => {
    try {
      await updateProfile(form);
      setMessage("Cập nhật thông tin thành công!");
      loadUser();
    } catch (err) {
      setMessage("Có lỗi khi cập nhật thông tin.");
    }
  };

  const handlePasswordChange = async () => {
    try {
      await changePassword(passwordForm);
      setMessage("Đổi mật khẩu thành công!");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setMessage("Có lỗi khi đổi mật khẩu.");
    }
  };

  if (!authUser || !selectedShop) {
    return <Navigate to="/login" replace />;
  }

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Thông tin tài khoản</h1>

      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 border rounded ${
            tab === "profile" ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() => setTab("profile")}
        >
          Hồ sơ
        </button>
        <button
          className={`px-4 py-2 border rounded ${
            tab === "password" ? "bg-blue-500 text-white" : ""
          }`}
          onClick={() => setTab("password")}
        >
          Đổi mật khẩu
        </button>
      </div>

      {tab === "profile" && (
        <div className="space-y-3">
          <input
            name="fullName"
            placeholder="Họ và tên"
            value={form.fullName}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          <input
            name="phone"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            {genderOptions.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          <select
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            {timezoneOptions.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <select
            name="language"
            value={form.language}
            onChange={handleChange}
            className="border p-2 w-full"
          >
            {languageOptions.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleProfileUpdate}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Lưu thay đổi
          </button>
        </div>
      )}

      {tab === "password" && (
        <div className="space-y-3">
          <input
            type="password"
            name="currentPassword"
            placeholder="Mật khẩu hiện tại"
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                currentPassword: e.target.value,
              })
            }
            className="border p-2 w-full"
          />
          <input
            type="password"
            name="newPassword"
            placeholder="Mật khẩu mới"
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                newPassword: e.target.value,
              })
            }
            className="border p-2 w-full"
          />
          <button
            onClick={handlePasswordChange}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            Đổi mật khẩu
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-blue-600">{message}</p>}
    </div>
  );
};

export default AccountPage;
