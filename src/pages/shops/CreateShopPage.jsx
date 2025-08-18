import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import imageCompression from "browser-image-compression";
import { COUNTRIES } from "../../constants/countries";
import LoadingOverlay from "../../components/loading/LoadingOverlay.jsx";
import { Store, MapPin, Phone, Image as ImageIcon, Flag } from "lucide-react";
import {useAuth} from "../../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";

const CreateShopPage = () => {
  const [form, setForm] = useState({
    name: "",
    type: "RESTAURANT",
    address: "",
    phone: "",
    countryCode: "VN",
    businessModel: "DINE_IN",
  });
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [imagePreview, setImagePreview] = useState(null);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const { enums } = useAuth();
  const { fetchShops } = useShop();
  const shopTypes = enums?.shopTypes || [];
  const businessModels = enums?.businessModels || [];
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const MAX_FILE_SIZE_MB = 5;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setSubmitError("Chỉ hỗ trợ định dạng ảnh JPG, PNG, WEBP.");
      setFile(null);
      setImagePreview(null);
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
        setImagePreview(URL.createObjectURL(compressedFile));
        setSubmitError("");
      } catch (err) {
        console.error("Lỗi khi nén ảnh:", err);
        setSubmitError("Nén ảnh thất bại. Vui lòng chọn ảnh nhỏ hơn.");
        setFile(null);
        setImagePreview(null);
      }

      return;
    }

    setFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
    setSubmitError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      const selectedType = shopTypes.find((s) => s.value === value);
      const defaultBM = selectedType?.defaultBusinessModel || "DINE_IN";

      setForm((prev) => ({
        ...prev,
        type: value,
        businessModel: defaultBM,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    setErrors((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  const validate = () => {
    const newErrors = {};
    const country = COUNTRIES.find((c) => c.code === form.countryCode);

    if (!form.name.trim()) newErrors.name = "Tên cửa hàng không được để trống.";
    if (form.address.trim().length < 10) newErrors.address = "Địa chỉ phải có ít nhất 10 ký tự.";
    if (!country.phonePattern.test(form.phone)) newErrors.phone = `Số điện thoại không hợp lệ cho ${country.name}`;

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("shop", new Blob([JSON.stringify(form)], { type: "application/json" }));

      if (file) {
        formData.append("file", file);
      }
      setIsLoading(true);
      const res = await axiosInstance.post("/shop", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        await fetchShops();
        navigate(-1);
      } else {
        setSubmitError(res.data.message || "Tạo cửa hàng thất bại.");
      }
    } catch (err) {
      console.error("Lỗi khi tạo cửa hàng:", err);
      setSubmitError(err.response?.data?.message || "Đã xảy ra lỗi khi gửi dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded-xl shadow-md w-full max-w-xl space-y-4 text-sm"
        noValidate
      >
        {isLoading && <LoadingOverlay text="Đang tạo cửa hàng..." />}
        <h2 className="text-xl font-bold text-center text-blue-700">🚀 Tạo cửa hàng</h2>

        {/* Group 1 */}
        <div className="space-y-2">
          <div className="relative">
            <Store className="absolute left-3 top-2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="name"
              placeholder="Tên cửa hàng"
              value={form.name}
              onChange={handleChange}
              className="w-full pl-9 p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          >
            {shopTypes.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            name="businessModel"
            value={form.businessModel}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
          >
            {businessModels.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group 2 */}
        <div className="space-y-2">
          <div className="relative">
            <Flag className="absolute left-3 top-2 w-5 h-5 text-gray-400" />
            <select
              name="countryCode"
              value={form.countryCode}
              onChange={handleChange}
              className="w-full pl-9 p-2 border rounded-md focus:ring focus:ring-blue-300"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name} ({country.dialCode})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="address"
              placeholder="Địa chỉ"
              value={form.address}
              onChange={handleChange}
              className="w-full pl-9 p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>

          <div className="flex">
            <span className="px-3 py-2 bg-gray-200 border border-r-0 rounded-l-md text-gray-700 text-xs">
              {COUNTRIES.find((c) => c.code === form.countryCode)?.dialCode}
            </span>
            <input
              type="text"
              name="phone"
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={handleChange}
              className="flex-1 p-2 border rounded-r-md focus:ring focus:ring-blue-300"
            />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        {/* Logo */}
        <div>
          {imagePreview ? (
            <div className="relative w-24 h-24">
              <img
                src={imagePreview}
                alt="Logo preview"
                className="w-full h-full object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setImagePreview(null);
                  setFileInputKey(Date.now());
                }}
                className="absolute top-0 right-0 bg-red-500 text-white text-xs p-1 rounded-full shadow hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-blue-50">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
              <span className="text-gray-500 text-xs">Tải logo cửa hàng</span>
              <input
                key={fileInputKey}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {submitError && <p className="text-red-600 text-xs text-center">{submitError}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition"
        >
          {isLoading ? "Đang xử lý..." : "Tạo cửa hàng"}
        </button>
      </form>
    </div>
  );
};

export default CreateShopPage;
