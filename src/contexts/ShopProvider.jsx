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
    const [isShopContextReady, setIsShopContextReady] = useState(false);
    const [enums, setEnums] = useState(null);
    const selectedShop = shops.find(shop => shop.id === selectedShopId) || null;
    const selectedRole = selectedShop?.role || null;
    const selectedIndustry = selectedShop?.industry || null;
    const isOwner = selectedRole === "OWNER";
    const isStaff = selectedRole === "STAFF";
    const isCashier = selectedRole === "CASHIER";

    const setSelectedShopId = (id) => {
        setSelectedShopIdState(id);
        localStorage.setItem("selectedShopId", id); // Ghi vào localStorage
    };

    const fetchEnums = async () => {
        try {
            const res = await axiosInstance.get("/enums/shop/all");
            setEnums(res.data.data);
            console.log("Fetched enums:", res.data);
        } catch (err) {
            console.error("Lỗi khi tải enums:", err);
        }
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
        }
    };


    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([fetchShops(), fetchEnums()]);
            } finally {
                setIsLoading(false);
                setIsShopContextReady(true);
            }
        };

        loadData();
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
                isCashier,
                enums,
                selectedIndustry,
                fetchShops,
                isShopContextReady
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
