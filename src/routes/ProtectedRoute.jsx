// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        console.log("ProtectedRoute: No access token found, redirecting to login.");
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default ProtectedRoute;