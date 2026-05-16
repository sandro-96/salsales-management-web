import { useEffect, useRef } from "react";

/**
 * Poll when WebSocket is disconnected (realtime paused).
 * @param {{ enabled?: boolean, connected: boolean, intervalMs?: number, onPoll: () => void }} opts
 */
export function useRealtimePollFallback({
  enabled = true,
  connected,
  intervalMs = 20_000,
  onPoll,
}) {
  const onPollRef = useRef(onPoll);
  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled || connected) return undefined;
    onPollRef.current?.();
    const id = setInterval(() => onPollRef.current?.(), intervalMs);
    return () => clearInterval(id);
  }, [enabled, connected, intervalMs]);
}
