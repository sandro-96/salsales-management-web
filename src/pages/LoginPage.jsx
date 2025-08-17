import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../hooks/useAuth";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import GoogleSignInButton from "../components/common/GoogleSignInButton.jsx";

const LoginPage = () => {
    const { setUser } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("email"); // "email" hoặc "google"
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            setLoading(true);
            const res = await axiosInstance.post("/auth/login", {
                email: form.email,
                password: form.password
            });
            if (res.data.success) {
                handleAfterLogin(res.data.data);
                setSuccess("Đăng nhập thành công!");
            } else {
                setError(res.data.message || "Đăng nhập thất bại.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập thất bại.");
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
                setSuccess("Đăng nhập bằng Google thành công!");
                handleAfterLogin(res.data.data);
            } else {
                setError(res.data.message || "Đăng nhập Google thất bại.");
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
            navigate("/", { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                {loading && <LoadingOverlay text="Đang xử lý..." />}
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng nhập</h2>
                <div className="flex mb-4">
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${
                            method === "email" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                        } rounded-l-lg`}
                        onClick={() => {
                            setMethod("email");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Dùng Email
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-medium ${
                            method === "google" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                        } rounded-r-lg`}
                        onClick={() => {
                            setMethod("google");
                            setError("");
                            setSuccess("");
                        }}
                    >
                        Dùng Google
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mb-3 text-center">{error}</p>}
                {success && <p className="text-green-600 text-sm mb-3 text-center">{success}</p>}
                {method === "email" ? (
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            className="w-full mb-3 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            className="w-full mb-5 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mb-5 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                        >
                            {loading ? "Đang xử lý..." : "Đăng nhập"}
                        </button>
                    </form>
                ) : (
                    <div>
                        <p className="text-gray-600 text-sm mb-3">
                            Đăng nhập bằng Google để nhanh chóng truy cập mà không cần nhập email hoặc mật khẩu.
                        </p>
                        <GoogleSignInButton callback={handleGoogleSignIn} text="signin_with" className="w-full mb-3" />
                    </div>
                )}
                <div className="text-sm text-center text-gray-600 mt-4 space-y-2">
                    <p>
                        Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký</Link>
                    </p>
                    <p>
                        <Link to="/forgot-password" className="text-blue-600 hover:underline">Quên mật khẩu?</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;