import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";
import { ShopContext } from "./ShopContext";
import { useAuth } from "../hooks/useAuth.js";
import {
  normalizePermissionSet,
  hasShopPermission as hasShopPermissionUtil,
  hasAnyShopPermission as hasAnyShopPermissionUtil,
  hasAllShopPermissions as hasAllShopPermissionsUtil,
} from "../utils/shopPermissionUtils.js";

const ShopProvider = ({ children }) => {
  const { isUserContextReady, user, fetchEnums } = useAuth();
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopIdState] = useState(null);
  const [isShopContextReady, setIsShopContextReady] = useState(false);
  const [selectedShop, setSelectedShopState] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState(null);
  const [selectedBranch, setSelectedBranchState] = useState(null);
  const didInitRef = useRef(false);
  const lastUserIdRef = useRef(null);

  const storageKeys = useCallback(() => {
    const userId = user?.id ? String(user.id) : null;
    return {
      userId,
      shopIdKey: userId ? `selectedShopId:${userId}` : "selectedShopId",
      branchIdKey: userId ? `selectedBranchId:${userId}` : "selectedBranchId",
    };
  }, [user?.id]);

  const clearLegacyAndCurrentSelection = useCallback(() => {
    // legacy shared keys
    localStorage.removeItem("selectedShopId");
    localStorage.removeItem("selectedBranchId");

    const { shopIdKey, branchIdKey } = storageKeys();
    localStorage.removeItem(shopIdKey);
    localStorage.removeItem(branchIdKey);
  }, [storageKeys]);

  const setSelectedShopId = useCallback(
    (id) => {
      setSelectedShopIdState(id);
      const { shopIdKey } = storageKeys();
      localStorage.setItem(shopIdKey, id);

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
    [shops, storageKeys],
  );

  const setSelectedBranchId = useCallback(
    (id) => {
      setSelectedBranchIdState(id);
      if (id) {
        const { branchIdKey } = storageKeys();
        localStorage.setItem(branchIdKey, id);
        const branch = branches.find((b) => b.id === id);
        setSelectedBranchState(branch ?? null);
      } else {
        const { branchIdKey } = storageKeys();
        localStorage.removeItem(branchIdKey);
        setSelectedBranchState(null);
      }
    },
    [branches, storageKeys],
  );

  const setSelectedShop = useCallback(
    (shop) => {
      if (!shop) {
        setSelectedShopIdState(null);
        setSelectedShopState(null);
        setSelectedRole(null);
        setSelectedIndustry(null);
        setBranches([]);
        setSelectedBranchIdState(null);
        setSelectedBranchState(null);
        const { shopIdKey, branchIdKey } = storageKeys();
        localStorage.removeItem(shopIdKey);
        localStorage.removeItem(branchIdKey);
        return;
      }
      // Cùng shop (VD sau lưu cài đặt): chỉ merge state, không xóa chi nhánh đang chọn
      if (shop.id === selectedShopId) {
        setSelectedShopState(shop);
        if (shop.role) setSelectedRole(shop.role);
        if (shop.industry) setSelectedIndustry(shop.industry);
        return;
      }
      setSelectedShopIdState(shop.id);
      setSelectedShopState(shop);
      setSelectedRole(shop.role);
      setSelectedIndustry(shop.industry);
      setBranches([]);
      setSelectedBranchIdState(null);
      setSelectedBranchState(null);
      const { shopIdKey, branchIdKey } = storageKeys();
      localStorage.removeItem(branchIdKey);
      localStorage.setItem(shopIdKey, shop.id);
    },
    [selectedShopId, storageKeys],
  );

  const fetchShops = useCallback(async (preferredShopId) => {
    let shopList = [];
    try {
      const res = await axiosInstance.get("/shop/my?page=0&size=1000");
      shopList = res.data.data.content || [];
      setShops(shopList);

      const { shopIdKey } = storageKeys();
      const fromStorage = localStorage.getItem(shopIdKey);
      const targetId =
        typeof preferredShopId === "string" &&
        preferredShopId &&
        shopList.some((s) => s.id === preferredShopId)
          ? preferredShopId
          : fromStorage;

      const validSavedShop = shopList.find((s) => s.id === targetId);
      if (validSavedShop) {
        setSelectedShopIdState(validSavedShop.id);
        setSelectedShopState(validSavedShop);
        setSelectedRole(validSavedShop.role);
        setSelectedIndustry(validSavedShop.industry);
        localStorage.setItem(shopIdKey, validSavedShop.id);
      } else {
        if (shopList.length > 0 && !selectedShopId) {
          const firstShop = shopList[0];
          setSelectedShopIdState(firstShop.id);
          setSelectedShopState(firstShop);
          setSelectedRole(firstShop.role);
          setSelectedIndustry(firstShop.industry);
          localStorage.setItem(shopIdKey, firstShop.id);
          console.log(
            "Cửa hàng đã chọn không hợp lệ, chuyển sang cửa hàng đầu tiên.",
          );
        } else if (shopList.length === 0) {
          setSelectedShopIdState(null);
          setSelectedShopState(null);
          setSelectedRole(null);
          setSelectedIndustry(null);
          localStorage.removeItem(shopIdKey);
          console.log("Người dùng không có cửa hàng nào.");
        }
      }
      console.log("Đã tải danh sách cửa hàng:", shopList);
    } catch (err) {
      console.error("Lỗi khi tải danh sách cửa hàng", err);
    } finally {
      setIsShopContextReady(true);
    }
    return shopList;
  }, [selectedShopId, storageKeys]);

  const fetchBranches = useCallback(
    async (shopIdParam) => {
      const id = shopIdParam || selectedShopId;
      if (!id) return;

      try {
        const res = await axiosInstance.get("/branches", {
          params: { shopId: id },
        });
        const list = res.data.data || [];
        setBranches(list);

        // Restore saved branch selection for this shop
        const { branchIdKey } = storageKeys();
        const savedBranchId = localStorage.getItem(branchIdKey);
        const validBranch = list.find((b) => b.id === savedBranchId);
        if (validBranch) {
          setSelectedBranchIdState(savedBranchId);
          setSelectedBranchState(validBranch);
        } else if (list.length === 1) {
          // Auto-select if only one branch
          setSelectedBranchIdState(list[0].id);
          setSelectedBranchState(list[0]);
          localStorage.setItem(branchIdKey, list[0].id);
        } else {
          setSelectedBranchIdState(null);
          setSelectedBranchState(null);
        }
      } catch (err) {
        console.error("Lỗi khi tải danh sách chi nhánh", err);
        setBranches([]);
      }
    },
    [selectedShopId, storageKeys],
  );

  useEffect(() => {
    if (!isUserContextReady) return;

    // If user changes (login another account), force reset & refetch
    const currentUserId = user?.id ? String(user.id) : null;
    if (currentUserId && lastUserIdRef.current && lastUserIdRef.current !== currentUserId) {
      didInitRef.current = false;
      clearLegacyAndCurrentSelection();
      setIsShopContextReady(false);
      setShops([]);
      setSelectedShopIdState(null);
      setSelectedShopState(null);
      setSelectedRole(null);
      setSelectedIndustry(null);
      setBranches([]);
      setSelectedBranchIdState(null);
      setSelectedBranchState(null);
    }
    lastUserIdRef.current = currentUserId;

    // Reset when user logs out / context clears
    if (!user) {
      didInitRef.current = false;
      lastUserIdRef.current = null;
      setShops([]);
      setSelectedShopIdState(null);
      setSelectedShopState(null);
      setSelectedRole(null);
      setSelectedIndustry(null);
      setBranches([]);
      setSelectedBranchIdState(null);
      setSelectedBranchState(null);
      setIsShopContextReady(false);
      return;
    }

    // Prevent repeated fetching (StrictMode + re-renders)
    if (didInitRef.current) return;
    didInitRef.current = true;

    fetchShops();
    fetchEnums();
  }, [isUserContextReady, user, fetchShops, fetchEnums, clearLegacyAndCurrentSelection]);

  // Tự động load branches khi selectedShopId thay đổi
  useEffect(() => {
    if (selectedShopId) {
      fetchBranches(selectedShopId);
    } else {
      setBranches([]);
    }
  }, [selectedShopId, fetchBranches]);

  const isOwner = selectedRole === "OWNER";
  const isStaff = selectedRole === "STAFF";
  const isCashier = selectedRole === "CASHIER";

  const shopPermissions = useMemo(
    () => normalizePermissionSet(selectedShop?.permissions),
    [selectedShop?.permissions],
  );

  const hasShopPermission = useCallback(
    (code) => hasShopPermissionUtil(shopPermissions, code),
    [shopPermissions],
  );
  const hasAnyShopPermission = useCallback(
    (codes) => hasAnyShopPermissionUtil(shopPermissions, codes),
    [shopPermissions],
  );
  const hasAllShopPermissions = useCallback(
    (codes) => hasAllShopPermissionsUtil(shopPermissions, codes),
    [shopPermissions],
  );

  return (
    <ShopContext.Provider
      value={{
        shops,
        selectedShopId,
        setSelectedShopId,
        selectedShop,
        setSelectedShop,
        selectedRole,
        shopRole: selectedRole,
        isOwner,
        isStaff,
        isCashier,
        selectedIndustry,
        fetchShops,
        isShopContextReady,
        setBranches,
        branches,
        fetchBranches,
        selectedBranchId,
        selectedBranch,
        setSelectedBranchId,
        shopPermissions,
        hasShopPermission,
        hasAnyShopPermission,
        hasAllShopPermissions,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export default ShopProvider;
