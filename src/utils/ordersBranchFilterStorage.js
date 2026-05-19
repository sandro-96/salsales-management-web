const LEGACY_KEY = "ordersBranchFilter";

export function ordersBranchFilterStorageKey(userId, shopId) {
  if (!userId || !shopId) return null;
  return `ordersBranchFilter:${userId}:${shopId}`;
}

export function readOrdersBranchFilter(userId, shopId, branches = []) {
  const key = ordersBranchFilterStorageKey(userId, shopId);
  let saved = key ? localStorage.getItem(key) : null;
  if (!saved && userId && shopId) {
    saved = localStorage.getItem(LEGACY_KEY);
  }
  if (saved === "ALL") return "ALL";
  if (saved && branches.some((b) => b.id === saved)) return saved;
  if (branches.length === 1 && branches[0]?.id) return branches[0].id;
  return "ALL";
}

export function writeOrdersBranchFilter(userId, shopId, value) {
  const key = ordersBranchFilterStorageKey(userId, shopId);
  if (!key || !value) return;
  localStorage.setItem(key, value);
  localStorage.removeItem(LEGACY_KEY);
}
