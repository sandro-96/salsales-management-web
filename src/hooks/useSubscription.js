import { useCallback, useEffect, useState } from "react";
import { getCurrentSubscription } from "@/api/subscriptionApi";

/**
 * Fetch subscription của shop hiện tại.
 * @param {boolean} enabled
 * @param {boolean} refetchOnWindowFocus — mặc định false (tránh reload khi đổi tab/cửa sổ).
 */
export function useSubscription({
  enabled = true,
  shopId,
  refetchOnWindowFocus = false,
} = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getCurrentSubscription(shopId);
      const payload = res?.data?.data ?? res?.data ?? null;
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (!enabled) return;
    load(false);
  }, [enabled, shopId, load]);

  useEffect(() => {
    if (!enabled || !refetchOnWindowFocus) return;
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, refetchOnWindowFocus, load]);

  return { data, loading, error, refresh: load };
}
