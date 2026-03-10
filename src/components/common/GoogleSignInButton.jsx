import { useEffect, useRef, useState } from "react";

const GoogleSignInButton = ({
  callback,
  text = "signup_with",
  className = "",
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  const label =
    text === "signin_with" ? "Sign in with Google" : "Sign up with Google";

  useEffect(() => {
    const clientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError(
        "Không tìm thấy Google Client ID. Vui lòng kiểm tra cấu hình môi trường.",
      );
      return;
    }

    const initGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          setLoading(false);
          callback(response);
        },
        cancel_on_tap_outside: true,
      });
      initializedRef.current = true;
    };

    if (window.google?.accounts?.id) {
      initGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
      return () => {
        if (document.body.contains(script)) document.body.removeChild(script);
      };
    }
  }, []);

  const handleClick = () => {
    if (!initializedRef.current) return;
    setLoading(true);
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setLoading(false);
      }
    });
  };

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors disabled:opacity-60 ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="w-5 h-5 shrink-0"
        >
          <path
            fill="#4285F4"
            d="M45.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.1c-.5 2.7-2.1 5-4.4 6.5v5.4h7.1c4.2-3.9 6.7-9.6 6.7-15.9z"
          />
          <path
            fill="#34A853"
            d="M24 46c6 0 11.1-2 14.8-5.4l-7.1-5.4c-2 1.3-4.5 2.1-7.7 2.1-5.9 0-10.9-4-12.7-9.4H4v5.6C7.7 41.5 15.3 46 24 46z"
          />
          <path
            fill="#FBBC05"
            d="M11.3 28c-.5-1.3-.7-2.6-.7-4s.3-2.7.7-4v-5.6H4C2.4 17.5 1.5 20.7 1.5 24s.9 6.5 2.5 9.6l7.3-5.6z"
          />
          <path
            fill="#EA4335"
            d="M24 10.7c3.3 0 6.2 1.1 8.5 3.3l6.4-6.4C34.9 4 29.9 2 24 2 15.3 2 7.7 6.5 4 13.4l7.3 5.6C13.1 14.7 18.1 10.7 24 10.7z"
          />
        </svg>
        {loading ? "Đang xử lý..." : label}
      </button>
    </div>
  );
};

export default GoogleSignInButton;
