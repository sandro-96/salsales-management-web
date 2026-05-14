import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axiosInstance from "../api/axiosInstance";
import LanguageSwitcher from "../components/common/LanguageSwitcher.jsx";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(() => t("auth.verify.verifying"));
  const calledRef = useRef(false);
  const token = searchParams.get("token");

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setStatus(t("auth.verify.missingToken"));
      return;
    }

    axiosInstance
      .get(`/auth/verify?token=${token}`)
      .then(() => {
        setStatus(t("auth.verify.success"));
        setTimeout(() => {
          window.close();
          navigate("/login", { replace: true });
        }, 2000);
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || t("auth.verify.failure");
        setStatus(msg);
      });
  }, [token, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-background px-4 text-foreground relative">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="bg-card text-card-foreground p-8 rounded-lg shadow w-full max-w-md text-center border">
        <h2 className="text-xl font-semibold mb-4">{t("auth.verify.title")}</h2>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
