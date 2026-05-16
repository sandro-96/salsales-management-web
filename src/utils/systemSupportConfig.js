function envStr(key) {
  const v = import.meta.env?.[key];
  return typeof v === "string" ? v.trim() : "";
}

export function zaloHref(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return null;
  return `https://zalo.me/${digits}`;
}

/** Thông tin liên hệ hệ thống từ biến môi trường Vite. */
export function getSystemSupportConfig() {
  const name = envStr("VITE_SUPPORT_NAME");
  const phone = envStr("VITE_SUPPORT_PHONE");
  const email = envStr("VITE_SUPPORT_EMAIL");
  const zalo = envStr("VITE_SUPPORT_ZALO");
  const note = envStr("VITE_SUPPORT_NOTE");
  return {
    name,
    phone,
    email,
    zalo,
    zaloUrl: zaloHref(zalo),
    note,
    hasAny: !!(name || phone || email || zalo || note),
  };
}
