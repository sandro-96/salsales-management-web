export const NOTIFICATION_UNREAD_REFRESH_EVENT =
  "notification-unread-refresh";

export const requestNotificationUnreadRefresh = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(NOTIFICATION_UNREAD_REFRESH_EVENT));
};
