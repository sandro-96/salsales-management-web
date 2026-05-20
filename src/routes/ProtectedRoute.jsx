// src/routes/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Loading from "../components/loading/Loading.jsx";

const ProtectedRoute = ({ children, guestRedirect = "/login" }) => {
    const { user, isUserContextReady } = useAuth();
    const { pathname } = useLocation();

    // Chờ context load xong
    if (!isUserContextReady) {
        return <Loading fullScreen />
    }

    // Chưa đăng nhập
    if (!user) {
        const redirectTo =
            guestRedirect === "/landing" && pathname !== "/"
                ? "/login"
                : guestRedirect;
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
