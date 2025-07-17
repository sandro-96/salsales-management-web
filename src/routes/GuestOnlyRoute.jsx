// src/routes/GuestOnlyRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

const GuestOnlyRoute = ({ children }) => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default GuestOnlyRoute;
