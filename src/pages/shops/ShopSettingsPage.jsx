import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../../hooks/useShop.js";
import { FaStore, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import axiosInstance from "../../api/axiosInstance";
import { ALERT_TYPES } from "../../constants/alertTypes";
import { useAlert } from "../../hooks/useAlert";

const sidebarColor = "#34516dff";

const ShopSettingsPage = () => {
  const { showAlert } = useAlert();
  const { selectedShop, enums } = useShop();
  const [editMode, setEditMode] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [form, setForm] = useState({});
  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

  const [file, setFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(
    selectedShop?.logoUrl
      ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
      : null
  );

  useEffect(() => {
    if (selectedShop) {
      const newState = {
        name: selectedShop.name || "",
        industry: selectedShop.industry || "",
        type: selectedShop.type || "",
        countryCode: selectedShop.countryCode || "",
        phone: selectedShop.phone || "",
        address: selectedShop.address || "",
        active: selectedShop.active || false,
        businessModel:
          selectedShop.businessModel ||
          shopTypes.find((s) => s.value === selectedShop.type)?.defaultBusinessModel ||
          "",
      };
      setForm(newState);
      setInitialFormState(newState);
      setPreviewLogo(
        selectedShop.logoUrl
          ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
          : null
      );
      setFile(null);
      setSubmitError("");
      setErrors({});
    }
  }, [selectedShop]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const MAX_FILE_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setSubmitError("Chỉ hỗ trợ định dạng ảnh JPG và PNG.");
      setFile(null);
      setPreviewLogo(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setSubmitError(`Ảnh vượt quá ${MAX_FILE_SIZE_MB}MB. Đang tiến hành nén ảnh...`);
      try {
        const compressedFile = await imageCompression(selectedFile, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
        setFile(compressedFile);
        setPreviewLogo(URL.createObjectURL(compressedFile));
        setSubmitError("");
      } catch (err) {
        console.error("Lỗi khi nén ảnh:", err);
        setSubmitError("Nén ảnh thất bại. Vui lòng chọn ảnh nhỏ hơn.");
        setFile(null);
        setPreviewLogo(null);
      }
      return;
    }

    setFile(selectedFile);
    setPreviewLogo(URL.createObjectURL(selectedFile));
    setSubmitError("");
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập tên cửa hàng";
    if (!form.countryCode.trim()) newErrors.countryCode = "Vui lòng nhập mã quốc gia";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    if (!form.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;

    try {
      const formData = new FormData();
      const shopData = {
        name: form.name,
        type: form.type,
        address: form.address,
        phone: form.phone,
        countryCode: form.countryCode,
        businessModel: form.businessModel,
      };
      formData.append("shop", new Blob([JSON.stringify(shopData)], { type: "application/json" }));

      if (file) {
        formData.append("file", file);
      }

      const res = await axiosInstance.put(`/shop/${selectedShop.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        showAlert({
          title: "Cập nhật thành công",
          type: ALERT_TYPES.SUCCESS,
          duration: 3000,
          variant: "toast",
          position: "top-right",
        });
      } else {
        setSubmitError(res.data.message || "Tạo cửa hàng thất bại.");
      }

      setEditMode(false);
    } catch (err) {
      console.error("Lỗi khi cập nhật shop:", err);
      setSubmitError("Cập nhật thất bại. Vui lòng thử lại.");
    }
  };

  const handleCancel = () => {
    setForm(initialFormState);
    setPreviewLogo(
      selectedShop?.logoUrl
        ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
        : null
    );
    setFile(null);
    setSubmitError("");
    setErrors({});
    setEditMode(false);
  };

  return (
    <div className="max-w-md mx-auto px-3 py-4 space-y-3">
      {/* Header */}
      <div
        className="sticky bg-white border-b shadow-sm flex justify-between items-center px-4 py-3 rounded-b-md z-30"
        style={{ top: "var(--mobile-header-height, 0px)", zIndex: 30 }}
      >
        <h2 className="text-base font-medium">Cài đặt cửa hàng</h2>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-white bg-gray-400 hover:bg-gray-500 text-sm"
            >
              <FaTimes /> Hủy
            </button>
            <button
              form="shop-form"
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm"
              style={{ backgroundColor: sidebarColor }}
            >
              <FaSave /> Lưu
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm"
            style={{ backgroundColor: sidebarColor }}
          >
            <FaEdit /> Chỉnh sửa
          </button>
        )}
      </div>

      {submitError && <p className="text-red-500 text-sm">{submitError}</p>}

      <AnimatePresence mode="wait">
        {editMode ? (
          <motion.form
            key="edit"
            id="shop-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* Logo Card */}
            <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
              <div className="relative group">
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Shop Logo"
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-blue-400">
                    <FaStore size={28} color="#3B82F6" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  name="logo"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-gray-500 text-sm mt-1">Logo cửa hàng</p>
            </div>

            {/* Thông tin cơ bản */}
            <div className="bg-white shadow rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên cửa hàng</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full text-sm ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngành hàng</label>
                  <input
                    type="text"
                    value={form.industry}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại hình</label>
                  <input
                    type="text"
                    value={form.type}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Liên hệ */}
            <div className="bg-white shadow rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Liên hệ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
                  <input
                    type="text"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full text-sm ${errors.countryCode ? "border-red-500" : ""}`}
                  />
                  {errors.countryCode && <p className="text-red-500 text-xs mt-1">{errors.countryCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full text-sm ${errors.phone ? "border-red-500" : ""}`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={`border rounded p-2 w-full text-sm ${errors.address ? "border-red-500" : ""}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
            </div>

            {/* Mô hình kinh doanh */}
            <div className="bg-white shadow rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold">Mô hình kinh doanh</h3>
              <select
                name="businessModel"
                value={form.businessModel}
                onChange={handleChange}
                className="border rounded p-2 w-full text-sm"
              >
                {businessModels.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                Mặc định theo loại cửa hàng:{" "}
                <strong>{shopTypes.find((s) => s.value === form.type)?.defaultBusinessModel}</strong>
              </p>
            </div>
          </motion.form>
        ) : (
          // View Mode
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="space-y-3"
          >
            <div className="bg-white shadow rounded-lg p-4 flex flex-col items-center">
              {previewLogo ? (
                <img
                  src={previewLogo}
                  alt="Shop Logo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-400 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-blue-400">
                  <FaStore size={28} color="#3B82F6" />
                </div>
              )}
              <p className="text-gray-500 text-sm mt-1">Logo cửa hàng</p>
            </div>

            <div className="bg-white shadow rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold">Thông tin cửa hàng</h3>
              <p className="text-sm"><strong>Tên cửa hàng:</strong> {form.name}</p>
              <p className="text-sm"><strong>Ngành hàng:</strong> {form.industry}</p>
              <p className="text-sm"><strong>Loại hình:</strong> {form.type}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold">Liên hệ</h3>
              <p className="text-sm"><strong>Mã quốc gia:</strong> {form.countryCode}</p>
              <p className="text-sm"><strong>Số điện thoại:</strong> {form.phone}</p>
              <p className="text-sm"><strong>Địa chỉ:</strong> {form.address}</p>
            </div>

            <div className="bg-white shadow rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold">Mô hình kinh doanh</h3>
              <p className="text-sm">{form.businessModel}</p>
              <p className="text-sm"><strong>Kích hoạt:</strong> {form.active ? "Có" : "Không"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopSettingsPage;
