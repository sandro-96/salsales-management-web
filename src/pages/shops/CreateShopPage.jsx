// src/pages/shop/CreateShopPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { useShop } from "../../hooks/useShop";
import imageCompression from "browser-image-compression";
import { COUNTRIES } from "../../constants/countries";
import { SHOP_TYPES } from "../../constants/shopTypes";

const CreateShopPage = () => {
    const [form, setForm] = useState({
        name: "",
        type: "RESTAURANT",
        address: "",
        phone: "",
        countryCode: "VN"
    });
    const [fileInputKey, setFileInputKey] = useState(Date.now());
    const [imagePreview, setImagePreview] = useState(null);
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const { fetchShops } = useShop();
    const navigate = useNavigate();

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
        const MAX_FILE_SIZE_MB = 5;

        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setSubmitError("Chỉ hỗ trợ định dạng ảnh JPG và PNG.");
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
                setSubmitError(""); // clear error
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
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: null });
    };

    const validate = () => {
        const newErrors = {};
        const country = COUNTRIES.find(c => c.code === form.countryCode);

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
            formData.append(
                "shop",
                new Blob([JSON.stringify(form)], { type: "application/json" })
            );

            if (file) {
                formData.append("file", file);
            }

            const res = await axiosInstance.post("/shop", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.code === "SUCCESS") {
                await fetchShops(); // cập nhật lại danh sách cửa hàng
                navigate("/", { replace: true });
            } else {
                setSubmitError(res.data.message || "Tạo cửa hàng thất bại.");
            }
        } catch (err) {
            console.error("Lỗi khi tạo cửa hàng:", err);
            setSubmitError(
                err.response?.data?.message || "Đã xảy ra lỗi khi gửi dữ liệu."
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow w-full max-w-md space-y-4" noValidate>
                <h2 className="text-xl font-bold text-center mb-2">Tạo cửa hàng mới</h2>

                {submitError && <p className="text-red-600 text-sm text-center">{submitError}</p>}

                <div>
                    <input
                        type="text"
                        name="name"
                        placeholder="Tên cửa hàng"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                    <select
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                        {SHOP_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                        {SHOP_TYPES.find((s) => s.value === form.type)?.trackInventory
                            ? "✔️ Loại cửa hàng này sẽ bật quản lý tồn kho."
                            : "⚠️ Loại cửa hàng này không yêu cầu kiểm kho theo mặc định."}
                    </p>
                </div>
                <div>
                    <label className="block mb-1 text-sm text-gray-600">Quốc gia</label>
                    <select
                        name="countryCode"
                        value={form.countryCode}
                        onChange={handleChange}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                    >
                        {COUNTRIES.map((country) => (
                            <option key={country.code} value={country.code}>
                                {country.name} ({country.dialCode})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <input
                        type="text"
                        name="address"
                        placeholder="Địa chỉ"
                        value={form.address}
                        onChange={handleChange}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                    <label className="block mb-1 text-sm text-gray-600">Số điện thoại</label>
                    <div className="flex">
                        <span className="px-4 py-3 bg-gray-200 border border-r-0 rounded-l text-gray-700">
                            {COUNTRIES.find(c => c.code === form.countryCode)?.dialCode}
                        </span>
                        <input
                            type="text"
                            name="phone"
                            placeholder="Số điện thoại"
                            value={form.phone}
                            onChange={handleChange}
                            className="flex-1 p-3 border rounded-r focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                    {imagePreview ? (
                        <div className="mt-2 flex items-center gap-4">
                            <img
                                src={imagePreview}
                                alt="Logo preview"
                                className="w-32 h-32 object-contain border rounded"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setFile(null);
                                    setImagePreview(null);
                                    setFileInputKey(Date.now());
                                }}
                                className="text-red-600 underline text-sm"
                            >
                                Xoá ảnh
                            </button>
                        </div>
                    ) : (
                        <input
                            key={fileInputKey}
                            type="file"
                            accept=".jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                    )}
                </div>
                {submitError && (
                    <p className="text-red-600 text-sm text-center">{submitError}</p>
                )}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700"
                >
                    Tạo cửa hàng
                </button>
            </form>
        </div>
    );
};

export default CreateShopPage;
