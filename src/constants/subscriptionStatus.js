/** Khớp enum trạng thái gói từ backend (subscription / ShopSimpleResponse). */

export const SUBSCRIPTION_STATUS_LABELS = {
  TRIAL: "Dùng thử",
  ACTIVE: "Đang trả phí",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã huỷ",
};

/**
 * @param {string | null | undefined} status
 * @param {number | null | undefined} daysRemaining
 * @returns {string | null}
 */
export function formatSubscriptionLine(status, daysRemaining) {
  if (status == null) return null;
  const label = SUBSCRIPTION_STATUS_LABELS[status] ?? status;
  if (status === "TRIAL" || status === "ACTIVE") {
    return `${label} · còn ${daysRemaining ?? 0} ngày`;
  }
  return label;
}
