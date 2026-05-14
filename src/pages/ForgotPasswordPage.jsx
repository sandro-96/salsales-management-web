// src/pages/ForgotPasswordPage.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import axiosInstance from "../api/axiosInstance";
import LanguageSwitcher from "../components/common/LanguageSwitcher.jsx";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");
    try {
      const res = await axiosInstance.post(
        `/auth/forgot-password?email=${email}`,
      );
      if (res.data.success) {
        setStatus(t("auth.forgot.success"));
      } else {
        setError(res.data.message || t("auth.forgot.failure"));
      }
    } catch (err) {
      console.log(err);
      setError(t("auth.forgot.generalError"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background px-4 text-foreground relative">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-card text-card-foreground p-8 rounded-lg shadow w-full max-w-md border"
      >
        <h2 className="text-xl font-semibold text-center mb-6">
          {t("auth.forgot.title")}
        </h2>
        {status && (
          <p className="text-green-600 dark:text-green-400 text-sm mb-4 text-center">
            {status}
          </p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-4 text-center">
            {error}
          </p>
        )}
        <input
          type="email"
          className="w-full mb-4 p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={t("auth.forgot.placeholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {t("auth.forgot.submit")}
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
