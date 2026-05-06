// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import axiosInstance from "../api/axiosInstance";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("");
        setError("");
        try {
            const res = await axiosInstance.post(`/auth/forgot-password?email=${email}`);
            if (res.data.success) {
                setStatus("Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email của bạn.");
            } else {
                setError(res.data.message || "Yêu cầu thất bại.");
            }
        } catch (err) {
            console.log(err);
            setError("Có lỗi xảy ra. Vui lòng thử lại sau.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background px-4 text-foreground">
            <form onSubmit={handleSubmit} className="bg-card text-card-foreground p-8 rounded-lg shadow w-full max-w-md border">
                <h2 className="text-xl font-semibold text-center mb-6">Quên mật khẩu</h2>
                {status && <p className="text-green-600 dark:text-green-400 text-sm mb-4 text-center">{status}</p>}
                {error && <p className="text-red-600 dark:text-red-400 text-sm mb-4 text-center">{error}</p>}
                <input
                    type="email"
                    className="w-full mb-4 p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                >
                    Gửi yêu cầu
                </button>
            </form>
        </div>
    );
};

export default ForgotPasswordPage;
