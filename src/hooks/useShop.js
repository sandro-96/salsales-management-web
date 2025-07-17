// src/hooks/useShop.js
import { useContext } from "react";
import { ShopContext } from "../contexts/ShopContext.js";

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error("useShop must be used within a ShopProvider");
    }
    return context;
};
