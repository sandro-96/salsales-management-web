/**
 * Resolve in-app navigation target for a notification, if any.
 */
export function getNotificationDestination(notification, isSystemAdmin) {
  if (!notification?.referenceId) return null;

  const { referenceType, referenceId } = notification;

  if (referenceType === "TICKET") {
    const base = isSystemAdmin ? "/admin/support" : "/support";
    return `${base}?ticketId=${encodeURIComponent(referenceId)}`;
  }

  if (
    referenceType === "SUBSCRIPTION" ||
    referenceType === "PAYMENT_TRANSACTION"
  ) {
    return isSystemAdmin ? "/admin/billing" : "/billing";
  }

  if (referenceType === "SHOP") {
    return "/shops";
  }

  return null;
}
