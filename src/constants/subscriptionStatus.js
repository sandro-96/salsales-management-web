import { formatShopSubscriptionLine } from "@/utils/shopLabels";

/** @deprecated Prefer {@link formatShopSubscriptionLine} with `t` from useTranslation. */
export const SUBSCRIPTION_STATUS_LABELS = {
  TRIAL: "Dùng thử",
  ACTIVE: "Đang trả phí",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã huỷ",
};

/**
 * @param {string | null | undefined} status
 * @param {number | null | undefined} daysRemaining
 * @param {(key: string, opts?: object) => string} [t] — when provided, returns localized line
 * @returns {string | null}
 */
export function formatSubscriptionLine(status, daysRemaining, t) {
  if (status == null) return null;
  if (t) return formatShopSubscriptionLine(t, status, daysRemaining);
  const label = SUBSCRIPTION_STATUS_LABELS[status] ?? status;
  if (status === "TRIAL" || status === "ACTIVE") {
    return `${label} · còn ${daysRemaining ?? 0} ngày`;
  }
  return label;
}
