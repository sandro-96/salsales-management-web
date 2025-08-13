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
    const [selectedShop, setSelectedShop] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedIndustry, setSelectedIndustry] = useState(null);

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
                setSelectedShop(validSavedShop);
                setSelectedRole(validSavedShop.role);
                setSelectedIndustry(validSavedShop.industry);
            } else if (shopList.length > 0) {
                setSelectedShopId(shopList[0].id);
                setSelectedShop(shopList[0]);
                setSelectedRole(shopList[0].role);
                setSelectedIndustry(shopList[0].industry);
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

    const isOwner = selectedRole === "OWNER";
    const isStaff = selectedRole === "STAFF";
    const isCashier = selectedRole === "CASHIER";

    return (
        <ShopContext.Provider
            value={{
                shops,
                selectedShopId,
                setSelectedShopId,
                selectedShop,
                setSelectedShop,
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
