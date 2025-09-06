import { useEffect, useState } from "react";

const GoogleSignInButton = ({
  callback,
  text = "signup_with",
  className = "",
}) => {
  const [error, setError] = useState("");

  useEffect(() => {
    const clientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setError(
        "Không tìm thấy Google Client ID. Vui lòng kiểm tra cấu hình môi trường."
      );
      console.error(
        "❌ VITE_APP_GOOGLE_CLIENT_ID không được định nghĩa trong .env"
      );
      return;
    }

    const initGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("googleSignInButton"),
        { theme: "outline", size: "large", text }
      );
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div id="gsi-button" className="w-100">
        <div id="googleSignInButton" className={className}></div>
      </div>
    </div>
  );
};

export default GoogleSignInButton;
