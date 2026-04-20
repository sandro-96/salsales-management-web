import { useCallback, useEffect, useState } from "react";
import { getCurrentSubscription } from "@/api/subscriptionApi";

/**
 * Fetch subscription của shop hiện tại. Tự refetch khi focus tab hoặc khi gọi refresh().
 * Trả về { data, loading, error, refresh }.
 */
export function useSubscription({ enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCurrentSubscription();
      const payload = res?.data?.data ?? res?.data ?? null;
      setData(payload);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, load]);

  return { data, loading, error, refresh: load };
}
