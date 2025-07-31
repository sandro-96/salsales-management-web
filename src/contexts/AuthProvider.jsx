// src/contexts/AuthProvider.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosInstance from "../api/axiosInstance";
import { AuthContext } from "./AuthContext";

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const loadUser = () => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser({
                    id: decoded.sub,
                    email: decoded.email,
                    role: decoded.role,
                });
            } catch {
                logout();
            }
        }
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("selectedShopId");
        setUser(null);
        navigate("/login");
    };

    const refreshToken = async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return logout();

        try {
            const res = await axiosInstance.post("/auth/refresh-token", { refreshToken });
            localStorage.setItem("accessToken", res.data.data.accessToken);
            loadUser();
        } catch {
            logout();
        }
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{
            user, logout, refreshToken, setUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
