/**
 * Parse Spring Data page payloads (VIA_DTO: { content, page: { totalElements } })
 * and legacy PageImpl ({ content, totalElements }).
 */
export function parseSpringPage(payload) {
  if (payload == null) {
    return { content: [], totalElements: 0 };
  }
  if (Array.isArray(payload)) {
    return { content: payload, totalElements: payload.length };
  }
  if (typeof payload !== "object") {
    return { content: [], totalElements: 0 };
  }

  const content = Array.isArray(payload.content) ? payload.content : [];
  const meta = payload.page ?? payload.metadata ?? payload;
  const totalElements =
    meta?.totalElements ??
    meta?.total ??
    payload.totalElements ??
    payload.total ??
    content.length;

  return {
    content,
    totalElements: Number(totalElements) || 0,
  };
}
