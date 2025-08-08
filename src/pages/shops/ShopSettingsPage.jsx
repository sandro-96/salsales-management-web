import { useState } from "react";
import { useShop } from "../../hooks/useShop.js";

const pastelMint = "#A8DADC";

const ShopSettingsPage = () => {
    const { selectedShop } = useShop();

    const [form, setForm] = useState({
        name: selectedShop?.name || "",
        type: selectedShop?.type || "",
        countryCode: selectedShop?.countryCode || "",
        phone: selectedShop?.phone || "",
        address: selectedShop?.address || "",
        active: selectedShop?.active || false,
        // Không cho chỉnh sửa industry và trackInventory nữa
        logo: null,
    });

    const [previewLogo, setPreviewLogo] = useState(
        selectedShop?.logoUrl
            ? `${import.meta.env.VITE_API_BASE_URL.replace("/api", "")}${selectedShop.logoUrl}`
            : null
    );

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file") {
            const file = files[0];
            setForm({ ...form, logo: file });
            setPreviewLogo(URL.createObjectURL(file));
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const toggleActive = () => {
        setForm((prev) => ({ ...prev, active: !prev.active }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        // TODO: Gửi API cập nhật shop
        console.log("Submit data:", form);
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md space-y-6 max-w-2xl"
        >
            <h2 className="text-xl font-bold mb-4">Cài đặt cửa hàng</h2>

            {/* Logo */}
            <div>
                <label className="block font-medium mb-1">Logo cửa hàng</label>
                {previewLogo && (
                    <img
                        src={previewLogo}
                        alt="Shop Logo"
                        className="w-20 h-20 object-cover rounded-full mb-2 border"
                        style={{ borderColor: pastelMint }}
                    />
                )}
                <input
                    type="file"
                    accept="image/*"
                    name="logo"
                    onChange={handleChange}
                />
            </div>

            {/* Name */}
            <div>
                <label className="block font-medium mb-1">Tên cửa hàng</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                />
            </div>

            {/* Type */}
            <div>
                <label className="block font-medium mb-1">Loại hình</label>
                <input
                    type="text"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                />
            </div>

            {/* Country Code */}
            <div>
                <label className="block font-medium mb-1">Mã quốc gia</label>
                <input
                    type="text"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                />
            </div>

            {/* Phone */}
            <div>
                <label className="block font-medium mb-1">Số điện thoại</label>
                <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                />
            </div>

            {/* Address */}
            <div>
                <label className="block font-medium mb-1">Địa chỉ</label>
                <input
                    type="text"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className="border rounded p-2 w-full"
                />
            </div>

            {/* Industry & Track Inventory - chỉ hiển thị */}
            <div className="space-y-2">
                <div>
                    <label className="block font-medium text-gray-700">Ngành nghề</label>
                    <p className="p-2 bg-gray-100 rounded">{selectedShop?.industry || "N/A"}</p>
                </div>
                <div>
                    <label className="block font-medium text-gray-700">Theo dõi tồn kho</label>
                    <p className="p-2 bg-gray-100 rounded">
                        {selectedShop?.trackInventory ? "Có" : "Không"}
                    </p>
                </div>
            </div>

            {/* Nút toggle Kích hoạt cửa hàng chi tiết hơn */}
            <div className="relative">
                <label className="block font-medium mb-2">Kích hoạt cửa hàng</label>
                <button
                    type="button"
                    onClick={toggleActive}
                    aria-pressed={form.active}
                    className={`inline-flex items-center px-4 py-2 rounded-full font-semibold transition-colors duration-300
            ${
                        form.active
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                    }
            z-10
          `}
                    style={{ position: 'relative', zIndex: 10 }}
                >
          <span
              className={`inline-block w-5 h-5 mr-2 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                  form.active ? "translate-x-6" : ""
              }`}
          />
                    {form.active ? "Đang kích hoạt" : "Chưa kích hoạt"}
                </button>
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="px-6 py-2 rounded text-white"
                style={{ backgroundColor: pastelMint }}
            >
                Lưu thay đổi
            </button>
        </form>
    );
};

export default ShopSettingsPage;