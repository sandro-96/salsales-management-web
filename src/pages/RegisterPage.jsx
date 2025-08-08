// src/pages/RegisterPage.jsx
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketMessageTypes } from "../constants/websocket";
import Loading from "../components/loading/Loading.jsx";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";

const RegisterPage = () => {
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const { subscribe, connected } = useWebSocket();
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (form.password !== form.confirmPassword) {
            setError("Mật khẩu không khớp.");
            return;
        }
        try {
            setLoading(true);
            await axiosInstance.post("/auth/register", {
                email: form.email,
                password: form.password
            });
            setSuccess("Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.");
        } catch (err) {
            setError(err.response?.data?.message || "Đăng ký thất bại.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("🔔 Đăng ký lắng nghe xác minh tài khoản qua WebSocket");
        if (!connected || !form.email) return;

        const unsubscribe = subscribe(`/topic/verify/${form.email}`, (message) => {
            if (message?.type === WebSocketMessageTypes.EMAIL_VERIFIED) {
                console.log("🔔 Nhận:", message);
                setSuccess("Tài khoản đã được xác minh! Bạn sẽ được chuyển hướng đến trang đăng nhập.");
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            }
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [connected, form.email]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <form className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" onSubmit={handleSubmit}>
                {loading && <LoadingOverlay text="Đang đăng ký tài khoản..." />}
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Tạo tài khoản mới</h2>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                {success && <p className="text-green-600 text-sm mb-3">{success}</p>}
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
                    className="w-full mb-3 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Xác nhận mật khẩu"
                    className="w-full mb-5 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                >
                    Đăng ký
                </button>
                <p className="text-sm text-center text-gray-600 mt-4">
                    Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;
