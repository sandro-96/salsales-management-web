/**
 * In-app notifications: prefer templateData from API (type + vars).
 * BROADCAST keeps admin-defined title/message. Legacy rows fall back to VN parsing.
 */

const TITLE_VN_TO_KEY = {
  "Thanh toán thành công": "BILLING_PAYMENT_SUCCESS",
  "Thanh toán không thành công": "BILLING_PAYMENT_FAILED",
  "Chờ xác nhận chuyển khoản subscription": "BILLING_MANUAL_TRANSFER_PENDING",
  "Thời gian dùng thử đã kết thúc": "BILLING_PLAN_EXPIRED_TRIAL",
  "Gói dịch vụ đã hết hạn": "BILLING_PLAN_EXPIRED",
  "Yêu cầu hỗ trợ mới": "TICKET_CREATED",
  "Phản hồi mới trên ticket": "TICKET_REPLIED",
  "Phản hồi mới trên ticket (chưa assign)": "TICKET_REPLIED_UNASSIGNED",
  "Trạng thái ticket đã thay đổi": "TICKET_STATUS_CHANGED",
  "Bạn đã được thêm vào cửa hàng": "STAFF_ADDED",
  "Bạn đã bị gỡ khỏi cửa hàng": "STAFF_REMOVED",
  "Thời gian dùng thử sắp kết thúc": "BILLING_PLAN_EXPIRING_SOON_TRIAL",
  "⚠️ Thời gian dùng thử kết thúc ngày mai": "BILLING_PLAN_EXPIRING_SOON_TRIAL_URGENT",
  "Gói dịch vụ sắp hết hạn": "BILLING_PLAN_EXPIRING_SOON_ACTIVE",
  "⚠️ Gói dịch vụ hết hạn ngày mai": "BILLING_PLAN_EXPIRING_SOON_ACTIVE_URGENT",
};

function templateVars(notification) {
  return notification?.templateData || notification?.templateVars || null;
}

function enrichParams(t, params) {
  if (!params) return {};
  const out = { ...params };
  if (out.role) {
    out.roleLabel = t(`pages.shops.role.${out.role}`, {
      defaultValue: out.role,
    });
  }
  if (out.status) {
    out.statusLabel = t(`pages.notifications.ticketStatus.${out.status}`, {
      defaultValue: out.status,
    });
  }
  if (out.paymentResult) {
    out.resultLabel = t(
      `pages.notifications.paymentResult.${out.paymentResult}`,
      { defaultValue: out.paymentResult },
    );
  }
  if (out.reason) {
    out.reasonPart = `. ${t("pages.notifications.reasonPrefix", { reason: out.reason })}`;
  } else {
    out.reasonPart = ".";
  }
  return out;
}

function resolveTitleKey(type, title, data) {
  if (type === "BROADCAST") return null;
  if (data?.titleKey) return data.titleKey;
  if (title && TITLE_VN_TO_KEY[title]) return TITLE_VN_TO_KEY[title];
  if (type === "BILLING_PLAN_EXPIRED") {
    if (title?.includes("dùng thử") || data?.isTrial) {
      return "BILLING_PLAN_EXPIRED_TRIAL";
    }
    return "BILLING_PLAN_EXPIRED";
  }
  if (type === "TICKET_REPLIED" && title?.includes("chưa assign")) {
    return "TICKET_REPLIED_UNASSIGNED";
  }
  return type;
}

function resolveMessageKey(type, data) {
  if (data?.messageKey) return data.messageKey;
  if (data?.titleKey && type === "BILLING_PLAN_EXPIRING_SOON") {
    return data.titleKey;
  }
  return type;
}

/** @param {import('i18next').TFunction} t */
export function getNotificationTitle(t, notification) {
  const { type, title } = notification || {};
  if (type === "BROADCAST") return title || "";

  const data = templateVars(notification);
  const titleKey = resolveTitleKey(type, title, data);
  if (titleKey) {
    const localized = t(`pages.notifications.titles.${titleKey}`, {
      defaultValue: "",
    });
    if (localized) return localized;
  }
  return title || t(`pages.notifications.types.${type}`, { defaultValue: type });
}

/** Legacy VN message parsers for notifications stored before templateData migration */
function parseBillingPaymentSuccess(message) {
  const m = message?.match(
    /^Shop "([^"]+)" đã được gia hạn tới ngày ([^.]+)\. Ghi nhận thanh toán lúc ([^.]+)\. Chu kỳ hiện tại kết thúc: ([^.]+)\.$/,
  );
  if (!m) return null;
  return {
    key: "BILLING_PAYMENT_SUCCESS",
    params: {
      shopName: m[1],
      untilDate: m[2],
      paidAt: m[3],
      periodEndAt: m[4],
    },
  };
}

function parseBillingPaymentFailed(message) {
  const m = message?.match(
    /^Giao dịch thanh toán cho cửa hàng "([^"]+)" ([^.]+)\. Mã giao dịch: ([^.]+)(?:\. Lý do: (.+))?\.?$/,
  );
  if (!m) return null;
  return {
    key: "BILLING_PAYMENT_FAILED",
    params: {
      shopName: m[1],
      resultLabel: m[2],
      transactionId: m[3],
      reason: m[4] || "",
    },
  };
}

function parseMessageLegacy(type, message, notification) {
  if (!message) return null;
  switch (type) {
    case "BILLING_PAYMENT_SUCCESS":
      return parseBillingPaymentSuccess(message);
    case "BILLING_PAYMENT_FAILED":
      return parseBillingPaymentFailed(message);
    default:
      return null;
  }
}

/** @param {import('i18next').TFunction} t */
export function getNotificationMessage(t, notification, options = {}) {
  const { type, message, title } = notification || {};
  if (type === "BROADCAST") return message || "";

  const data = templateVars(notification);
  if (data && Object.keys(data).length > 0) {
    const messageKey = resolveMessageKey(type, data);
    const params = enrichParams(t, data);
    const localized = t(`pages.notifications.messages.${messageKey}`, {
      ...params,
      defaultValue: "",
    });
    if (localized) return localized;
  }

  const parsed = parseMessageLegacy(type, message, notification);
  if (parsed) {
    const params = enrichParams(t, parsed.params);
    const localized = t(`pages.notifications.messages.${parsed.key}`, {
      ...params,
      defaultValue: "",
    });
    if (localized) return localized;
  }

  if (options.fallbackToOriginal !== false) return message || "";
  return "";
}
