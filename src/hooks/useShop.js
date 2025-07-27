// src/hooks/useShop.js
import { useContext } from "react";
import { ShopContext } from "../contexts/ShopContext.js";
import { useDevice } from "./useDevice";

export const useShop = () => {
    const context = useContext(ShopContext);
    const device = useDevice();

    if (!context) {
        throw new Error("useShop must be used within a ShopProvider");
    }
    return {
        ...context,
        device
    };
};
