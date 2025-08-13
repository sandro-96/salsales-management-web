// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Loading from "../components/loading/Loading.jsx";

const ProtectedRoute = ({ children }) => {
    const { user, isUserContextReady } = useAuth();

    // Chờ context load xong
    if (!isUserContextReady) {
        return <Loading fullScreen />
    }

    // Chưa đăng nhập
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
