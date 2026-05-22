import { useTranslation } from "react-i18next";
import { CloudOff, Lock, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PosStatusBanner({
  apiReachable,
  browserOnline = true,
  shopPosWriteBlocked,
}) {
  const { t } = useTranslation();

  if (shopPosWriteBlocked) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs font-medium border-b",
          "bg-amber-50 text-amber-950 border-amber-200",
          "dark:bg-amber-500/15 dark:text-amber-100 dark:border-amber-500/30",
        )}
      >
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t("pages.pos.toast.shopLocked")}</span>
      </div>
    );
  }

  if (!apiReachable) {
    const serverDown = browserOnline;
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs font-medium border-b",
          serverDown
            ? "bg-orange-50 text-orange-950 border-orange-200 dark:bg-orange-500/15 dark:text-orange-100 dark:border-orange-500/30"
            : "bg-red-50 text-red-900 border-red-200 dark:bg-red-500/15 dark:text-red-100 dark:border-red-500/30",
        )}
      >
        {serverDown ? (
          <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span>
          {serverDown
            ? t("network.pos.serverDownAction")
            : t("network.pos.offlineAction")}
        </span>
      </div>
    );
  }

  return null;
}
