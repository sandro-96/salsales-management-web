import { useCallback, useEffect, useRef, useState } from "react";
import { pingApiReachability } from "../utils/apiReachability.js";

const API_CHECK_INTERVAL_MS = 30_000;

/**
 * @typedef {'online' | 'offline' | 'api-down' | 'slow'} NetworkUiStatus
 */

/**
 * Browser online + periodic API ping.
 * @returns {{
 *   browserOnline: boolean,
 *   apiReachable: boolean,
 *   checking: boolean,
 *   slowConnection: boolean,
 *   status: NetworkUiStatus,
 *   refresh: () => Promise<void>,
 * }}
 */
export function useNetworkStatus() {
  const [browserOnline, setBrowserOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [apiReachable, setApiReachable] = useState(true);
  const [checking, setChecking] = useState(false);
  const [slowConnection, setSlowConnection] = useState(false);
  const checkInFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (checkInFlight.current) return;
    checkInFlight.current = true;
    setChecking(true);
    try {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setApiReachable(false);
        return;
      }
      const ok = await pingApiReachability();
      setApiReachable(ok);
    } finally {
      setChecking(false);
      checkInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const onOnline = () => {
      setBrowserOnline(true);
      refresh();
    };
    const onOffline = () => {
      setBrowserOnline(false);
      setApiReachable(false);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, API_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const conn =
      typeof navigator !== "undefined"
        ? navigator.connection ||
          navigator.mozConnection ||
          navigator.webkitConnection
        : null;
    if (!conn) return;

    const updateSlow = () => {
      const slow =
        conn.saveData === true ||
        conn.effectiveType === "slow-2g" ||
        conn.effectiveType === "2g";
      setSlowConnection(slow);
    };
    updateSlow();
    conn.addEventListener?.("change", updateSlow);
    return () => conn.removeEventListener?.("change", updateSlow);
  }, []);

  /** @type {NetworkUiStatus} */
  let status = "online";
  if (!browserOnline) status = "offline";
  else if (!apiReachable) status = "api-down";
  else if (slowConnection) status = "slow";

  return {
    browserOnline,
    apiReachable,
    checking,
    slowConnection,
    status,
    refresh,
  };
}
