/**
 * Resolve API error/success text: prefer i18n messageKey, fall back to server message.
 * Server message is already localized when Accept-Language is sent.
 */
export function resolveApiMessage(t, data) {
  if (!data) return "";
  const { messageKey, message } = data;
  if (messageKey) {
    const localized = t(messageKey, { defaultValue: "" });
    if (localized) return localized;
  }
  return message || "";
}

export function resolveApiError(t, error) {
  return resolveApiMessage(t, error?.response?.data);
}
