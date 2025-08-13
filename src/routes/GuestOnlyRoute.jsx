// src/routes/GuestOnlyRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Loading from "../components/loading/Loading.jsx";

const GuestOnlyRoute = ({ children }) => {
    const { user, isUserContextReady } = useAuth();

    if (!isUserContextReady) {
        return <Loading fullScreen />;
    }

    if (user) {
        // Nếu là admin → vào trang admin
        if (user.role.includes("ROLE_ADMIN")) {
            return <Navigate to="/admin" replace />;
        }

        // Nếu là user → xử lý theo shop
        if (user.role.includes("ROLE_USER")) {
            return <Navigate to="/" replace />;
        }

        // Trường hợp có user nhưng không role hợp lệ
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default GuestOnlyRoute;

