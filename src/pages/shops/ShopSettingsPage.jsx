import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useShop } from "../../hooks/useShop.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useAlert } from "../../hooks/useAlert.js";
import { ALERT_TYPES } from "../../constants/alertTypes.js";
import { handleFileChange } from "../../utils/fileUtils.js";
import axiosInstance from "../../api/axiosInstance";
import { FaStore, FaEdit, FaTimes, FaSave } from "react-icons/fa";
import LoadingOverlay from "../../components/loading/LoadingOverlay.jsx";

const sidebarColor = "#34516dff";

const ShopSettingsPage = () => {
  const { showAlert } = useAlert();
  const { enums } = useAuth();
  const { selectedShop, setSelectedShop } = useShop();
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");
  const [file, setFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      name: "",
      industry: "",
      type: "",
      countryCode: "",
      phone: "",
      address: "",
      businessModel: "",
      active: false,
    },
  });

  const countryOptions = enums?.countries || [
    { value: "VN", label: "Việt Nam (+84)", phonePattern: "\\+84\\d{9,10}" },
    { value: "US", label: "United States (+1)", phonePattern: "\\+1\\d{10}" },
  ];
  const shopTypes = useMemo(() => enums?.shopTypes || [], [enums]);
  const businessModels = enums?.businessModels || [];

  const type = watch("type");
  const countryCode = watch("countryCode");

  // Cập nhật industry khi type thay đổi
  useEffect(() => {
    if (type) {
      const selectedType = shopTypes.find((s) => s.value === type);
      if (selectedType) {
        setValue("industry", selectedType.industry, { shouldDirty: true });
        setValue("businessModel", selectedType.defaultBusinessModel, { shouldDirty: true });
      }
    }
  }, [type, setValue, shopTypes]);

  useEffect(() => {
    if (selectedShop) {
      reset(selectedShop);
      setPreviewLogo(
        selectedShop.logoUrl
          ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
          : null
      );
      setFile(null);
      setEditMode(false);
    }
  }, [selectedShop, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("shop", new Blob([JSON.stringify(data)], { type: "application/json" }));
      if (file) formData.append("file", file);

      const res = await axiosInstance.put(`/shop/${selectedShop.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        //setMessage("Cập nhật cửa hàng thành công!");
        showAlert({
          title: "Cập nhật thành công",
          description: "Thông tin cửa hàng đã được cập nhật thành công.",
          type: ALERT_TYPES.SUCCESS,
          variant: "toast",
        });
        const response = res.data.data;
        setEditMode(false);
        reset(data);
        response.role = selectedShop.role;
        setSelectedShop(response);
        setPreviewLogo(
          response.logoUrl
            ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${response.logoUrl}`
            : null
        );
        setFile(null);
      } else {
        showAlert({
          title: "Cập nhật thất bại",
          description: res.data.message || "Đã xảy ra lỗi khi cập nhật cửa hàng.",
          type: ALERT_TYPES.ERROR,
          variant: "toast",
        });
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.code === "INVALID_PHONE_NUMBER"
          ? "Số điện thoại không đúng định dạng."
          : err.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.";
      showAlert({
        title: "Cập nhật thất bại",
        description: errorMessage,
        type: ALERT_TYPES.ERROR,
        variant: "toast",
      });
      console.error("Error updating shop:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (Object.keys(dirtyFields).length > 0 || file) {
      showAlert({
        title: "Hủy thay đổi",
        description: "Bạn có chắc muốn hủy các thay đổi? Các thay đổi sẽ không được lưu.",
        type: ALERT_TYPES.WARNING,
        variant: "modal",
        actions: [
          { label: "Hủy", className: "bg-gray-200 text-gray-800" },
          {
            label: "OK",
            className: "bg-red-500 text-white hover:bg-red-600",
            onClick: () => {
              resetForm();
            },
          },
        ],
      });
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    reset({
      name: selectedShop?.name || "",
      industry: selectedShop?.industry || "",
      type: selectedShop?.type || "",
      countryCode: selectedShop?.countryCode || "",
      phone: selectedShop?.phone || "",
      address: selectedShop?.address || "",
      businessModel:
        selectedShop?.businessModel ||
        shopTypes.find((s) => s.value === selectedShop?.type)?.defaultBusinessModel ||
        "",
      active: selectedShop?.active || false,
    });
    setFile(null);
    setPreviewLogo(
      selectedShop?.logoUrl
        ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
        : null
    );
    setEditMode(false);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (editMode) {
      resetForm();
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {isSubmitting && <LoadingOverlay text="Đang cập nhật thông tin cửa hàng..." />}
      <h1 className="text-2xl font-bold mb-4">Cài đặt cửa hàng</h1>

      <div className="sticky bg-white z-10 flex gap-2 mb-4 border-b pb-2"
        style={{ top: "var(--mobile-header-height, 0px)", zIndex: 30 }}
      >
        <button
          className={`px-4 py-2 rounded ${editMode ? "bg-gray-200 hover:bg-gray-300" : "bg-blue-500 text-white"}`}
          onClick={handleEditToggle}
          disabled={editMode}
        >
          <FaEdit className="inline mr-1" /> Chỉnh sửa
        </button>
        {editMode && (
          <button
            form="shop-form"
            type="submit"
            disabled={isSubmitting || (Object.keys(dirtyFields).length === 0 && !file)}
            className={`px-4 py-2 rounded text-white ${
              isSubmitting || (Object.keys(dirtyFields).length === 0 && !file)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            style={{ backgroundColor: sidebarColor }}
          >
            <FaSave className="inline mr-1" /> {isSubmitting ? "Đang lưu..." : "Lưu"}
          </button>
        )}
        {editMode && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded bg-gray-400 text-white hover:bg-gray-500"
          >
            <FaTimes className="inline mr-1" /> Hủy
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {editMode ? (
          <motion.form
            key="edit"
            id="shop-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="col-span-2 space-y-3">
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên cửa hàng</label>
                    <input
                      {...register("name", {
                        required: "Vui lòng nhập tên cửa hàng",
                      })}
                      className={`border p-2 w-full rounded text-sm ${errors.name ? "border-red-500" : ""}`}
                      disabled={!editMode}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Loại hình</label>
                    <select
                      {...register("type", {
                        required: "Vui lòng chọn loại hình cửa hàng",
                      })}
                      className={`border p-2 w-full rounded text-sm ${
                        errors.countryCode ? "border-red-500" : ""
                      }`}
                      disabled={!editMode}
                    >
                      {shopTypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ngành hàng</label>
                    <input
                      {...register("industry")}
                      className="border p-2 w-full rounded bg-gray-100 text-sm"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Mô hình kinh doanh</h3>
                <select
                  {...register("businessModel")}
                  className="border p-2 w-full rounded text-sm"
                  disabled={!editMode}
                >
                  {businessModels.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    {...register("active")}
                    className="mr-2"
                    disabled={!editMode}
                  />
                  <label className="text-sm font-medium">Kích hoạt cửa hàng</label>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Liên hệ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Mã quốc gia</label>
                    <select
                      {...register("countryCode", {
                        required: "Vui lòng chọn mã quốc gia",
                      })}
                      className={`border p-2 w-full rounded text-sm ${
                        errors.countryCode ? "border-red-500" : ""
                      }`}
                      disabled={!editMode}
                    >
                      <option value="">Chọn mã quốc gia</option>
                      {countryOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    {errors.countryCode && <p className="text-red-500 text-xs mt-1">{errors.countryCode.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                    <input
                      {...register("phone", {
                        required: "Vui lòng nhập số điện thoại",
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
                      className={`border p-2 w-full rounded text-sm ${errors.phone ? "border-red-500" : ""}`}
                      disabled={!editMode}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium mb-1">Địa chỉ</label>
                  <input
                    {...register("address", {
                      required: "Vui lòng nhập địa chỉ",
                    })}
                    className={`border p-2 w-full rounded text-sm ${errors.address ? "border-red-500" : ""}`}
                    disabled={!editMode}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white shadow rounded-lg p-4">
                <label className="block text-sm font-medium mb-1">Logo cửa hàng</label>
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Shop Logo"
                    className="w-40 h-40 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-blue-400">
                    <FaStore size={28} color="#3B82F6" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleFileChange({
                      event: e,
                      setError: setFileError,
                      setFile,
                      setPreview: setPreviewLogo,
                    })
                  }
                  className="border p-2 w-full rounded"
                  disabled={!editMode}
                />
                {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
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
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            <div className="col-span-2 space-y-3">
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Thông tin cửa hàng</h3>
                <p className="text-sm">
                  <strong>Tên cửa hàng:</strong> {watch("name") || "Chưa cập nhật"}
                </p>
                <p className="text-sm">
                  <strong>Ngành hàng:</strong> {watch("industry") || "Chưa cập nhật"}
                </p>
                <p className="text-sm">
                  <strong>Loại hình:</strong> {shopTypes.find((s) => s.value === watch("type"))?.label || "Chưa cập nhật"}
                </p>
              </div>

              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Liên hệ</h3>
                <p className="text-sm">
                  <strong>Mã quốc gia:</strong>{" "}
                  {countryOptions.find((c) => c.code === watch("countryCode"))?.name || "Chưa cập nhật"} ({watch("countryCode")})
                </p>
                <p className="text-sm">
                  <strong>Số điện thoại:</strong> {watch("phone") || "Chưa cập nhật"}
                </p>
                <p className="text-sm">
                  <strong>Địa chỉ:</strong> {watch("address") || "Chưa cập nhật"}
                </p>
              </div>

              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Mô hình kinh doanh</h3>
                <p className="text-sm">
                  {businessModels.find((opt) => opt.value === watch("businessModel"))?.label || "Chưa cập nhật"}
                  </p>
                <p className="text-sm">
                  <strong>Kích hoạt:</strong> {watch("active") ? "Có" : "Không"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2">Logo cửa hàng</h3>
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Shop Logo"
                    className="w-40 h-40 rounded-full object-cover mx-auto mb-2"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-blue-400">
                    <FaStore size={28} color="#3B82F6" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopSettingsPage;