import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import GoogleSignInButton, {
  consumeGoogleOAuthReturn,
  clearOAuthHashFromUrl,
} from "../components/common/GoogleSignInButton.jsx";
import AuthPageLayout, {
  authInputClass,
  authPrimaryButtonClass,
} from "../components/auth/AuthPageLayout.jsx";
import { toast } from "sonner";

const LoginPage = () => {
  const { loadUser } = useAuth();
  const { t } = useTranslation();
  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const oauthReturnHandledRef = useRef(false);

  const handleChange = (e) => {
    setFormValue({ ...formValue, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axiosInstance.post("/auth/login", {
        email: formValue.email,
        password: formValue.password,
      });
      if (res.data.success) {
        await handleAfterLogin(res.data.data);
        toast.success(t("auth.login.success"));
      } else {
        toast.error(res.data.message || t("auth.login.failure"));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.login.failure"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (response) => {
    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/login/google", {
        idToken: response.credential,
      });
      if (res.data.success) {
        toast.success(t("auth.login.googleSuccess"));
        await handleAfterLogin(res.data.data);
      } else {
        toast.error(res.data.message || t("auth.login.googleFailure"));
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || t("auth.login.googleFailure"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAfterLogin = async (data) => {
    const accessToken = data.accessToken;
    const decoded = jwtDecode(accessToken);
    const role = decoded.role;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    await loadUser();

    if (!localStorage.getItem("accessToken")) {
      return;
    }

    if (role.includes("ROLE_ADMIN")) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    if (oauthReturnHandledRef.current) return;
    const handled = consumeGoogleOAuthReturn((result) => {
      clearOAuthHashFromUrl();
      if (result.error) {
        if (result.error === "access_denied") {
          toast.info(t("auth.login.googleCancelled"));
        } else if (
          result.error === "state_mismatch" ||
          result.error === "nonce_mismatch"
        ) {
          toast.error(t("auth.login.googleInvalid"));
        } else {
          const desc = result.errorDescription?.replace(/\+/g, " ");
          toast.error(
            desc ||
              t("auth.login.googleErrorGeneric", { code: result.error }),
          );
        }
        return;
      }
      if (result.credential) {
        void handleGoogleSignIn({ credential: result.credential });
      }
    });
    if (handled) oauthReturnHandledRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ đọc hash một lần khi vào /login sau redirect
  }, []);

  return (
    <AuthPageLayout
      loading={loading}
      loadingText={t("auth.login.processing")}
      tagline={t("auth.layout.tagline")}
    >
      <header className="mb-6 space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("auth.login.title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.login.signUp")}
          </Link>
        </p>
      </header>

      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div className="space-y-2">
          <label
            htmlFor="login-email"
            className="text-sm font-medium text-foreground"
          >
            {t("auth.login.email")}
          </label>
          <input
            id="login-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder={t("auth.login.emailPlaceholder")}
            className={authInputClass}
            value={formValue.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="login-password"
            className="text-sm font-medium text-foreground"
          >
            {t("auth.login.password")}
          </label>
          <input
            id="login-password"
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder={t("auth.login.passwordPlaceholder")}
            className={authInputClass}
            value={formValue.password}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-foreground">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              disabled={loading}
              className="h-4 w-4 rounded border-border accent-blue-600"
            />
            {t("auth.login.rememberMe")}
          </label>
          <Link
            to="/forgot-password"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {t("auth.login.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClass}
        >
          {t("auth.login.submit")}
        </button>

        <div className="relative flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border" />
          <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("auth.login.orContinue")}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleSignInButton text="signin_with" className="w-full" />
      </form>
    </AuthPageLayout>
  );
};

export default LoginPage;
