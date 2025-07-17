// src/pages/shop/ShopSettingsPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import { SHOP_TYPES } from "../../constants/shopTypes.js";
import { useShop } from "../../hooks/useShop.js";

const ShopSettingsPage = () => {
    const { isOwner, fetchShops } = useShop();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [shop, setShop] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOwner) navigate("/overview", { replace: true });
    }, [isOwner, navigate]);

    useEffect(() => {
        axiosInstance.get("/shop/me").then((res) => {
            const data = res.data.data;
            setShop(data);
            setPreviewUrl(data.logoUrl || null);
        });
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setLogoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleImageRemove = () => {
        setLogoFile(null);
        setPreviewUrl(null);
    };

    const handleChange = (field, value) => {
        setShop((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("shop", new Blob([JSON.stringify(shop)], { type: "application/json" }));
            if (logoFile) formData.append("file", logoFile);

            await axiosInstance.put("/shop/me", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

        } catch (err) {
            console.error("Lỗi khi cập nhật shop:", err);
            setError("Không thể cập nhật cửa hàng.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return setConfirmDelete(true);
        setDeleting(true);
        try {
            await axiosInstance.delete("/shop");
            localStorage.removeItem("selectedShopId");
            await fetchShops();
            navigate("/select-shop");
        } catch (err) {
            console.error("Lỗi khi xoá cửa hàng:", err);
        } finally {
            setDeleting(false);
        }
    };

    if (!shop) return <div>Đang tải...</div>;

    return (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
            <h1 className="text-xl font-bold">Quản lý cửa hàng</h1>

            {error && <p className="text-red-600">{error}</p>}

            {/* 🖼 Logo */}
            <div>
                <label className="block font-medium mb-1">Logo cửa hàng</label>
                {previewUrl ? (
                    <div className="mb-2">
                        <img src={previewUrl} alt="preview" className="w-32 h-32 object-cover rounded border" />
                        <button
                            type="button"
                            onClick={handleImageRemove}
                            className="text-red-500 text-sm mt-1 underline"
                        >
                            Xoá ảnh
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="text-blue-600 underline text-sm"
                        onClick={() => fileInputRef.current.click()}
                    >
                        Chọn ảnh
                    </button>
                )}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    hidden
                    onChange={handleImageChange}
                />
            </div>

            {/* Tên cửa hàng */}
            <div>
                <label className="block font-medium">Tên cửa hàng</label>
                <input
                    value={shop.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                />
            </div>

            {/* Loại hình */}
            <div>
                <label className="block font-medium">Loại hình</label>
                <select
                    value={shop.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                >
                    {SHOP_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Số điện thoại */}
            <div>
                <label className="block font-medium">Số điện thoại</label>
                <input
                    value={shop.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                />
            </div>

            {/* Địa chỉ */}
            <div>
                <label className="block font-medium">Địa chỉ</label>
                <input
                    value={shop.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full border px-3 py-2 rounded"
                />
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    {loading ? "Đang lưu..." : "Cập nhật"}
                </button>
            </div>

            {/* ❌ XÓA SHOP */}
            <div className="pt-6 text-sm text-red-600 border-t mt-6">
                <p className="mb-2">⚠️ Xóa cửa hàng là hành động không thể hoàn tác.</p>
                <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                    {confirmDelete ? (deleting ? "Đang xoá..." : "Xác nhận xoá") : "Xoá cửa hàng"}
                </button>
            </div>
        </form>
    );
};

export default ShopSettingsPage;
