import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ErrorPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    console.log("ErrorPage location state:", location.state?.error);
    
    const error = location.state?.error || {
        status: "Lỗi",
        message: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                <h1 className="text-4xl font-bold text-red-600 mb-4">
                    {error.status || "Lỗi"}
                </h1>
                <p className="text-gray-600 mb-6">{error.message}</p>
                <button
                    onClick={() => navigate("/")}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition duration-300"
                >
                    Quay lại Trang chủ
                </button>
            </div>
        </div>
    );
};

export default ErrorPage;