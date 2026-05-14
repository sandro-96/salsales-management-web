import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWebSocket } from "../hooks/useWebSocket";
import { WebSocketMessageTypes } from "../constants/websocket";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import LanguageSwitcher from "../components/common/LanguageSwitcher.jsx";

const RegisterPage = () => {
  const { t } = useTranslation();
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      tempErrors.email = t("auth.register.errors.emailRequired");
      isValid = false;
    } else if (!emailRegex.test(form.email)) {
      tempErrors.email = t("auth.register.errors.emailInvalid");
      isValid = false;
    }

    if (!form.password) {
      tempErrors.password = t("auth.register.errors.passwordRequired");
      isValid = false;
    } else if (form.password.length < 6) {
      tempErrors.password = t("auth.register.errors.passwordMin");
      isValid = false;
    }

    if (!form.confirmPassword) {
      tempErrors.confirmPassword = t("auth.register.errors.confirmRequired");
      isValid = false;
    } else if (form.password !== form.confirmPassword) {
      tempErrors.confirmPassword = t("auth.register.errors.confirmMismatch");
      isValid = false;
    }

    if (!form.firstName) {
      tempErrors.firstName = t("auth.register.errors.firstNameRequired");
      isValid = false;
    } else if (form.firstName.length > 50) {
      tempErrors.firstName = t("auth.register.errors.firstNameMax");
      isValid = false;
    }

    if (!form.lastName) {
      tempErrors.lastName = t("auth.register.errors.lastNameRequired");
      isValid = false;
    } else if (form.lastName.length > 50) {
      tempErrors.lastName = t("auth.register.errors.lastNameMax");
      isValid = false;
    }

    if (form.middleName && form.middleName.length > 50) {
      tempErrors.middleName = t("auth.register.errors.middleNameMax");
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
        setSuccess(t("auth.register.successVerifyEmail"));
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
          tempErrors.email =
            errorData.message || t("auth.register.errors.registerFailed");
        }
      } else {
        tempErrors.email =
          err.response?.data?.message ||
          t("auth.register.errors.registerFailed");
      }
      setErrors(tempErrors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!connected || !form.email) return;

    const unsubscribe = subscribe(`/topic/verify/${form.email}`, (message) => {
      if (message?.type === WebSocketMessageTypes.EMAIL_VERIFIED) {
        setSuccess(t("auth.register.successVerified"));
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [connected, form.email, navigate, subscribe, t]);

  const inputClass =
    "w-full p-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen flex justify-center p-6 bg-background text-foreground">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      {loading && <LoadingOverlay text={t("auth.login.processing")} />}
      <form
        onSubmit={handleSubmit}
        className="grid w-full max-w-sm grid-cols-1 gap-4"
      >
        <h1 className="text-3xl coiny-regular text-blue-900 dark:text-blue-300">
          {t("brand.appName")}
        </h1>
        <h2 className="text-xl font-bold text-foreground">
          {t("auth.register.title")}
        </h2>
        {success && (
          <p className="text-green-600 dark:text-green-400 text-sm">
            {success}
          </p>
        )}
        {errors && (
          <p className="text-red-500 dark:text-red-400 text-sm">
            {Object.values(errors).find((msg) => msg)}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">
            {t("auth.register.email")}
          </label>
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
              {t("auth.register.firstName")}
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
              {t("auth.register.lastName")}
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
            {t("auth.register.middleName")}
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
          <label className="text-sm font-medium text-foreground">
            {t("auth.register.password")}
          </label>
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
            {t("auth.register.confirmPassword")}
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
          {t("auth.register.submit")}
        </button>
        <p className="text-sm text-center text-muted-foreground mt-3">
          {t("auth.register.alreadyHave")}{" "}
          <Link
            to="/login"
            className="text-blue-600 font-bold hover:underline dark:text-blue-400"
          >
            {t("auth.register.signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
