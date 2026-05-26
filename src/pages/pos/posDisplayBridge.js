import { useEffect, useMemo, useState } from "react";

const DISPLAY_ID_SESSION_KEY = "pos_customer_display_id";
const SNAPSHOT_STORAGE_PREFIX = "pos_customer_display_snapshot:";

function hasWindow() {
  return typeof window !== "undefined";
}

function getSnapshotStorageKey(displayId) {
  return `${SNAPSHOT_STORAGE_PREFIX}${displayId}`;
}

function parseSnapshot(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function supportsBroadcastChannel() {
  return hasWindow() && typeof window.BroadcastChannel === "function";
}

function getChannelName(displayId) {
  return `pos_customer_display:${displayId}`;
}

function readStoredSnapshot(displayId) {
  if (!hasWindow() || !displayId) return null;
  try {
    return parseSnapshot(localStorage.getItem(getSnapshotStorageKey(displayId)));
  } catch {
    return null;
  }
}

function formatQuantityLabel(item) {
  if (item.sellByWeight) {
    const weight = Number(item.weight ?? 0);
    const rounded = Number.isFinite(weight)
      ? weight.toLocaleString("vi-VN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 3,
        })
      : "0";
    return item.weightUnit ? `${rounded} ${item.weightUnit}` : rounded;
  }

  return `x${Number(item.quantity ?? 0)}`;
}

function itemQuantityValue(item) {
  if (item.sellByWeight) {
    const weight = Number(item.weight ?? 0);
    return Number.isFinite(weight) ? weight : 0;
  }

  const quantity = Number(item.quantity ?? 0);
  return Number.isFinite(quantity) ? quantity : 0;
}

export function getOrCreatePosCustomerDisplayId() {
  if (!hasWindow()) return null;

  try {
    const existing = sessionStorage.getItem(DISPLAY_ID_SESSION_KEY);
    if (existing) return existing;

    const nextId =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `display-${Date.now()}`;
    sessionStorage.setItem(DISPLAY_ID_SESSION_KEY, nextId);
    return nextId;
  } catch {
    return `display-${Date.now()}`;
  }
}

export function normalizePosCustomerDisplayTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

export function buildPosCustomerDisplayHref(displayId, theme = "dark") {
  if (!displayId || !hasWindow()) return "/pos/display";

  const url = new URL("/pos/display", window.location.origin);
  url.searchParams.set("displayId", displayId);
  url.searchParams.set("theme", normalizePosCustomerDisplayTheme(theme));
  return url.toString();
}

export function buildPosCustomerDisplaySnapshot({
  selectedShop,
  branches,
  effectiveBranchId,
  tables,
  selectedTableId,
  displayOrderCode,
  selectedCustomer,
  guestName,
  guestPhone,
  note,
  cart,
  subtotal,
  totalSavings,
  pointsToRedeem,
  totalAfterPoints,
}) {
  const selectedBranch =
    branches.find((branch) => branch.id === effectiveBranchId) || null;
  const branchName = selectedBranch?.name || null;
  const tableName =
    selectedTableId && selectedTableId !== "none"
      ? tables.find((table) => table.id === selectedTableId)?.name || null
      : null;

  const items = (cart || []).map((item) => {
    const quantityValue = itemQuantityValue(item);
    return {
      lineKey: item.lineKey,
      productName: item.productName,
      quantityLabel: formatQuantityLabel(item),
      quantityValue,
      unitPrice: Number(item.price ?? 0),
      originalUnitPrice: Number(item.originalPrice ?? item.price ?? 0),
      hasDiscount: !!item.hasDiscount,
      promoLabel: item.promoLabel || null,
      lineTotal: Number(item.price ?? 0) * quantityValue,
    };
  });

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    shopName: selectedShop?.name || null,
    branchName,
    orderCode: displayOrderCode || null,
    tableName,
    customerName: selectedCustomer?.name || guestName?.trim() || null,
    customerPhone: selectedCustomer?.phone || guestPhone?.trim() || null,
    note: note?.trim() || null,
    paymentBankName: selectedBranch?.paymentBankName || null,
    paymentAccountNumber: selectedBranch?.paymentAccountNumber || null,
    paymentAccountHolder: selectedBranch?.paymentAccountHolder || null,
    paymentTransferNote: selectedBranch?.paymentTransferNote || null,
    paymentQrImageUrl: selectedBranch?.paymentQrImageUrl || null,
    itemCount: items.length,
    subtotal: Number(subtotal ?? 0),
    totalSavings: Number(totalSavings ?? 0),
    pointsDiscount: Math.max(0, Number(pointsToRedeem ?? 0) * 1000),
    grandTotal: Number(totalAfterPoints ?? 0),
    items,
  };
}

export function publishPosCustomerDisplaySnapshot(displayId, snapshot) {
  if (!hasWindow() || !displayId || !snapshot) return;

  const payload = {
    ...snapshot,
    displayId,
  };

  try {
    localStorage.setItem(
      getSnapshotStorageKey(displayId),
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage quota/access failures; BroadcastChannel can still work.
  }

  if (!supportsBroadcastChannel()) return;

  try {
    const channel = new BroadcastChannel(getChannelName(displayId));
    channel.postMessage(payload);
    channel.close();
  } catch {
    // Ignore channel failures to keep POS interactions uninterrupted.
  }
}

export function usePosCustomerDisplaySnapshot(displayId) {
  const [snapshot, setSnapshot] = useState(() => readStoredSnapshot(displayId));

  useEffect(() => {
    setSnapshot(readStoredSnapshot(displayId));
    if (!hasWindow() || !displayId) return undefined;

    const storageKey = getSnapshotStorageKey(displayId);
    const handleStorage = (event) => {
      if (event.key !== storageKey) return;
      setSnapshot(parseSnapshot(event.newValue));
    };

    window.addEventListener("storage", handleStorage);

    let channel = null;
    if (supportsBroadcastChannel()) {
      channel = new BroadcastChannel(getChannelName(displayId));
      channel.onmessage = (event) => {
        if (event?.data) setSnapshot(event.data);
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
    };
  }, [displayId]);

  return useMemo(() => snapshot, [snapshot]);
}
