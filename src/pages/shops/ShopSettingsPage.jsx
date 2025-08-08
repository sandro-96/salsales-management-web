import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../../hooks/useShop.js";
import { FaStore, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import imageCompression from "browser-image-compression";
import axios from "axios";

const sidebarColor = "#34516dff";

const ShopSettingsPage = () => {
  const { selectedShop, enums } = useShop();
  const [editMode, setEditMode] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [initialFormState, setInitialFormState] = useState({});
  const [form, setForm] = useState({});
  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];

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
            // Reset form state to match selected shop
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

  const [file, setFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(
    selectedShop?.logoUrl
      ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
      : null
  );

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

  // Submit form
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

      await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/shops/${selectedShop.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div
        className="sticky bg-white z-20 border-b shadow-sm flex justify-between items-center px-6 py-4"
        style={{ top: "var(--mobile-header-height, 0px)", zIndex: 30 }}
      >
        <h2 className="text-lg font-semibold">Cài đặt cửa hàng</h2>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 rounded text-white"
              style={{ backgroundColor: "#9CA3AF" }}
            >
              <FaTimes /> Hủy
            </button>
            <button
              form="shop-form"
              type="submit"
              className="flex items-center gap-1 px-4 py-2 rounded text-white"
              style={{ backgroundColor: sidebarColor }}
            >
              <FaSave /> Lưu
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 px-4 py-2 rounded text-white"
            style={{ backgroundColor: sidebarColor }}
          >
            <FaEdit /> Chỉnh sửa
          </button>
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white shadow-lg rounded-xl p-6 space-y-6 mt-4"
      >
        {submitError && <p className="text-red-500">{submitError}</p>}

        <AnimatePresence mode="wait">
          {editMode ? (
            <motion.form
              key="edit"
              id="shop-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-8"
            >
              {/* Logo */}
              <div className="flex flex-col items-center">
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Shop Logo"
                      className="w-24 h-24 rounded-full object-cover border-3 border-blue-300"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-blue-500">
                      <FaStore size={40} color="#3B82F6" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    name="logo"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </motion.div>
                <p className="text-gray-500 mt-2">Logo cửa hàng</p>
              </div>

              {/* Các field khác */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-medium mb-1">Tên cửa hàng</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${
                      errors.name ? "border-red-500" : ""
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>
                <div>
                  <label className="block font-medium mb-1">Ngành hàng</label>
                  <input
                    type="text"
                    value={form.industry}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Loại hình</label>
                  <input
                    type="text"
                    value={form.type}
                    disabled
                    className="border rounded p-2 w-full bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Mã quốc gia</label>
                  <input
                    type="text"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${
                      errors.countryCode ? "border-red-500" : ""
                    }`}
                  />
                  {errors.countryCode && <p className="text-red-500 text-sm">{errors.countryCode}</p>}
                </div>
                <div>
                  <label className="block font-medium mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={`border rounded p-2 w-full ${
                      errors.phone ? "border-red-500" : ""
                    }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block font-medium mb-1">Mô hình kinh doanh</label>
                  <select
                    name="businessModel"
                    value={form.businessModel}
                    onChange={handleChange}
                    className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                  >
                    {businessModels.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Mặc định theo loại cửa hàng:{" "}
                    <strong>
                      {shopTypes.find((s) => s.value === form.type)?.defaultBusinessModel}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block font-medium mb-1">Địa chỉ</label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={`border rounded p-2 w-full ${
                    errors.address ? "border-red-500" : ""
                  }`}
                />
                {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
              </div>
            </motion.form>
          ) : (
            // View mode giữ nguyên
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Logo */}
              <div className="flex flex-col items-center">
                <motion.div whileHover={{ scale: 1.05 }}>
                  {previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Shop Logo"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-blue-500">
                      <FaStore size={40} color="#3B82F6" />
                    </div>
                  )}
                </motion.div>
                <p className="text-gray-500 mt-2">Logo cửa hàng</p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <p><strong>Tên cửa hàng:</strong> {form.name}</p>
                <p><strong>Ngành hàng:</strong> {form.industry}</p>
                <p><strong>Loại hình:</strong> {form.type}</p>
                <p><strong>Mã quốc gia:</strong> {form.countryCode}</p>
                <p><strong>Số điện thoại:</strong> {form.phone}</p>
                <p><strong>Mô hình kinh doanh:</strong> {form.businessModel}</p>
                <p className="md:col-span-2"><strong>Địa chỉ:</strong> {form.address}</p>
                <p><strong>Kích hoạt:</strong> {form.active ? "Có" : "Không"}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ShopSettingsPage;
