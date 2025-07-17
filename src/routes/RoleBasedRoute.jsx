// src/routes/RoleBasedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RoleBasedRoute = ({ allowedRoles = [], children }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

    return children;
};

export default RoleBasedRoute;
