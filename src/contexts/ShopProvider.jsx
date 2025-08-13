// src/contexts/ShopProvider.jsx
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ShopContext } from "./ShopContext";
import { useAuth } from "../hooks/useAuth.js";

const ShopProvider = ({ children }) => {
    const { isUserContextReady } = useAuth();
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopIdState] = useState(null);
    const [isShopContextReady, setIsShopContextReady] = useState(false);

    const selectedShop = shops.find(shop => shop.id === selectedShopId) || null;
    const selectedRole = selectedShop?.role || null;
    const selectedIndustry = selectedShop?.industry || null;

    const isOwner = selectedRole === "OWNER";
    const isStaff = selectedRole === "STAFF";
    const isCashier = selectedRole === "CASHIER";

    const setSelectedShopId = (id) => {
        setSelectedShopIdState(id);
        localStorage.setItem("selectedShopId", id);
    };

    const fetchShops = useCallback(async () => {
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
        }
    }, []);

    useEffect(() => {
        if (isUserContextReady) {
            fetchShops().then(() => {
                setIsShopContextReady(true);
            });
        }
    }, [isUserContextReady, fetchShops]);

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
                isCashier,
                selectedIndustry,
                fetchShops,
                isShopContextReady
            }}
        >
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
