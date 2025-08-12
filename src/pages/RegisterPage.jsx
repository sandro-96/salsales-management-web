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
        middleName: ""
    });
    const [errors, setErrors] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        middleName: ""
    });
    const [success, setSuccess] = useState("");
    const { subscribe, connected } = useWebSocket();
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState("email");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
        // Xóa lỗi khi người dùng bắt đầu nhập
        setErrors({ ...errors, [name]: "" });
    };

    const validateForm = () => {
        let tempErrors = {
            email: "",
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
            middleName: ""
        };
        let isValid = true;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email) {
            tempErrors.email = "Email không được để trống.";
            isValid = false;
        } else if (!emailRegex.test(form.email)) {
            tempErrors.email = "Email không hợp lệ.";
            isValid = false;
        }

        // Password validation
        if (!form.password) {
            tempErrors.password = "Mật khẩu không được để trống.";
            isValid = false;
        } else if (form.password.length < 6) {
            tempErrors.password = "Mật khẩu phải từ 6 ký tự.";
            isValid = false;
        }

        // Confirm Password validation
        if (!form.confirmPassword) {
            tempErrors.confirmPassword = "Xác nhận mật khẩu không được để trống.";
            isValid = false;
        } else if (form.password !== form.confirmPassword) {
            tempErrors.confirmPassword = "Mật khẩu không khớp.";
            isValid = false;
        }

        // FirstName validation
        if (!form.firstName) {
            tempErrors.firstName = "Tên không được để trống.";
            isValid = false;
        } else if (form.firstName.length > 50) {
            tempErrors.firstName = "Tên không được vượt quá 50 ký tự.";
            isValid = false;
        }

        // LastName validation
        if (!form.lastName) {
            tempErrors.lastName = "Họ không được để trống.";
            isValid = false;
        } else if (form.lastName.length > 50) {
            tempErrors.lastName = "Họ không được vượt quá 50 ký tự.";
            isValid = false;
        }

        // MiddleName validation
        if (form.middleName && form.middleName.length > 50) {
            tempErrors.middleName = "Tên đệm không được vượt quá 50 ký tự.";
            isValid = false;
        }

        setErrors(tempErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await axiosInstance.post("/auth/register", {
                email: form.email,
                password: form.password,
                firstName: form.firstName,
                lastName: form.lastName,
                middleName: form.middleName || null
            });
            setSuccess("Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.");
        } catch (err) {
            const errorData = err.response?.data;
            let tempErrors = { ...errors };
            if (errorData && typeof errorData === "object") {
                // Giả định backend trả về { errors: { field: "message" } }
                if (errorData.errors) {
                    Object.keys(errorData.errors).forEach((field) => {
                        tempErrors[field] = errorData.errors[field];
                    });
                } else {
                    tempErrors.email = errorData.message || "Đăng ký thất bại.";
                }
            } else {
                tempErrors.email = err.response?.data?.message || "Đăng ký thất bại.";
            }
            setErrors(tempErrors);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async (response) => {
        setErrors({
            email: "",
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
            middleName: ""
        });
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
            setErrors({
                ...errors,
                email: err.response?.data?.message || "Đăng nhập Google thất bại."
            });
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
                {success && <p className="text-green-600 text-sm mb-2 text-center">{success}</p>}
                {method === "email" ? (
                    <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Họ"
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.lastName}
                                    onChange={handleChange}
                                />
                                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                            </div>
                            <div>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Tên"
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.firstName}
                                    onChange={handleChange}
                                />
                                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                            </div>
                        </div>
                        <div>
                            <input
                                type="text"
                                name="middleName"
                                placeholder="Tên đệm (tùy chọn)"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.middleName}
                                onChange={handleChange}
                            />
                            {errors.middleName && <p className="text-red-500 text-xs mt-1">{errors.middleName}</p>}
                        </div>
                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.email}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <input
                                type="password"
                                name="password"
                                placeholder="Mật khẩu"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.password}
                                onChange={handleChange}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>
                        <div>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Xác nhận mật khẩu"
                                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={form.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>
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