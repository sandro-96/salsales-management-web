/** @typedef {'offline' | 'timeout' | 'network' | 'server' | 'client' | 'unknown'} NetworkErrorKind */

/**
 * @param {unknown} error
 * @returns {NetworkErrorKind}
 */
export function classifyNetworkError(error) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "offline";
  }
  const code = error?.code;
  if (code === "ECONNABORTED" || error?.message?.includes?.("timeout")) {
    return "timeout";
  }
  if (
    code === "ERR_NETWORK" ||
    code === "ENOTFOUND" ||
    code === "ECONNREFUSED" ||
    !error?.response
  ) {
    return "network";
  }
  const status = error?.response?.status;
  if (status >= 500) return "server";
  if (status >= 400) return "client";
  return "unknown";
}

/** @param {unknown} error */
export function isRetryableGetError(error) {
  const kind = classifyNetworkError(error);
  return kind === "timeout" || kind === "network";
}

/** @param {unknown} error */
export function isNetworkUnreachableError(error) {
  const kind = classifyNetworkError(error);
  return kind === "offline" || kind === "network" || kind === "timeout";
}
