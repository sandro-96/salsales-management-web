import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import GoogleSignInButton, {
  consumeGoogleOAuthReturn,
  clearOAuthHashFromUrl,
} from "../components/common/GoogleSignInButton.jsx";
import { toast } from "sonner";
import LanguageSwitcher from "../components/common/LanguageSwitcher.jsx";

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
        handleAfterLogin(res.data.data);
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
        handleAfterLogin(res.data.data);
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

  const handleAfterLogin = (data) => {
    const accessToken = data.accessToken;
    const decoded = jwtDecode(accessToken);
    const role = decoded.role;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    loadUser();

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
    <div className="flex flex-col md:flex-row min-h-[100dvh] min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="flex-1 px-4 py-8 sm:px-6 sm:py-12 md:p-12 flex flex-col gap-2 justify-center w-full md:max-w-lg md:mx-auto relative">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6 md:right-8 md:top-8">
          <LanguageSwitcher />
        </div>
        <div className="grid w-full max-w-md grid-cols-1 gap-4 mx-auto">
          {loading && <LoadingOverlay text={t("auth.login.processing")} />}
          <h1 className="text-3xl coiny-regular text-blue-900 dark:text-blue-300">
            {t("brand.appName")}
          </h1>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-foreground">
              {t("auth.login.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("auth.login.noAccount")}{" "}
              <Link
                to="/register"
                className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                {t("auth.login.signUp")}
              </Link>
            </p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                {t("auth.login.email")}
              </label>
              <input
                type="email"
                name="email"
                placeholder={t("auth.login.emailPlaceholder")}
                className="w-full p-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formValue.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                {t("auth.login.password")}
              </label>
              <input
                type="password"
                name="password"
                placeholder={t("auth.login.passwordPlaceholder")}
                className="w-full text-sm p-2 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formValue.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border rounded accent-blue-600"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-foreground"
                >
                  {t("auth.login.rememberMe")}
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {loading ? t("auth.login.processing") : t("auth.login.submit")}
            </button>
            <div className="flex items-center my-4">
              <hr className="flex-grow border-t border-border" />
              <span className="mx-5 text-sm font-medium text-muted-foreground">
                {t("auth.login.orContinue")}
              </span>
              <hr className="flex-grow border-t border-border" />
            </div>
            <GoogleSignInButton text="signin_with" className="w-full" />
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
