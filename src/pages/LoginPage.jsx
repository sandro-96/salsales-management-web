// src/pages/LoginPage.jsx
import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";
import { useAuth } from "../hooks/useAuth";
import Loading from "../components/loading/Loading.jsx";

const LoginPage = () => {
    const { setUser } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        setLoading(true);
        e.preventDefault();
        try {
            const res = await axiosInstance.post("/auth/login", { email, password });
            if (res.data.success) {
                const accessToken = res.data.data.accessToken;
                const decoded = jwtDecode(accessToken);
                const role = decoded.role;
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", res.data.data.refreshToken);
                setUser({
                    id: decoded.sub,
                    email: decoded.email,
                    role: role,
                });

                if (role.includes("ROLE_ADMIN")) {
                    navigate("/admin", { replace: true });
                } else {
                    navigate("/select-shop", { replace: true });
                }
            } else {
                setError(res.data.message || "Đăng nhập thất bại.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading text="Đang đăng nhập ..." fullScreen/>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" onSubmit={handleLogin}>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng nhập</h2>
                {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full mb-3 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Mật khẩu"
                    className="w-full mb-5 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
                <div className="text-sm text-center text-gray-600 mt-4 space-y-2">
                    <p>
                        Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký</Link>
                    </p>
                    <p>
                        <Link to="#" className="text-blue-600 hover:underline">Quên mật khẩu?</Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default LoginPage;