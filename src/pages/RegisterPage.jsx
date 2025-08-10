import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketMessageTypes } from "../constants/websocket";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { jwtDecode } from "jwt-decode";
import GoogleSignInButton from "../components/common/GoogleSignInButton.jsx";

const RegisterPage = () => {
    const { setUser } = useAuth();
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        middleName: "",
        phone: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { subscribe, connected } = useWebSocket();
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("google");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Validation phía client
        if (!form.firstName || !form.lastName) {
            setError("Họ và tên không được để trống.");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Mật khẩu không khớp.");
            return;
        }

        try {
            setLoading(true);
            await axiosInstance.post("/auth/register", {
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName || null,
                phone: form.phone || null
            });
            setSuccess("Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.");
        } catch (err) {
            setError(err.response?.data?.message || "Đăng ký thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async (response) => {
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await axiosInstance.post("/auth/login/google", {
                idToken: response.credential
            });
            if (res.data.success) {
                console.log("🔔 Đăng nhập Google thành công:", res.data);
                handleAfterLogin(res.data.data);
                setSuccess("Đăng ký/Đăng nhập bằng Google thành công!");
                setTimeout(() => {
                    navigate("/select-shop", { replace: true });
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập Google thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const handleAfterLogin = (data) => {
        const accessToken = data.accessToken;
        const decoded = jwtDecode(accessToken);
        const role = decoded.role;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
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
    };

    useEffect(() => {
        console.log("🔔 Đăng ký lắng nghe xác minh tài khoản qua WebSocket");
        if (!connected || !form.email || method !== "email") return;

        const unsubscribe = subscribe(`/topic/verify/${form.email}`, (message) => {
            if (message?.type === WebSocketMessageTypes.EMAIL_VERIFIED) {
                console.log("🔔 Nhận:", message);
                setSuccess("Tài khoản đã được xác minh! Bạn sẽ được chuyển hướng đến trang đăng nhập.");
                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            }
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [connected, form.email, navigate, method]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                {loading && <LoadingOverlay text="Đang xử lý..." />}
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Tạo tài khoản mới</h2>
                <div className="flex mb-3">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${
                            method === "email" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                        } rounded-l-lg`}
                        onClick={() => setMethod("email")}
                    >
                        Dùng Email
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${
                            method === "google" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                        } rounded-r-lg`}
                        onClick={() => setMethod("google")}
                    >
                        Dùng Google
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
                {success && <p className="text-green-600 text-sm mb-2 text-center">{success}</p>}
                {method === "email" ? (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Họ"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                            />
                            <input
                                type="text"
                                name="firstName"
                                placeholder="Tên"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <input
                            type="text"
                            name="middleName"
                            placeholder="Tên đệm (tùy chọn)"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.middleName}
                            onChange={handleChange}
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="tel"
                            name="phone"
                            placeholder="Số điện thoại (tùy chọn)"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.phone}
                            onChange={handleChange}
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Xác nhận mật khẩu"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Đăng ký
                        </button>
                    </form>
                ) : (
                    <div className="space-y-2">
                        <p className="text-gray-600 text-sm">
                            Đăng ký bằng Google để nhanh chóng tạo tài khoản mà không cần nhập email hoặc mật khẩu.
                        </p>
                        <GoogleSignInButton callback={handleGoogleSignIn} text="signup_with" className="w-full" />
                    </div>
                )}
                <p className="text-sm text-center text-gray-600 mt-3">
                    Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;