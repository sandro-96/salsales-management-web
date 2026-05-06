import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketMessageTypes } from "../constants/websocket";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
  });
  const [success, setSuccess] = useState("");
  const { subscribe, connected } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateForm = () => {
    let tempErrors = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      middleName: "",
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
        middleName: form.middleName || null,
      });
      if (response.data.success) {
        setSuccess(
          "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
        );
      }
    } catch (err) {
      const errorData = err.response?.data;
      let tempErrors = { ...errors };
      if (errorData && typeof errorData === "object") {
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

  useEffect(() => {
    console.log("🔔 Đăng ký lắng nghe xác minh tài khoản qua WebSocket");
    if (!connected || !form.email) return;

    const unsubscribe = subscribe(`/topic/verify/${form.email}`, (message) => {
      if (message?.type === WebSocketMessageTypes.EMAIL_VERIFIED) {
        console.log("🔔 Nhận:", message);
        setSuccess(
          "Tài khoản đã được xác minh! Bạn sẽ được chuyển hướng đến trang đăng nhập.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [connected, form.email, navigate, subscribe]);

  const inputClass =
    "w-full p-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex justify-center p-6 bg-background text-foreground">
      {loading && <LoadingOverlay text="Đang xử lý..." />}
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-sm grid-cols-1 gap-4"
      >
        <h1 className="text-3xl coiny-regular text-blue-900 dark:text-blue-300">SỔ THU CHI</h1>
        <h2 className="text-xl font-bold text-foreground">Create your account</h2>
        {success && <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>}
        {errors && (
          <p className="text-red-500 dark:text-red-400 text-sm">
            {Object.values(errors).find((msg) => msg)}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            name="email"
            className={inputClass}
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              className={inputClass}
              value={form.firstName}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              className={inputClass}
              value={form.lastName}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Middle Name (Optional)
          </label>
          <input
            type="text"
            name="middleName"
            className={inputClass}
            value={form.middleName}
            maxLength={50}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Password</label>
          <input
            type="password"
            name="password"
            className={inputClass}
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            Password Confirm
          </label>
          <input
            type="password"
            name="confirmPassword"
            className={inputClass}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Create Account
        </button>
        <p className="text-sm text-center text-muted-foreground mt-3">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-bold hover:underline dark:text-blue-400">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
