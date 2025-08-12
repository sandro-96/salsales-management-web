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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);

  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];
  const countryOptions = [
    { value: "VN", label: "Việt Nam (+84)" },
    { value: "US", label: "United States (+1)" },
    // Thêm các quốc gia khác
  ];

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
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const MAX_FILE_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setSubmitError("Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.");
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

  const validatePhone = (phone, countryCode) => {
    const patterns = {
      VN: /^\+84\d{9,10}$/,
      US: /^\+1\d{10}$/,
      // Thêm các định dạng khác
    };
    return patterns[countryCode]?.test(phone) || false;
  };

  const validateForm = () => {
    let newErrors = {};
    if (!form.name.trim()) newErrors.name = "Vui lòng nhập tên cửa hàng";
    if (!form.countryCode.trim()) newErrors.countryCode = "Vui lòng chọn mã quốc gia";
    if (!form.phone.trim()) newErrors.phone = "Vui lòng nhập số điện thoại";
    else if (!validatePhone(form.phone, form.countryCode)) {
      newErrors.phone = "Số điện thoại không đúng định dạng";
    }
    if (!form.address.trim()) newErrors.address = "Vui lòng nhập địa chỉ";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("shop", new Blob([JSON.stringify(form)], { type: "application/json" }));
      if (file) formData.append("file", file);

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
        setEditMode(false);
      } else {
        setSubmitError(res.data.message || "Cập nhật cửa hàng thất bại.");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.code === "INVALID_PHONE_NUMBER"
          ? "Số điện thoại không đúng định dạng."
          : err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.";
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")) {
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
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 py-4 space-y-3">
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
              disabled={isSubmitting}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-white text-sm ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ backgroundColor: sidebarColor }}
            >
              <FaSave /> {isSubmitting ? "Đang lưu..." : "Lưu"}
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

            <div className="bg-white shadow rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold">Liên hệ</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full text-sm ${errors.countryCode ? "border-red-500" : ""}`}
                  >
                    <option value="">Chọn mã quốc gia</option>
                    {countryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
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

            <div className="bg-white shadow rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold">Mô hình kinh doanh</h3>
              <select
                name="businessModel"
                value={form.businessModel}
                onChange={handleChange}
                className="border rounded p-2 w-full text-sm"
              >
                <option value="">Chọn mô hình</option>
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={form.active}
                  onChange={handleChange}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Kích hoạt cửa hàng</label>
              </div>
            </div>
          </motion.form>
        ) : (
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