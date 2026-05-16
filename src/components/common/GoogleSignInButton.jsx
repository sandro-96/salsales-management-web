import { useState } from "react";
import { useTranslation } from "react-i18next";

const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
/** Mặc định: /login — phải trùng tuyệt đối một mục trong Authorized redirect URIs. */
const REDIRECT_PATH = "/login";
const STORAGE_NONCE = "google_oidc_nonce";
const STORAGE_STATE = "google_oidc_state";

/**
 * Phải trùng ký tự với Google Console (gồm http/https, host, cổng, path).
 * - VITE_GOOGLE_OAUTH_REDIRECT_URI: URL đầy đủ (khi reverse proxy / domain cố định).
 * Mặc định dùng origin của tab hiện tại (nonce/state OAuth trong sessionStorage gắn với origin).
 */
function buildRedirectUri() {
  const configured = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI?.trim();
  if (configured) return configured;
  const origin = window.location.origin;
  const href = new URL(REDIRECT_PATH, `${origin}/`).href;
  return href.replace(/\/+$/, "");
}

/** Chuẩn /login (bỏ / thừa) để redirect_uri khớp mục đã khai báo. */
function normalizeLoginPathForOAuth() {
  const trimmed = window.location.pathname.replace(/\/+$/, "") || "/";
  if (trimmed === "/login" && window.location.pathname !== "/login") {
    window.history.replaceState(
      null,
      "",
      `${window.location.origin}/login${window.location.search}`,
    );
  }
}

function parseHashParams() {
  const raw = window.location.hash?.replace(/^#/, "") ?? "";
  if (!raw) return null;
  return new URLSearchParams(raw);
}

function parseJwtPayload(idToken) {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const json = atob(b64 + pad);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Nút Google tĩnh (HTML + SVG) — không dùng gsi/client, không iframe/renderButton.
 * Mở trang đăng nhập Google (redirect); sau khi đăng nhập, Google chuyển về /login#id_token=...
 */
export function consumeGoogleOAuthReturn(callback) {
  const params = parseHashParams();
  if (!params) return false;
  const idToken = params.get("id_token");
  const oauthError = params.get("error");
  if (oauthError) {
    sessionStorage.removeItem(STORAGE_NONCE);
    sessionStorage.removeItem(STORAGE_STATE);
    callback({
      error: oauthError,
      errorDescription: params.get("error_description") || "",
    });
    return true;
  }
  if (!idToken) return false;

  const storedNonce = sessionStorage.getItem(STORAGE_NONCE);
  const storedState = sessionStorage.getItem(STORAGE_STATE);
  sessionStorage.removeItem(STORAGE_NONCE);
  sessionStorage.removeItem(STORAGE_STATE);

  const state = params.get("state");
  if (storedState && state !== storedState) {
    callback({ error: "state_mismatch" });
    return true;
  }

  const payload = parseJwtPayload(idToken);
  if (storedNonce && payload?.nonce !== storedNonce) {
    callback({ error: "nonce_mismatch" });
    return true;
  }

  callback({ credential: idToken });
  return true;
}

export function clearOAuthHashFromUrl() {
  if (!window.location.hash) return;
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

const GoogleSignInButton = ({
  text = "signup_with",
  className = "",
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");

  const label =
    text === "signin_with"
      ? t("auth.google.signInWith")
      : t("auth.google.signUpWith");

  const handleClick = () => {
    setError("");
    const clientId = import.meta.env.VITE_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(t("auth.google.missingClientId"));
      return;
    }

    const nonce = crypto.randomUUID();
    const state = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_NONCE, nonce);
    sessionStorage.setItem(STORAGE_STATE, state);

    normalizeLoginPathForOAuth();

    const redirectUri = buildRedirectUri();
    if (import.meta.env.DEV) {
      // Dán đúng chuỗi này vào Google Cloud Console → Authorized redirect URIs (cả localhost và 127.0.0.1 nếu dùng cả hai).
      console.info("[Google OAuth] redirect_uri =", redirectUri);
      const h = window.location.hostname;
      if (h === "127.0.0.1" || h === "[::1]") {
        console.warn(
          "[Google OAuth] Bạn đang dùng",
          h,
          "— hãy thêm redirect URI này vào Google Console, hoặc mở app bằng localhost cùng cổng và chỉ khai báo URI localhost.",
        );
      }
    }
    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "id_token",
      scope: "openid email profile",
      nonce,
      state,
      prompt: "select_account",
    });

    window.location.assign(`${GOOGLE_AUTH}?${q.toString()}`);
  };

  return (
    <div className={["w-full", className].filter(Boolean).join(" ")}>
      {error ? (
        <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80 dark:bg-card dark:hover:bg-muted/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          className="h-5 w-5 shrink-0"
          aria-hidden
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
        {label}
      </button>
    </div>
  );
};

export default GoogleSignInButton;
