// src/contexts/ShopProvider.jsx
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { ShopContext } from "./ShopContext";
import { useAuth } from "../hooks/useAuth.js";

const ShopProvider = ({ children }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopIdState] = useState(null);
    const selectedShop = shops.find(shop => shop.id === selectedShopId) || null;
    const selectedRole = selectedShop?.role || null;
    const isOwner = selectedRole === "OWNER";
    const isStaff = selectedRole === "STAFF";
    const isCashier = selectedRole === "CASHIER";

    const setSelectedShopId = (id) => {
        setSelectedShopIdState(id);
        localStorage.setItem("selectedShopId", id); // Ghi vào localStorage
    };

    const fetchShops = async () => {
        try {
            const res = await axiosInstance.get("/shop/my?page=0&size=1000");
            const shopList = res.data.data.content;
            setShops(shopList);

            const savedShopId = localStorage.getItem("selectedShopId");
            const validSavedShop = shopList.find(s => s.id === savedShopId);

            if (validSavedShop) {
                setSelectedShopId(savedShopId);
            } else if (shopList.length > 0) {
                setSelectedShopId(shopList[0].id);
            }

            console.log("Đã tải danh sách cửa hàng:", shopList);
        } catch (err) {
            console.error("Lỗi khi tải danh sách cửa hàng", err);
        } finally {
            console.log("Đã hoàn thành việc tải cửa hàng");
            setIsLoading(false); // ✅ Đánh dấu đã xong
        }
    };

    useEffect(() => {
        if (!user) {
            setIsLoading(false); // Nếu không có user, không cần tải cửa hàng
            return;
        }
        fetchShops();
    }, [user]);

    return (
        <ShopContext.Provider
            value={{
                shops,
                selectedShopId,
                setSelectedShopId,
                selectedShop,
                selectedRole,
                isOwner,
                isStaff,
                isCashier
            }}
        >
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center">
                    <p>Đang tải cửa hàng...</p>
                </div>
            ) : (
                children
            )}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
