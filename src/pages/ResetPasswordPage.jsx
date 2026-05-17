import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import AuthPageLayout, {
  authInputClass,
  authPrimaryButtonClass,
} from "@/components/auth/AuthPageLayout.jsx";
import { resetPasswordWithToken } from "@/api/authApi.js";

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError(t("auth.reset.missingToken"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.reset.passwordMin"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.reset.passwordMismatch"));
      return;
    }

    try {
      setLoading(true);
      const res = await resetPasswordWithToken({
        token,
        newPassword: password,
      });
      if (res.data?.success) {
        toast.success(t("auth.reset.success"));
        navigate("/login", { replace: true });
      } else {
        setError(res.data?.message || t("auth.reset.failure"));
      }
    } catch (err) {
      setError(err.response?.data?.message || t("auth.reset.failure"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthPageLayout>
        <section className="text-center space-y-4">
          <h2 className="text-xl font-semibold">{t("auth.reset.title")}</h2>
          <p className="text-sm text-destructive">{t("auth.reset.missingToken")}</p>
          <Link
            to="/forgot-password"
            className="inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.reset.requestNew")}
          </Link>
        </section>
      </AuthPageLayout>
    );
  }

  return (
    <AuthPageLayout loading={loading} loadingText={t("auth.reset.submitting")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">
          {t("auth.reset.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {t("auth.reset.subtitle")}
        </p>
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <input
          type="password"
          className={authInputClass}
          placeholder={t("auth.reset.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          disabled={loading}
        />
        <input
          type="password"
          className={authInputClass}
          placeholder={t("auth.reset.confirmPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          {t("auth.reset.submit")}
        </button>
        <p className="text-center text-sm">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.reset.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};

export default ResetPasswordPage;
