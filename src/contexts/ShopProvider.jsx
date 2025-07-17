// src/contexts/ShopProvider.jsx
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { ShopContext } from "./ShopContext";

const ShopProvider = ({ children }) => {
    const [shops, setShops] = useState([]);
    const [selectedShopId, setSelectedShopIdState] = useState(null);

    const selectedShop = shops.find(shop => shop.id === selectedShopId) || null;
    const selectedRole = selectedShop?.role || null;

    const setSelectedShopId = (id) => {
        setSelectedShopIdState(id);
        localStorage.setItem("selectedShopId", id); // Ghi vào localStorage
    };

    const fetchShops = async () => {
        try {
            const res = await axiosInstance.get("/shop/my");
            const shopList = res.data.data;
            setShops(shopList);

            const savedShopId = localStorage.getItem("selectedShopId");
            const validSavedShop = shopList.find(s => s.id === savedShopId);

            if (validSavedShop) {
                setSelectedShopId(savedShopId);
            } else if (shopList.length > 0) {
                setSelectedShopId(shopList[0].id);
            }
        } catch (err) {
            console.error("Lỗi khi tải danh sách cửa hàng", err);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    return (
        <ShopContext.Provider
            value={{
                shops,
                selectedShopId,
                setSelectedShopId,
                selectedShop,
                selectedRole,
            }}
        >
            {children}
        </ShopContext.Provider>
    );
};

export default ShopProvider;
