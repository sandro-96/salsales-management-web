import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthPageLayout, {
  authInputClass,
  authPrimaryButtonClass,
} from "@/components/auth/AuthPageLayout.jsx";
import { forgotPassword } from "@/api/authApi.js";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorKey, setErrorKey] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    setErrorKey(null);
    try {
      setLoading(true);
      const res = await forgotPassword(email);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrorKey("auth.forgot.failure");
      }
    } catch {
      setErrorKey("auth.forgot.generalError");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout loading={loading}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-center">
          {t("auth.forgot.title")}
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {t("auth.forgot.hint")}
        </p>
        {submitted && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
            {t("auth.forgot.success")}
          </p>
        )}
        {errorKey && (
          <p className="text-sm text-destructive text-center">{t(errorKey)}</p>
        )}
        <input
          type="email"
          className={authInputClass}
          placeholder={t("auth.forgot.placeholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (submitted) setSubmitted(false);
            if (errorKey) setErrorKey(null);
          }}
          autoComplete="email"
          required
          disabled={loading || submitted}
        />
        <button
          type="submit"
          disabled={loading || submitted}
          className={authPrimaryButtonClass}
        >
          {t("auth.forgot.submit")}
        </button>
        <p className="text-center text-sm">
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.forgot.backToLogin")}
          </Link>
        </p>
      </form>
    </AuthPageLayout>
  );
};

export default ForgotPasswordPage;
