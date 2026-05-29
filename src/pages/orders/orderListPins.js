const KEY_PREFIX = "orders-pinned";

export function pinnedOrdersStorageKey(shopId) {
  if (!shopId) return null;
  return `${KEY_PREFIX}:${shopId}`;
}

export function readPinnedOrderIds(shopId) {
  try {
    const key = pinnedOrdersStorageKey(shopId);
    if (!key) return new Set();
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
  } catch {
    return new Set();
  }
}

export function writePinnedOrderIds(shopId, ids) {
  try {
    const key = pinnedOrdersStorageKey(shopId);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export function togglePinnedOrderId(shopId, orderId, currentSet) {
  const next = new Set(currentSet);
  if (next.has(orderId)) next.delete(orderId);
  else next.add(orderId);
  writePinnedOrderIds(shopId, next);
  return next;
}

export function sortOrdersWithPinnedFirst(orders, pinnedIds) {
  if (!pinnedIds?.size || !orders?.length) return orders;
  const pinned = [];
  const rest = [];
  for (const order of orders) {
    if (pinnedIds.has(order.id)) pinned.push(order);
    else rest.push(order);
  }
  return [...pinned, ...rest];
}
