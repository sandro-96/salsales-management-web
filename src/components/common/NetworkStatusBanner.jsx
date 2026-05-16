import { useTranslation } from "react-i18next";
import { WifiOff, CloudOff, SignalLow, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetwork } from "@/hooks/useNetwork.js";
import { useWebSocket } from "@/hooks/useWebSocket.js";
import { useAuth } from "@/hooks/useAuth.js";
import { cn } from "@/lib/utils";

export default function NetworkStatusBanner() {
  const { t } = useTranslation();
  const { status, checking, refresh, apiReachable, browserOnline } = useNetwork();
  const { connected: wsConnected } = useWebSocket();
  const { user } = useAuth();

  const showWsHint =
    !!user &&
    browserOnline &&
    apiReachable &&
    !wsConnected &&
    status === "online";

  if (status === "online" && !showWsHint) return null;

  const config =
    status === "offline"
      ? {
          Icon: WifiOff,
          message: t("network.offline"),
          className:
            "bg-red-600 text-white border-red-700 dark:bg-red-700 dark:border-red-800",
        }
      : status === "api-down"
        ? {
            Icon: CloudOff,
            message: t("network.apiUnreachable"),
            className:
              "bg-orange-600 text-white border-orange-700 dark:bg-orange-700 dark:border-orange-800",
          }
        : status === "slow"
          ? {
              Icon: SignalLow,
              message: t("network.slow"),
              className:
                "bg-amber-600 text-white border-amber-700 dark:bg-amber-700 dark:border-amber-800",
            }
          : {
              Icon: SignalLow,
              message: t("network.realtimePaused"),
              className:
                "bg-slate-700 text-white border-slate-800 dark:bg-slate-600",
            };

  const { Icon, message, className } = config;

  return (
    <div
      role="status"
      className={cn(
        "sticky top-0 z-[60] flex items-center justify-center gap-2 border-b px-3 py-2 text-center text-xs sm:text-sm",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span className="font-medium">{message}</span>
      {(status === "offline" || status === "api-down") && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-1 h-7 shrink-0 bg-white/20 text-white hover:bg-white/30 border-0"
          disabled={checking}
          onClick={() => refresh()}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5 mr-1", checking && "animate-spin")}
          />
          {t("network.retry")}
        </Button>
      )}
    </div>
  );
}
