/** Chuẩn hóa danh sách SĐT từ API (ưu tiên `phones`, fallback `phone`). */
export function resolvePhones(entity) {
  if (Array.isArray(entity?.phones) && entity.phones.length > 0) {
    const seen = new Set();
    const out = [];
    for (const raw of entity.phones) {
      const trimmed = String(raw ?? "").trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
    if (out.length > 0) return out;
  }
  const legacy = String(entity?.phone ?? "").trim();
  return legacy ? [legacy] : [""];
}

export function primaryPhone(entity) {
  const list = resolvePhones(entity);
  return list.find((p) => p.trim())?.trim() || "";
}

/** Chuẩn hóa mảng nhập form → gửi API (bỏ rỗng, giữ thứ tự). */
export function normalizePhoneInputs(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}
