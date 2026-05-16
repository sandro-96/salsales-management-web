import axios from "axios";

const PING_TIMEOUT_MS = 8000;

/**
 * OpenAPI docs are permitAll at server root `/v3/api-docs`, not under `/api`.
 * `VITE_API_BASE_URL` is typically `http://host:port/api`.
 */
export function resolveApiPingUrl(apiBase) {
  const base = (apiBase || "").replace(/\/$/, "");
  if (!base) return null;
  if (base.endsWith("/api")) {
    return `${base.slice(0, -4)}/v3/api-docs`;
  }
  return `${base}/v3/api-docs`;
}

/**
 * Best-effort check that the API host responds.
 * @returns {Promise<boolean>}
 */
export async function pingApiReachability() {
  const pingUrl = resolveApiPingUrl(import.meta.env.VITE_API_BASE_URL);
  if (!pingUrl) {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;

  try {
    await axios.get(pingUrl, {
      timeout: PING_TIMEOUT_MS,
      validateStatus: (s) => s >= 200 && s < 300,
    });
    return true;
  } catch {
    return false;
  }
}
