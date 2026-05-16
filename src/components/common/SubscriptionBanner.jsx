import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Banner nhắc trạng thái billing:
 * - EXPIRED/CANCELLED: đỏ, chặn thao tác, CTA "Thanh toán ngay".
 * - TRIAL còn ≤ 7 ngày: cam, cảnh báo hạn.
 * - ACTIVE còn ≤ 3 ngày: xanh dương nhẹ nhắc gia hạn.
 * - Các trường hợp còn lại ẩn banner.
 */
export default function SubscriptionBanner() {
  const { t } = useTranslation();
  const { data } = useSubscription();
  const navigate = useNavigate();

  if (!data) return null;
  const { status, trialDaysRemaining = 0, periodDaysRemaining = 0 } = data;

  const goBilling = () => navigate("/billing");

  if (status === "EXPIRED" || status === "CANCELLED") {
    return (
      <Bar tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          <Trans i18nKey="pages.billing.banner.expired" components={{ b: <b /> }} />
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-red-700 hover:bg-white shrink-0 dark:bg-red-100 dark:text-red-900 dark:hover:bg-white"
          onClick={goBilling}
        >
          {t("pages.billing.banner.payNow")}
        </Button>
      </Bar>
    );
  }

  if (status === "TRIAL" && trialDaysRemaining <= 7) {
    return (
      <Bar tone="warn" icon={<Clock className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          <Trans
            i18nKey="pages.billing.banner.trialEnding"
            values={{ days: trialDaysRemaining }}
            components={{ b: <b /> }}
          />
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-amber-800 hover:bg-white shrink-0 dark:bg-amber-100 dark:text-amber-900 dark:hover:bg-white"
          onClick={goBilling}
        >
          {t("pages.billing.banner.viewDetails")}
        </Button>
      </Bar>
    );
  }

  if (status === "ACTIVE" && periodDaysRemaining > 0 && periodDaysRemaining <= 3) {
    return (
      <Bar tone="info" icon={<Info className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          <Trans
            i18nKey="pages.billing.banner.renewSoon"
            values={{ days: periodDaysRemaining }}
            components={{ b: <b /> }}
          />
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-sky-800 hover:bg-white shrink-0 dark:bg-sky-100 dark:text-sky-900 dark:hover:bg-white"
          onClick={goBilling}
        >
          {t("pages.billing.banner.renew")}
        </Button>
      </Bar>
    );
  }

  return null;
}

function Bar({ tone, icon, children }) {
  const toneClass =
    tone === "danger"
      ? "bg-red-600 text-white dark:bg-red-700"
      : tone === "warn"
        ? "bg-amber-500 text-white dark:bg-amber-600"
        : "bg-sky-600 text-white dark:bg-sky-700";
  return (
    <div className={`sticky top-0 z-40 text-sm flex items-center gap-3 px-4 py-2 shadow-md ${toneClass}`}>
      <span className="shrink-0">{icon}</span>
      {children}
    </div>
  );
}
