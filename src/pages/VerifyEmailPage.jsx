import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

const VerifyEmailPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("Đang xác minh...");

    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            setStatus("Không tìm thấy token xác minh.");
            return;
        }

        axiosInstance
            .get(`/auth/verify?token=${token}`)
            .then(() => {
                setStatus("Xác minh thành công! Đóng tab này hoặc quay lại trang đăng nhập.");
                // Thử đóng tab
                setTimeout(() => {
                    window.close();
                    // Nếu không được thì fallback về login
                    navigate("/login", { replace: true });
                }, 3000);
            })
            .catch((err) => {
                const msg = err?.response?.data?.message || "Xác minh thất bại.";
                setStatus(msg);
            });
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="bg-white p-8 rounded-lg shadow w-full max-w-md text-center">
                <h2 className="text-xl font-semibold mb-4">Xác minh email</h2>
                <p className="text-gray-700">{status}</p>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
