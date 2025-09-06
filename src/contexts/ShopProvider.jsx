import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { ShopContext } from "./ShopContext";
import { useAuth } from "../hooks/useAuth.js";

const ShopProvider = ({ children }) => {
  const { isUserContextReady, user, fetchEnums } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopIdState] = useState(null);
  const [isShopContextReady, setIsShopContextReady] = useState(false);
  const [selectedShop, setSelectedShopState] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const setSelectedShopId = useCallback(
    (id) => {
      setSelectedShopIdState(id);
      localStorage.setItem("selectedShopId", id);

      const shop = shops.find((s) => s.id === id);
      if (shop) {
        setSelectedShopState(shop);
        setSelectedRole(shop.role);
        setSelectedIndustry(shop.industry);
      } else {
        setSelectedShopState(null);
        setSelectedRole(null);
        setSelectedIndustry(null);
      }
    },
    [shops]
  );

  const setSelectedShop = useCallback((shop) => {
    if (!shop) {
      setSelectedShopIdState(null);
      setSelectedShopState(null);
      setSelectedRole(null);
      setSelectedIndustry(null);
      localStorage.removeItem("selectedShopId");
    } else {
      setSelectedShopIdState(shop.id);
      setSelectedShopState(shop);
      setSelectedRole(shop.role);
      setSelectedIndustry(shop.industry);
      localStorage.setItem("selectedShopId", shop.id);
    }
  }, []);

  const fetchShops = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/shop/my?page=0&size=1000");
      const shopList = res.data.data.content;
      setShops(shopList);

      const savedShopId = localStorage.getItem("selectedShopId");
      const validSavedShop = shopList.find((s) => s.id === savedShopId);

      if (validSavedShop) {
        setSelectedShopIdState(savedShopId);
        setSelectedShopState(validSavedShop);
        setSelectedRole(validSavedShop.role);
        setSelectedIndustry(validSavedShop.industry);
      } else {
        if (shopList.length > 0 && !selectedShop) {
          const firstShop = shopList[0];
          setSelectedShopIdState(firstShop.id);
          setSelectedShopState(firstShop);
          setSelectedRole(firstShop.role);
          setSelectedIndustry(firstShop.industry);
          localStorage.setItem("selectedShopId", firstShop.id);
          console.log(
            "Cửa hàng đã chọn không hợp lệ, chuyển sang cửa hàng đầu tiên."
          );
        }
        setSelectedShopIdState(null);
        setSelectedShopState(null);
        setSelectedRole(null);
        setSelectedIndustry(null);
      }

      console.log("Đã tải danh sách cửa hàng:", shopList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách cửa hàng", err);
    } finally {
      setIsShopContextReady(true);
    }
  }, []);

  useEffect(() => {
    if (isUserContextReady && user) {
      fetchShops();
      fetchEnums();
    }
  }, [isUserContextReady, user, fetchShops]);

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
        isShopContextReady,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export default ShopProvider;
