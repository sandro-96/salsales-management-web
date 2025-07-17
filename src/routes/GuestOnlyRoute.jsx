// src/routes/GuestOnlyRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useShop } from "../hooks/useShop.js";

const GuestOnlyRoute = ({ children }) => {
    const { user } = useAuth();
    const { shops, selectedShopId } = useShop();

    if (user) {
        console.log("User is logged in:", user);
        // Nếu là admin → vào trang admin
        if (user.role.includes("ROLE_ADMIN")) {
            return <Navigate to="/admin" replace />;
        }

        // Nếu là user → xử lý theo shop
        if (user.role.includes("ROLE_USER")) {
            if (!shops || shops.length === 0) {
                return <Navigate to="/create-shop" replace />;
            } else if (!selectedShopId) {
                return <Navigate to="/select-shop" replace />;
            } else {
                return <Navigate to="/overview" replace />;
            }
        }

        // Trường hợp có user nhưng không role hợp lệ
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default GuestOnlyRoute;

