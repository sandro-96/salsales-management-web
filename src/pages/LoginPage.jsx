import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../hooks/useAuth";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import GoogleSignInButton from "../components/common/GoogleSignInButton.jsx";
import { toast } from "sonner";

const LoginPage = () => {
  const { loadUser } = useAuth();
  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        toast.success("Đăng nhập thành công!");
      } else {
        toast.error(res.data.message || "Đăng nhập thất bại.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập thất bại.");
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
        toast.success("Đăng nhập bằng Google thành công!");
        handleAfterLogin(res.data.data);
      } else {
        toast.error(res.data.message || "Đăng nhập Google thất bại.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng nhập Google thất bại.");
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

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <div className="flex-1 p-6 md:p-12 flex flex-col gap-2 justify-center w-full md:max-w-lg md:mx-auto relative">
        <div className="grid w-full max-w-sm grid-cols-1 gap-4 mx-auto">
          {loading && <LoadingOverlay text="Đang xử lý..." />}
          <h1 className="text-3xl coiny-regular text-blue-900 dark:text-blue-300">SỔ THU CHI</h1>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Not having an account?{" "}
              <Link
                to="/register"
                className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
              >
                Sign up for free today.
              </Link>
            </p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full p-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formValue.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
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
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              {loading ? "Processing ..." : "Login"}
            </button>
            <div className="flex items-center my-4">
              <hr className="flex-grow border-t border-border" />
              <span className="mx-5 text-sm font-medium text-muted-foreground">
                Or continue with
              </span>
              <hr className="flex-grow border-t border-border" />
            </div>
            <GoogleSignInButton
              callback={handleGoogleSignIn}
              text="signin_with"
              className="w-full"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
