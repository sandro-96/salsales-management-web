// src/routes/RoleBasedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { checkPermission } from "../utils/permission";
import {useShop} from "../hooks/useShop.js";

const RoleBasedRoute = ({ allowedRoles = [], shopScoped = false, children }) => {
    const { user } = useAuth();
    const { selectedRole } = useShop();
    if (!user) return <Navigate to="/login" replace />;
    const roleToCheck = shopScoped ? selectedRole : user?.role;
    if (!checkPermission(roleToCheck, allowedRoles)) {
        return <Navigate to="/unauthorized" />;
    }
    return children;
};

export default RoleBasedRoute;
