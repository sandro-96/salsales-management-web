import { useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../hooks/useAuth";
import LoadingOverlay from "../components/loading/LoadingOverlay.jsx";
import GoogleSignInButton from "../components/common/GoogleSignInButton.jsx";

const LoginPage = () => {
  const { setUser, loadUser } = useAuth();
  const [formValue, setFormValue] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormValue({ ...formValue, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      const res = await axiosInstance.post("/auth/login", {
        email: formValue.email,
        password: formValue.password,
      });
      if (res.data.success) {
        handleAfterLogin(res.data.data);
        setSuccess("Đăng nhập thành công!");
      } else {
        setError(res.data.message || "Đăng nhập thất bại.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (response) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("/auth/login/google", {
        idToken: response.credential,
      });
      if (res.data.success) {
        setSuccess("Đăng nhập bằng Google thành công!");
        handleAfterLogin(res.data.data);
      } else {
        setError(res.data.message || "Đăng nhập Google thất bại.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập Google thất bại.");
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
    <div className="flex flex-row h-screen">
      <div className="basis-full p-12 flex flex-col gap-2 justify-center max-w-lg mx-auto relative">
        <div className="grid w-full max-w-sm grid-cols-1 gap-4">
          {loading && <LoadingOverlay text="Đang xử lý..." />}
          <h1 className="text-xl font-bold font-serif text-blue-900">
            VMANAGE
          </h1>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-gray-800">
              Sign in to your account
            </h2>
            <p className="text-sm text-gray-600">
              Not having an account?{" "}
              <Link
                to="/register"
                className="text-sm font-bold text-blue-600 hover:underline"
              >
                Sign up for free today.
              </Link>
            </p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formValue.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Mật khẩu"
                className="w-full text-sm p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-400 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-medium"
            >
              {loading ? "Processing ..." : "Login"}
            </button>
            <div className="flex items-center my-4">
              <hr className="flex-grow border-t border-gray-300" />
              <span className="mx-5 text-sm font-medium text-gray-700">
                Or continue with
              </span>
              <hr className="flex-grow border-t border-gray-300" />
            </div>
            <GoogleSignInButton
              callback={handleGoogleSignIn}
              text="signin_with"
              className="w-full"
            />
          </form>
        </div>
      </div>
      <div className="basis-full bg-[url(https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1908&q=80)] bg-center bg-cover"></div>
    </div>
  );
};

export default LoginPage;
