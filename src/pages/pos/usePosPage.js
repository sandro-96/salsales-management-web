import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useBranchChannel } from "../../hooks/useBranchChannel.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";
import { getBranchProducts } from "../../api/productApi";
import { getCurrentOrderByTable, getTables } from "../../api/tableApi";
import { getPromotions } from "../../api/promotionApi";
import {
  createTableGroup,
  deleteTableGroup,
  getTableGroups,
} from "../../api/tableGroupApi";
import {
  createOrder,
  confirmPayment,
  uploadOrderPaymentProof,
  previewOrderTax,
  patchOrderFulfillment,
  updateOrder,
  moveOrderTable,
  splitOrder,
  mergeTableGroupOrders,
  lookupOrderForPosEdit,
} from "../../api/orderApi";
import {
  createCustomer,
  getCustomers,
  getCustomerPoints,
} from "../../api/customerApi";

import { ALL_CATEGORY } from "./posConstants";
import { cartFromOrderItems, createEmptyTab } from "./posCartUtils";
import {
  buildPromotionMap,
  getWinningPromo,
  calcDiscountedPrice,
  formatDiscount,
} from "./posPromotionUtils";
import {
  hasBranchVariants,
  variantCatalogName,
  activeToppings,
  normalizeToppingIdList,
  toppingExtrasForSelection,
  formatToppingSelectionLabel,
} from "./posProductUtils";
import { buildDraftOrderForInvoice } from "./posInvoiceDraft";
import { getPaymentMethodLabel, posNumberLocale } from "../../utils/posHelpers";
import { resolveInvoiceLocale } from "../../utils/invoiceLocale.js";
import { getInvoiceT } from "../../utils/invoiceI18n.js";

function isShopInactiveApiError(err) {
  const c = err?.response?.data?.code;
  return c === "4133" || c === 4133;
}

export function usePosPage() {
  const { t, i18n } = useTranslation();
  const numberLocale = posNumberLocale(i18n.language);
  const location = useLocation();
  const navigate = useNavigate();

  const toastShopLockedPos = useCallback(() => {
    toast.error(t("pages.pos.toast.shopLocked"));
  }, [t]);

  const toastPosOrderError = useCallback((err, fallback) => {
    if (isShopInactiveApiError(err)) {
      toast.error(t("pages.pos.toast.shopLocked"));
      return;
    }
    toast.error(err?.response?.data?.message || fallback);
  }, [t]);
  const {
    selectedShopId,
    selectedBranchId,
    branches,
    setSelectedBranchId,
    selectedShop,
  } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const canPay = hasShopPermission(PERM.ORDER_PAYMENT_CONFIRM);

  const shopPosWriteBlocked = useMemo(
    () => selectedShop?.active === false,
    [selectedShop?.active],
  );

  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

  const [orderTabs, setOrderTabs] = useState([createEmptyTab(1)]);
  const [activeTabId, setActiveTabId] = useState(1);
  const activeTabIdRef = React.useRef(activeTabId);
  const nextTabIdRef = React.useRef(2);

  useEffect(() => {
    activeTabIdRef.current = activeTabId;
  }, [activeTabId]);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const openPosCheckout = useCallback(() => {
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    setCheckoutOpen(true);
  }, [shopPosWriteBlocked, toastShopLockedPos]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transferPaymentProofFile, setTransferPaymentProofFile] =
    useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (paymentMethod !== "Transfer") setTransferPaymentProofFile(null);
  }, [paymentMethod]);
  const [holdSuccessOpen, setHoldSuccessOpen] = useState(false);
  const [holdSuccessMessage, setHoldSuccessMessage] = useState("");
  const [moveTableOpen, setMoveTableOpen] = useState(false);
  const [moveToTableId, setMoveToTableId] = useState("none");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePayload, setInvoicePayload] = useState(null);
  const [invoicePreviewOpen, setInvoicePreviewOpen] = useState(false);
  const [previewPrintedAt, setPreviewPrintedAt] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState(null);
  const [toppingPicker, setToppingPicker] = useState(null);

  const [postSaleOpen, setPostSaleOpen] = useState(false);
  const [postSaleOrderId, setPostSaleOrderId] = useState(null);
  const [postSaleName, setPostSaleName] = useState("");
  const [postSalePhone, setPostSalePhone] = useState("");
  const [postSaleSaving, setPostSaleSaving] = useState(false);

  const [customerResults, setCustomerResults] = useState([]);
  const [customerSearching, setCustomerSearching] = useState(false);

  const [tableGroups, setTableGroups] = useState([]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupSelectedIds, setGroupSelectedIds] = useState([]);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [splitToTableId, setSplitToTableId] = useState("none");
  const [splitQtyByLineKey, setSplitQtyByLineKey] = useState({});
  const [mergeGroupSubmitting, setMergeGroupSubmitting] = useState(false);

  const [orderLookupInput, setOrderLookupInput] = useState("");
  const [orderLookupSubmitting, setOrderLookupSubmitting] = useState(false);

  const tableGroupByTableId = useMemo(() => {
    const map = new Map();
    (tableGroups || []).forEach((g) => {
      (g.tableIds || []).forEach((tid) => {
        if (tid) map.set(tid, g);
      });
    });
    return map;
  }, [tableGroups]);

  const activeTab = orderTabs.find((t) => t.id === activeTabId) || orderTabs[0];
  const cart = useMemo(() => activeTab?.cart || [], [activeTab]);
  const cartRef = React.useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);
  const selectedTableId = activeTab?.tableId || "";
  const note = activeTab?.note || "";
  const selectedCustomer = activeTab?.customer || null;
  const guestName = activeTab?.guestName ?? "";
  const guestPhone = activeTab?.guestPhone ?? "";
  const displayOrderCode = activeTab?.displayOrderCode ?? null;
  const pointsToRedeem = activeTab?.pointsToRedeem || 0;
  const activeOrderId = activeTab?.orderId || null;

  const activeGroup = useMemo(() => {
    if (!selectedTableId || selectedTableId === "none") return null;
    return tableGroupByTableId.get(selectedTableId) || null;
  }, [selectedTableId, tableGroupByTableId]);

  const updateActiveTab = useCallback((updates) => {
    const aid = activeTabIdRef.current;
    setOrderTabs((prev) =>
      prev.map((tab) => (tab.id === aid ? { ...tab, ...updates } : tab)),
    );
  }, []);

  const setCart = useCallback((updater) => {
    const aid = activeTabIdRef.current;
    setOrderTabs((prev) =>
      prev.map((tab) => {
        if (tab.id !== aid) return tab;
        const newCart =
          typeof updater === "function" ? updater(tab.cart) : updater;
        return { ...tab, cart: newCart };
      }),
    );
  }, []);

  const activateTableTab = useCallback(
    (tableId) => {
      if (!tableId || tableId === "none") {
        updateActiveTab({ tableId });
        return;
      }

      let nextActiveId = null;
      setOrderTabs((prev) => {
        const existing = prev.find((t) => t.tableId === tableId);
        if (existing) {
          nextActiveId = existing.id;
          return prev;
        }
        const id = nextTabIdRef.current++;
        const nextTab = { ...createEmptyTab(id), tableId };
        nextActiveId = nextTab.id;
        return [...prev, nextTab];
      });

      if (nextActiveId != null) {
        activeTabIdRef.current = nextActiveId;
        setActiveTabId(nextActiveId);
        setCustomerResults([]);
      }
    },
    [updateActiveTab],
  );

  const setSelectedTableId = useCallback(
    async (v) => {
      if (!v || v === "none") {
        updateActiveTab({ tableId: v });
        return;
      }

      // Selecting another table should open/switch to an order tab for that table,
      // not move the currently loaded order.
      activateTableTab(v);
    },
    [activateTableTab, updateActiveTab],
  );
  const setNote = useCallback(
    (v) => updateActiveTab({ note: v }),
    [updateActiveTab],
  );
  const setSelectedCustomer = useCallback(
    (v) => updateActiveTab({ customer: v }),
    [updateActiveTab],
  );
  const setPointsToRedeem = useCallback(
    (v) => updateActiveTab({ pointsToRedeem: v }),
    [updateActiveTab],
  );
  const setGuestName = useCallback(
    (v) => updateActiveTab({ guestName: v }),
    [updateActiveTab],
  );
  const setGuestPhone = useCallback(
    (v) => updateActiveTab({ guestPhone: v }),
    [updateActiveTab],
  );

  const addTab = useCallback(() => {
    const id = nextTabIdRef.current++;
    activeTabIdRef.current = id;
    setOrderTabs((prev) => [...prev, createEmptyTab(id)]);
    setActiveTabId(id);
    setCustomerResults([]);
  }, []);

  const switchTab = useCallback(
    (tabId) => {
      if (tabId !== activeTabId) {
        activeTabIdRef.current = tabId;
        setActiveTabId(tabId);
        setCustomerResults([]);
      }
    },
    [activeTabId],
  );

  const closeTab = useCallback(
    (tabId) => {
      setOrderTabs((prev) => {
        if (prev.length <= 1) return prev;
        const filtered = prev.filter((t) => t.id !== tabId);
        // Chỉ còn 1 đơn: reset bộ đếm id để đơn mới không bị nhảy số (vd. xóa đơn 2 → thêm lại là đơn 2).
        if (filtered.length === 1) {
          nextTabIdRef.current = filtered[0].id + 1;
        }
        if (tabId === activeTabId) {
          const idx = prev.findIndex((t) => t.id === tabId);
          const next = filtered[Math.min(idx, filtered.length - 1)];
          activeTabIdRef.current = next.id;
          setActiveTabId(next.id);
        }
        return filtered;
      });
    },
    [activeTabId],
  );

  const effectiveBranchId =
    selectedBranchId || (branches.length === 1 ? branches[0]?.id : null);

  const groupOrderTabs = useMemo(() => {
    if (!activeGroup?.tableIds?.length) return [];
    const set = new Set((activeGroup.tableIds || []).filter(Boolean));
    return orderTabs.filter(
      (t) => t.tableId && t.tableId !== "none" && set.has(t.tableId),
    );
  }, [activeGroup, orderTabs]);

  const mergeGroupBillDisabled = useMemo(() => {
    if (shopPosWriteBlocked) return true;
    if (!selectedShopId) return true;
    if (!effectiveBranchId) return true;
    if (!activeGroup?.id) return true;
    if (groupOrderTabs.length < 2) return true;
    if (!groupOrderTabs.every((t) => !!t.orderId)) return true;
    if (!activeOrderId) return true;
    const targetTab = groupOrderTabs.find((t) => t.id === activeTabId);
    if (!targetTab?.orderId) return true;
    const ids = new Set(groupOrderTabs.map((t) => t.orderId));
    return ids.size < 2;
  }, [
    selectedShopId,
    effectiveBranchId,
    activeGroup,
    groupOrderTabs,
    activeOrderId,
    activeTabId,
    shopPosWriteBlocked,
  ]);

  // Resume open order by table (multi-device)
  useEffect(() => {
    if (!selectedShopId) return;
    if (!selectedTableId || selectedTableId === "none") return;
    if (!effectiveBranchId) return;

    let alive = true;
    (async () => {
      try {
        const res = await getCurrentOrderByTable(
          selectedShopId,
          selectedTableId,
        );
        const order = res.data?.data;
        if (!alive) return;
        if (!order?.id) return;
        // If already loaded, skip
        if (activeOrderId && activeOrderId === order.id) return;

        updateActiveTab({
          orderId: order.id,
          displayOrderCode: order.orderCode || null,
          cart: cartFromOrderItems(order.items, t),
          note: order.note || "",
          customer: order.customerId
            ? {
                id: order.customerId,
                name: order.customerName,
                phone: order.customerPhone,
              }
            : null,
          pointsToRedeem: order.pointsRedeemed ?? 0,
          guestName: order.guestName || "",
          guestPhone: order.guestPhone || "",
        });
        toast.info(t("pages.pos.toast.tableOrderLoaded"));
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    selectedShopId,
    selectedTableId,
    effectiveBranchId,
    activeOrderId,
    updateActiveTab,
    t,
  ]);

  const fetchData = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    setLoading(true);
    try {
      const [prodRes, tableRes, promoRes] = await Promise.all([
        getBranchProducts(selectedShopId, effectiveBranchId, {
          size: 500,
          active: true,
        }),
        getTables(selectedShopId, effectiveBranchId),
        getPromotions(selectedShopId, {
          branchId: effectiveBranchId,
          size: 200,
        }),
      ]);
      const prodList = prodRes.data?.data?.content || prodRes.data?.data || [];
      setProducts(prodList.filter((p) => p.activeInBranch !== false));
      const tableList =
        tableRes.data?.data?.content || tableRes.data?.data || [];
      setTables(tableList);
      const promoList =
        promoRes.data?.data?.content || promoRes.data?.data || [];
      setPromotions(promoList);
    } catch (err) {
      console.error("Failed to load POS data", err);
      toast.error(t("pages.pos.toast.loadProductsFailed"));
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, effectiveBranchId, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchGroups = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    try {
      const res = await getTableGroups(selectedShopId, effectiveBranchId);
      setTableGroups(res.data?.data || []);
    } catch {
      setTableGroups([]);
    }
  }, [selectedShopId, effectiveBranchId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // ── Realtime: tables (cập nhật trạng thái bàn tại chỗ) ───────────────────
  const onRealtimeTable = useCallback((msg) => {
    if (!msg?.type || !msg.data) return;
    const payload = msg.data;
    if (msg.type === WebSocketMessageTypes.TABLE_DELETED) {
      setTables((prev) => prev.filter((t) => t.id !== payload.id));
      return;
    }
    if (msg.type === WebSocketMessageTypes.TABLE_CREATED) {
      setTables((prev) => {
        if (prev.some((t) => t.id === payload.id)) return prev;
        return [...prev, payload];
      });
      return;
    }
    if (
      msg.type === WebSocketMessageTypes.TABLE_UPDATED ||
      msg.type === WebSocketMessageTypes.TABLE_STATUS_CHANGED ||
      msg.type === WebSocketMessageTypes.TABLE_ASSIGNED
    ) {
      setTables((prev) =>
        prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)),
      );
    }
  }, []);
  useBranchChannel("tables", onRealtimeTable, { branchId: effectiveBranchId });

  // ── Realtime: orders (đồng bộ đơn đang mở giữa nhiều staff) ──────────────
  const onRealtimeOrder = useCallback(
    (msg) => {
      if (!msg?.type || !msg.data) return;
      const payload = msg.data;
      const orderId = payload.id;
      if (!orderId) return;

      // Chỉ quan tâm đơn đang nằm trên 1 trong các tab của POS.
      setOrderTabs((prev) => {
        const idx = prev.findIndex((t) => t.orderId === orderId);
        if (idx < 0) return prev;

        if (msg.type === WebSocketMessageTypes.ORDER_DELETED) {
          // Đơn bị xoá bởi người khác — xoá tab khỏi POS.
          const removed = prev[idx];
          if (removed?.id === activeTabIdRef.current) {
            toast.warning(
              t("pages.pos.toast.orderDeletedByOther", {
                code: removed.displayOrderCode || orderId,
              }),
            );
          }
          return prev.filter((t) => t.orderId !== orderId);
        }

        const isPaidByOther =
          payload.paid === true ||
          payload.status === "COMPLETED" ||
          payload.paymentStatus === "PAID";
        const isCancelledByOther = payload.status === "CANCELLED";

        if (isPaidByOther || isCancelledByOther) {
          const target = prev[idx];
          if (target?.id === activeTabIdRef.current) {
            toast.warning(
              isPaidByOther
                ? t("pages.pos.toast.orderPaidByOther", {
                    code: target.displayOrderCode || orderId,
                  })
                : t("pages.pos.toast.orderCancelledByOther", {
                    code: target.displayOrderCode || orderId,
                  }),
            );
          }
          // Loại bỏ đơn đã đóng khỏi tab POS đang chỉnh sửa.
          const filtered = prev.filter((t) => t.orderId !== orderId);
          return filtered.length === 0 ? [createEmptyTab(1)] : filtered;
        }

        // ORDER_UPDATED/ORDER_STATUS_CHANGED trên đơn đang mở:
        // cập nhật note/table/customer; KHÔNG overwrite cart vì user có thể đang gõ.
        return prev.map((tab) => {
          if (tab.orderId !== orderId) return tab;
          return {
            ...tab,
            displayOrderCode: payload.orderCode ?? tab.displayOrderCode,
            tableId: payload.tableId ?? tab.tableId,
          };
        });
      });
    },
    [t],
  );
  useBranchChannel("orders", onRealtimeOrder, { branchId: effectiveBranchId });

  const handleCreateGroup = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    if (!Array.isArray(groupSelectedIds) || groupSelectedIds.length < 2) {
      toast.error(t("pages.pos.toast.selectAtLeastTwoTables"));
      return;
    }
    try {
      await createTableGroup(selectedShopId, effectiveBranchId, {
        shopId: selectedShopId,
        branchId: effectiveBranchId,
        tableIds: groupSelectedIds,
      });
      toast.success(t("pages.pos.toast.groupTablesSuccess"));
      setGroupDialogOpen(false);
      setGroupSelectedIds([]);
      fetchGroups();
    } catch (err) {
      toastPosOrderError(err, t("pages.pos.toast.groupTablesFailed"));
    }
  }, [
    selectedShopId,
    effectiveBranchId,
    groupSelectedIds,
    fetchGroups,
    shopPosWriteBlocked,
    toastShopLockedPos,
    toastPosOrderError,
    t,
  ]);

  const handleUngroup = useCallback(
    async (groupId) => {
      if (!selectedShopId || !effectiveBranchId) return;
      if (shopPosWriteBlocked) {
        toastShopLockedPos();
        return;
      }
      try {
        await deleteTableGroup(groupId, selectedShopId, effectiveBranchId);
        toast.success(t("pages.pos.toast.ungroupSuccess"));
        fetchGroups();
      } catch (err) {
        toastPosOrderError(err, t("pages.pos.toast.ungroupFailed"));
      }
    },
    [
      selectedShopId,
      effectiveBranchId,
      fetchGroups,
      shopPosWriteBlocked,
      toastShopLockedPos,
      toastPosOrderError,
      t,
    ],
  );

  const handleMergeGroupBills = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    if (mergeGroupSubmitting) return;

    const targetOrderId = activeOrderId;
    const sourceOrderIds = Array.from(
      new Set(groupOrderTabs.map((t) => t.orderId).filter(Boolean)),
    );
    if (!targetOrderId || sourceOrderIds.length < 2) return;
    if (!sourceOrderIds.includes(targetOrderId)) return;

    const ok = window.confirm(t("pages.pos.confirm.mergeGroupBills"));
    if (!ok) return;

    setMergeGroupSubmitting(true);
    try {
      const res = await mergeTableGroupOrders(selectedShopId, {
        targetOrderId,
        sourceOrderIds,
      });
      const merged = res.data?.data;
      if (!merged?.id) {
        throw new Error("MISSING_MERGED_ORDER");
      }

      const cancelledIds = sourceOrderIds.filter((id) => id !== merged.id);

      let nextActiveId = activeTabId;
      setOrderTabs((prev) => {
        const kept = prev.filter(
          (t) => !t.orderId || !cancelledIds.includes(t.orderId),
        );
        const nextTabs = kept.length > 0 ? kept : [createEmptyTab(1)];

        const existsActive = nextTabs.some((t) => t.id === activeTabId);
        if (!existsActive) {
          const preferred =
            nextTabs.find((t) => t.orderId === merged.id) || nextTabs[0];
          nextActiveId = preferred.id;
        }

        return nextTabs.map((t) => {
          if (t.orderId !== merged.id) return t;
          return {
            ...t,
            orderId: merged.id,
            displayOrderCode: merged.orderCode || t.displayOrderCode || null,
            cart: cartFromOrderItems(merged.items, t),
            note: merged.note || "",
            tableId: merged.tableId || t.tableId,
            customer: merged.customerId
              ? {
                  id: merged.customerId,
                  name: merged.customerName,
                  phone: merged.customerPhone,
                }
              : null,
            pointsToRedeem: merged.pointsRedeemed ?? 0,
            guestName: merged.guestName ?? t.guestName ?? "",
            guestPhone: merged.guestPhone ?? t.guestPhone ?? "",
          };
        });
      });

      activeTabIdRef.current = nextActiveId;
      setActiveTabId(nextActiveId);
      setCustomerResults([]);

      toast.success(t("pages.pos.toast.mergeGroupSuccess"));
      fetchData();
      fetchGroups();
    } catch (err) {
      if (err?.message === "MISSING_MERGED_ORDER") {
        toast.error(t("pages.pos.toast.mergeUnexpected"));
      } else {
        toastPosOrderError(err, t("pages.pos.toast.mergeGroupFailed"));
      }
    } finally {
      setMergeGroupSubmitting(false);
    }
  }, [
    selectedShopId,
    effectiveBranchId,
    shopPosWriteBlocked,
    mergeGroupSubmitting,
    activeOrderId,
    groupOrderTabs,
    activeTabId,
    fetchData,
    fetchGroups,
    t,
    toastShopLockedPos,
    toastPosOrderError,
  ]);

  const handleSplit = useCallback(async () => {
    if (!selectedShopId || !activeOrderId) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    const itemsToMove = cart
      .map((it) => {
        const q = Number(splitQtyByLineKey[it.lineKey] ?? 0);
        if (!q || q <= 0) return null;
        const tid = normalizeToppingIdList(it.toppingIds);
        return {
          productId: it.productId,
          ...(it.variantId ? { variantId: it.variantId } : {}),
          ...(tid.length ? { toppingIds: tid } : {}),
          quantity: q,
        };
      })
      .filter(Boolean);
    if (itemsToMove.length === 0) {
      toast.error(t("pages.pos.toast.selectSplitQty"));
      return;
    }
    try {
      const payload = {
        toTableId:
          splitToTableId && splitToTableId !== "none" ? splitToTableId : null,
        itemsToMove,
      };
      const res = await splitOrder(activeOrderId, selectedShopId, payload);
      const data = res.data?.data;
      const src = data?.source;
      updateActiveTab({
        orderId: src?.id || activeOrderId,
        cart: cartFromOrderItems(src?.items, t),
        note: src?.note || "",
        tableId: src?.tableId || selectedTableId,
      });
      toast.success(t("pages.pos.toast.splitSuccess"));
      setSplitDialogOpen(false);
      setSplitToTableId("none");
      setSplitQtyByLineKey({});
      fetchData();
    } catch (err) {
      toastPosOrderError(err, t("pages.pos.toast.splitFailed"));
    }
  }, [
    selectedShopId,
    shopPosWriteBlocked,
    activeOrderId,
    cart,
    splitQtyByLineKey,
    splitToTableId,
    updateActiveTab,
    selectedTableId,
    fetchData,
    toastShopLockedPos,
    toastPosOrderError,
    t,
  ]);

  const syncTimerRef = React.useRef(null);

  // Debounced sync updates for open server order (edit items before payment)
  useEffect(() => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (!activeOrderId) return;
    if (shopPosWriteBlocked) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const payload = {
          tableId:
            selectedTableId && selectedTableId !== "none"
              ? selectedTableId
              : null,
          note: note || null,
          guestName: guestName != null ? String(guestName) : "",
          guestPhone: guestPhone != null ? String(guestPhone) : "",
          items: cart.map((item) => {
            const tid = normalizeToppingIdList(item.toppingIds);
            return {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
              ...(tid.length ? { toppingIds: tid } : {}),
              quantity: item.quantity,
              ...(item.sellByWeight && item.weight != null
                ? { weight: Number(item.weight) }
                : {}),
            };
          }),
        };
        await updateOrder(activeOrderId, selectedShopId, payload);
      } catch (err) {
        toastPosOrderError(err, t("pages.pos.toast.updateOrderFailed"));
      }
    }, 650);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [
    activeOrderId,
    selectedShopId,
    effectiveBranchId,
    selectedTableId,
    note,
    guestName,
    guestPhone,
    cart,
    shopPosWriteBlocked,
    toastPosOrderError,
    t,
  ]);

  const handleHoldOrder = useCallback(async () => {
    if (!selectedShopId || !effectiveBranchId) return;
    if (!Array.isArray(cart) || cart.length === 0) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }

    try {
      if (!activeOrderId) {
        const orderData = {
          shopId: selectedShopId,
          branchId: effectiveBranchId,
          tableId:
            selectedTableId && selectedTableId !== "none"
              ? selectedTableId
              : null,
          note: note || null,
          customerId: selectedCustomer?.id || null,
          guestName: guestName?.trim() || null,
          guestPhone: guestPhone?.trim() || null,
          pointsToRedeem:
            selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : null,
          items: cart.map((item) => {
            const tid = normalizeToppingIdList(item.toppingIds);
            return {
              productId: item.productId,
              ...(item.variantId ? { variantId: item.variantId } : {}),
              ...(tid.length ? { toppingIds: tid } : {}),
              quantity: item.quantity,
              ...(item.sellByWeight && item.weight != null
                ? { weight: Number(item.weight) }
                : {}),
            };
          }),
        };
        const res = await createOrder(
          selectedShopId,
          effectiveBranchId,
          orderData,
        );
        const created = res.data?.data;
        if (created?.id) {
          fetchData();
          // After creating a new order, keep current data to continue selling on this order.
          updateActiveTab({
            orderId: created.id,
            displayOrderCode: created.orderCode || null,
          });
          setHoldSuccessMessage(
            created?.orderCode
              ? t("pages.pos.toast.holdCreatedWithCode", {
                  code: created.orderCode,
                })
              : t("pages.pos.toast.holdCreated"),
          );
          setHoldSuccessOpen(true);
        }
        return;
      }

      // Force immediate sync
      const payload = {
        tableId:
          selectedTableId && selectedTableId !== "none"
            ? selectedTableId
            : null,
        note: note || null,
        guestName: guestName != null ? String(guestName) : "",
        guestPhone: guestPhone != null ? String(guestPhone) : "",
        items: cart.map((item) => {
          const tid = normalizeToppingIdList(item.toppingIds);
          return {
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            ...(tid.length ? { toppingIds: tid } : {}),
            quantity: item.quantity,
            ...(item.sellByWeight && item.weight != null
              ? { weight: Number(item.weight) }
              : {}),
          };
        }),
      };
      await updateOrder(activeOrderId, selectedShopId, payload);
      toast.success(t("pages.pos.toast.holdSaved"));
    } catch (err) {
      toastPosOrderError(err, t("pages.pos.toast.holdSaveFailed"));
    }
  }, [
    selectedShopId,
    effectiveBranchId,
    cart,
    activeOrderId,
    selectedTableId,
    note,
    selectedCustomer,
    pointsToRedeem,
    guestName,
    guestPhone,
    updateActiveTab,
    fetchData,
    shopPosWriteBlocked,
    toastShopLockedPos,
    toastPosOrderError,
    t,
  ]);

  const customerSearchTimer = React.useRef(null);
  const handleCustomerSearch = useCallback(
    (keyword) => {
      setCustomerResults([]);
      if (customerSearchTimer.current)
        clearTimeout(customerSearchTimer.current);
      if (!keyword || keyword.trim().length < 2) return;
      customerSearchTimer.current = setTimeout(async () => {
        setCustomerSearching(true);
        try {
          const res = await getCustomers(selectedShopId, {
            keyword: keyword.trim(),
            size: 8,
          });
          const data = res.data?.data;
          const list = data?.content ?? (Array.isArray(data) ? data : []);
          setCustomerResults(list);
        } catch {
          setCustomerResults([]);
        } finally {
          setCustomerSearching(false);
        }
      }, 350);
    },
    [selectedShopId],
  );

  const handleSelectCustomer = useCallback(
    async (customer) => {
      setCustomerResults([]);
      try {
        const res = await getCustomerPoints(customer.id, selectedShopId);
        const points = res.data?.data ?? customer.loyaltyPoints ?? 0;
        setSelectedCustomer({ ...customer, loyaltyPoints: points });
      } catch {
        setSelectedCustomer(customer);
      }
    },
    [selectedShopId, setSelectedCustomer],
  );

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomerResults([]);
    setPointsToRedeem(0);
  }, [setSelectedCustomer, setPointsToRedeem]);

  const { promoMap, activePromotions } = useMemo(
    () => buildPromotionMap(promotions, effectiveBranchId),
    [promotions, effectiveBranchId],
  );

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return [ALL_CATEGORY, ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== ALL_CATEGORY && p.category !== selectedCategory)
        return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.barcode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  const availableTables = useMemo(() => {
    const list = Array.isArray(tables) ? [...tables] : [];
    const rank = (s) => {
      if (s === "AVAILABLE") return 0;
      if (s === "OCCUPIED") return 1;
      if (s === "CLOSED") return 2;
      return 3;
    };
    list.sort((a, b) => {
      const ra = rank(a.status);
      const rb = rank(b.status);
      if (ra !== rb) return ra - rb;
      const an = (a.name || "").toLowerCase();
      const bn = (b.name || "").toLowerCase();
      return an.localeCompare(bn, "vi");
    });
    return list;
  }, [tables]);

  // Auto-load other tables in the same group (preload open orders into tabs)
  const loadedGroupRef = React.useRef("");
  useEffect(() => {
    if (!selectedShopId) return;
    if (!effectiveBranchId) return;
    if (!activeGroup?.id) return;
    if (!selectedTableId || selectedTableId === "none") return;
    const key = `${activeGroup.id}__${selectedTableId}__${activeTabId}`;
    if (loadedGroupRef.current === key) return;
    loadedGroupRef.current = key;

    const otherTableIds = (activeGroup.tableIds || []).filter(
      (id) => id && id !== selectedTableId,
    );
    if (otherTableIds.length === 0) return;

    let alive = true;
    (async () => {
      for (const tid of otherTableIds) {
        if (!alive) return;
        try {
          const res = await getCurrentOrderByTable(selectedShopId, tid);
          const order = res.data?.data;
          if (!order?.id) continue;
          const exists = orderTabs.some((tab) => tab.orderId === order.id);
          if (exists) continue;

          const newTabId = nextTabIdRef.current++;
          setOrderTabs((prev) => [
            ...prev,
            {
              ...createEmptyTab(newTabId),
              orderId: order.id,
              displayOrderCode: order.orderCode || null,
              tableId: tid,
              cart: cartFromOrderItems(order.items, t),
              note: order.note || "",
              customer: order.customerId
                ? {
                    id: order.customerId,
                    name: order.customerName,
                    phone: order.customerPhone,
                  }
                : null,
              pointsToRedeem: order.pointsRedeemed ?? 0,
              guestName: order.guestName || "",
              guestPhone: order.guestPhone || "",
            },
          ]);
        } catch {
          // ignore per-table failure
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    selectedShopId,
    effectiveBranchId,
    activeGroup,
    selectedTableId,
    orderTabs,
    activeTabId,
    t,
  ]);

  const addToCart = useCallback(
    (product, variantId, toppingIdsIn = []) => {
      const toppingIds = normalizeToppingIdList(toppingIdsIn);
      const hasVars = hasBranchVariants(product);
      const branchVariant =
        hasVars && variantId
          ? product.branchVariants.find((v) => v.variantId === variantId)
          : null;
      if (hasVars && (!variantId || !branchVariant)) {
        toast.error(t("pages.pos.toast.invalidVariant"));
        return;
      }

      if (toppingIds.length > 0 && activeToppings(product).length === 0) {
        toast.error(t("pages.pos.toast.noToppingsOnProduct"));
        return;
      }

      const basePrice = hasVars
        ? branchVariant.price > 0
          ? branchVariant.price
          : product.price
        : product.price;
      const toppingExtra = toppingExtrasForSelection(product, toppingIds);
      const combinedBase = basePrice + toppingExtra;

      const sellByWeight = !!product.sellByWeight;

      const maxStock = product.trackInventory
        ? hasVars
          ? branchVariant.quantity
          : (product.quantity ?? 0)
        : null;

      const prev = cartRef.current;
      const effectiveVariant = hasVars ? variantId : null;
      const tidKey = toppingIds.join(",");
      const lineMatch = (item) =>
        !item.sellByWeight &&
        item.productId === product.productId &&
        (item.variantId ?? null) === (effectiveVariant ?? null) &&
        normalizeToppingIdList(item.toppingIds || []).join(",") === tidKey;

      // Sản phẩm bán theo cân: mỗi lần nhấn tạo dòng riêng (không gộp), vì
      // mỗi dòng đại diện 1 "gói" có khối lượng riêng.
      if (!sellByWeight) {
        const existing = prev.find(lineMatch);
        if (existing) {
          if (maxStock != null && existing.quantity >= maxStock) {
            toast.error(t("pages.pos.toast.insufficientStock"));
            return;
          }
          setCart(
            prev.map((item) =>
              lineMatch(item) ? { ...item, quantity: item.quantity + 1 } : item,
            ),
          );
          return;
        }

        if (maxStock != null && maxStock < 1) {
          toast.error(t("pages.pos.toast.outOfStock"));
          return;
        }
      }

      const promo = getWinningPromo(promoMap, product.productId, combinedBase);
      const discountedPrice = calcDiscountedPrice(combinedBase, promo);
      const hasDiscount = promo && discountedPrice < combinedBase;
      const vName = hasVars ? variantCatalogName(product, variantId) : "";
      const topLabel = formatToppingSelectionLabel(product, toppingIds);
      const displayBase = vName ? `${product.name} — ${vName}` : product.name;
      const productName = topLabel ? `${displayBase} + ${topLabel}` : displayBase;
      const tKey = toppingIds.length ? tidKey : "not";
      const baseLineKey = hasVars
        ? `${product.productId}__${variantId}__t:${tKey}`
        : `${product.productId}__t:${tKey}`;
      // Sản phẩm bán theo cân: thêm suffix theo timestamp để mỗi dòng là duy nhất.
      const lineKey = sellByWeight
        ? `${baseLineKey}__w:${Date.now()}${Math.random().toString(36).slice(2, 6)}`
        : baseLineKey;

      setCart([
        ...prev,
        {
          lineKey,
          productId: product.productId,
          variantId: effectiveVariant,
          toppingIds,
          branchProductId: product.id,
          productName,
          originalPrice: combinedBase,
          price: hasDiscount ? discountedPrice : combinedBase,
          hasDiscount: !!hasDiscount,
          promoLabel: hasDiscount ? formatDiscount(promo, numberLocale) : null,
          promoName: promo?.name || null,
          image: product.images?.[0] || null,
          quantity: 1,
          trackInventory: !!product.trackInventory,
          maxStock,
          sellByWeight,
          weight: sellByWeight ? 1 : null,
          weightUnit: sellByWeight ? (product.unit ?? null) : null,
        },
      ]);
    },
    [promoMap, setCart, t],
  );

  const queueAddProductWithToppings = useCallback(
    (product, variantId) => {
      if (activeToppings(product).length > 0) {
        setToppingPicker({ product, variantId: variantId ?? null });
        return;
      }
      addToCart(product, variantId, []);
    },
    [addToCart],
  );

  const confirmToppingPickerSelection = useCallback(
    (ids) => {
      if (!toppingPicker) return;
      addToCart(toppingPicker.product, toppingPicker.variantId, ids);
      setToppingPicker(null);
    },
    [toppingPicker, addToCart],
  );

  const cancelToppingPicker = useCallback(() => setToppingPicker(null), []);

  const updateQuantity = useCallback(
    (lineKey, delta) => {
      const prev = cartRef.current;
      const item = prev.find((i) => i.lineKey === lineKey);
      if (!item) return;
      // Dòng bán theo cân không đổi qua quantity (+/-); dùng updateWeight.
      if (item.sellByWeight) return;
      const nextQty = item.quantity + delta;
      if (
        delta > 0 &&
        item.trackInventory &&
        item.maxStock != null &&
        nextQty > item.maxStock
      ) {
        toast.error(t("pages.pos.toast.insufficientStock"));
        return;
      }
      setCart(
        prev
          .map((it) => {
            if (it.lineKey !== lineKey) return it;
            return { ...it, quantity: Math.max(0, nextQty) };
          })
          .filter((it) => it.quantity > 0),
      );
    },
    [setCart, t],
  );

  const updateWeight = useCallback(
    (lineKey, nextWeightRaw) => {
      // Cho phép input trống / đang gõ (giữ lại dòng, weight=0 tạm thời).
      const next =
        nextWeightRaw === "" || nextWeightRaw == null
          ? 0
          : Number(nextWeightRaw);
      if (!Number.isFinite(next) || next < 0) return;
      const rounded = Math.round(next * 1000) / 1000;
      setCart((prev) =>
        prev.map((it) => {
          if (it.lineKey !== lineKey || !it.sellByWeight) return it;
          return { ...it, weight: rounded };
        }),
      );
    },
    [setCart],
  );

  const removeFromCart = useCallback(
    (lineKey) => {
      setCart((prev) => prev.filter((item) => item.lineKey !== lineKey));
    },
    [setCart],
  );

  const clearCart = useCallback(() => {
    updateActiveTab({
      cart: [],
      tableId: "",
      note: "",
      customer: null,
      orderId: null,
      displayOrderCode: null,
      guestName: "",
      guestPhone: "",
      pointsToRedeem: 0,
    });
    setCustomerResults([]);
  }, [updateActiveTab]);

  const handleConfirmMoveTable = useCallback(async () => {
    if (!selectedShopId || !activeOrderId) return;
    if (!moveToTableId || moveToTableId === "none") return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    try {
      await moveOrderTable(activeOrderId, selectedShopId, moveToTableId);
      updateActiveTab({ tableId: moveToTableId });
      toast.success(t("pages.pos.toast.moveTableSuccess"));
      fetchData();
      setMoveTableOpen(false);
      setMoveToTableId("none");
    } catch (err) {
      toastPosOrderError(err, t("pages.pos.toast.moveTableFailed"));
    }
  }, [
    selectedShopId,
    shopPosWriteBlocked,
    activeOrderId,
    moveToTableId,
    updateActiveTab,
    fetchData,
    toastShopLockedPos,
    toastPosOrderError,
    t,
  ]);

  // Số lượng quy đổi cho dòng (dùng weight nếu bán theo cân).
  const effectiveQtyOfItem = (item) =>
    item.sellByWeight ? Number(item.weight ?? 0) : item.quantity;

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * effectiveQtyOfItem(item),
        0,
      ),
    [cart],
  );

  const totalSavings = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          (item.hasDiscount
            ? (item.originalPrice - item.price) * effectiveQtyOfItem(item)
            : 0),
        0,
      ),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  const totalAfterPoints = useMemo(
    () => Math.max(0, subtotal - pointsToRedeem * 1000),
    [subtotal, pointsToRedeem],
  );

  const [taxPreview, setTaxPreview] = useState(null);
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);

  useEffect(() => {
    if (!effectiveBranchId || !selectedShopId || totalAfterPoints <= 0) {
      setTaxPreview(null);
      setTaxPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setTaxPreviewLoading(true);
      previewOrderTax(selectedShopId, effectiveBranchId, totalAfterPoints)
        .then((res) => {
          if (!cancelled) {
            setTaxPreview(res.data?.data ?? null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTaxPreview(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setTaxPreviewLoading(false);
          }
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedShopId, effectiveBranchId, totalAfterPoints]);

  const draftOrderForPreview = useMemo(
    () =>
      cart.length === 0
        ? null
        : buildDraftOrderForInvoice({
            cart,
            subtotal,
            taxPreview,
            pointsToRedeem,
            note,
            paymentMethod,
          }),
    [cart, subtotal, taxPreview, pointsToRedeem, note, paymentMethod],
  );

  const openCheckoutInvoicePreview = useCallback(() => {
    setPreviewPrintedAt(new Date().toISOString());
    setInvoicePreviewOpen(true);
  }, []);

  const draftInvoiceMeta = useMemo(() => {
    const br = branches.find((b) => b.id === effectiveBranchId);
    const branchName = br?.name || null;
    const tableName =
      selectedTableId && selectedTableId !== "none"
        ? tables.find((tbl) => tbl.id === selectedTableId)?.name || null
        : null;
    const invoiceLocale = resolveInvoiceLocale(br);
    const invoiceT = getInvoiceT(invoiceLocale);
    return {
      invoiceLocale,
      shopName: selectedShop?.name,
      shopAddress: selectedShop?.address,
      shopPhone: selectedShop?.phone,
      branchName,
      branchWifiSsid: br?.wifiSsid || null,
      branchWifiPassword: br?.wifiPassword || null,
      customerName:
        selectedCustomer?.name ||
        (guestName?.trim() ? guestName.trim() : null) ||
        null,
      tableName,
      paymentMethodLabel: getPaymentMethodLabel(invoiceT, paymentMethod),
    };
  }, [
    branches,
    effectiveBranchId,
    selectedTableId,
    tables,
    selectedShop,
    selectedCustomer,
    guestName,
    paymentMethod,
    t,
  ]);

  const handlePostSaleCustomerSave = useCallback(async () => {
    if (!postSaleOrderId || !selectedShopId) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    const name = postSaleName.trim();
    if (!name) {
      toast.error(t("pages.pos.toast.customerNameRequired"));
      return;
    }
    setPostSaleSaving(true);
    try {
      const res = await createCustomer(selectedShopId, {
        name,
        phone: postSalePhone.trim() || null,
        email: null,
        address: null,
        note: null,
        branchId: effectiveBranchId || null,
      });
      const newId = res.data?.data?.id;
      if (!res.data?.success || !newId) {
        toast.error(
          res.data?.message || t("pages.pos.toast.createCustomerFailed"),
        );
        return;
      }
      await patchOrderFulfillment(postSaleOrderId, selectedShopId, {
        customerId: newId,
      });
      toast.success(t("pages.pos.toast.attachCustomerSuccess"));
      setPostSaleOpen(false);
      setPostSaleOrderId(null);
    } catch (e) {
      toastPosOrderError(e, t("pages.pos.toast.postSaleFailed"));
    } finally {
      setPostSaleSaving(false);
    }
  }, [
    postSaleOrderId,
    selectedShopId,
    shopPosWriteBlocked,
    effectiveBranchId,
    postSaleName,
    postSalePhone,
    toastShopLockedPos,
    toastPosOrderError,
    t,
  ]);

  const lastTableParamRef = React.useRef("");
  const lastOrderCodeParamRef = React.useRef("");
  const lastPosOrderIdParamRef = React.useRef("");
  const prevSearchRef = React.useRef(location.search || "");

  const openOrderForPosEdit = useCallback(
    async ({ orderCode: codeIn, orderId: idIn, relaxBranchCheck = false }) => {
      const code = (codeIn || "").trim();
      const oid = (idIn || "").trim();
      if (!selectedShopId) {
        toast.error(t("pages.pos.toast.shopNotSelected"));
        return;
      }
      if (!code && !oid) {
        toast.error(t("pages.pos.toast.enterOrderCode"));
        return;
      }
      const apiBranch = relaxBranchCheck ? undefined : effectiveBranchId;
      if (!relaxBranchCheck && code && !apiBranch) {
        toast.error(t("pages.pos.toast.selectBranchForOrderCode"));
        return;
      }
      setOrderLookupSubmitting(true);
      try {
        const res = await lookupOrderForPosEdit(selectedShopId, apiBranch, {
          orderCode: code || undefined,
          orderId: oid || undefined,
        });
        const order = res.data?.data;
        if (!order?.id) {
          toast.error(t("pages.pos.toast.orderNotFound"));
          return;
        }

        if (order.branchId) {
          setSelectedBranchId(order.branchId);
        }

        const existing = orderTabs.find((tab) => tab.orderId === order.id);
        if (existing) {
          switchTab(existing.id);
          toast.info(t("pages.pos.toast.orderAlreadyOpenTab"));
          return;
        }

        const id = nextTabIdRef.current++;
        const tab = {
          ...createEmptyTab(id),
          orderId: order.id,
          displayOrderCode: order.orderCode || null,
          tableId: order.tableId || "",
          cart: cartFromOrderItems(order.items, t),
          note: order.note || "",
          customer: order.customerId
            ? {
                id: order.customerId,
                name: order.customerName,
                phone: order.customerPhone,
              }
            : null,
          pointsToRedeem: order.pointsRedeemed ?? 0,
          guestName: order.guestName || "",
          guestPhone: order.guestPhone || "",
        };
        setOrderTabs((prev) => [...prev, tab]);
        activeTabIdRef.current = id;
        setActiveTabId(id);
        setCustomerResults([]);
        toast.success(
          t("pages.pos.toast.orderOpened", {
            code: order.orderCode || order.id,
          }),
        );
      } catch (err) {
        toast.error(
          err.response?.data?.message || t("pages.pos.toast.openOrderFailed"),
        );
      } finally {
        setOrderLookupSubmitting(false);
      }
    },
    [
      selectedShopId,
      effectiveBranchId,
      setSelectedBranchId,
      switchTab,
      orderTabs,
      t,
    ],
  );

  const openOrderByCode = useCallback(
    (rawCode) =>
      openOrderForPosEdit({
        orderCode: rawCode,
        relaxBranchCheck: false,
      }),
    [openOrderForPosEdit],
  );

  // Deeplink: /pos?tableId=... | ?orderCode=... | ?orderId=...
  useEffect(() => {
    const sp = new URLSearchParams(location.search || "");
    const tid = sp.get("tableId");
    const orderCodeParam = sp.get("orderCode");
    const posOrderIdParam = sp.get("orderId");
    const prevSearch = prevSearchRef.current;
    prevSearchRef.current = location.search || "";
    const searchChanged = prevSearch !== (location.search || "");

    if (orderCodeParam) {
      if (
        !(
          orderCodeParam === lastOrderCodeParamRef.current && !searchChanged
        )
      ) {
        lastOrderCodeParamRef.current = orderCodeParam;
        openOrderForPosEdit({
          orderCode: orderCodeParam,
          relaxBranchCheck: true,
        });
      }
      navigate("/pos", { replace: true });
      return;
    }
    lastOrderCodeParamRef.current = "";

    if (posOrderIdParam) {
      if (
        !(
          posOrderIdParam === lastPosOrderIdParamRef.current &&
          !searchChanged
        )
      ) {
        lastPosOrderIdParamRef.current = posOrderIdParam;
        openOrderForPosEdit({
          orderId: posOrderIdParam,
          relaxBranchCheck: true,
        });
      }
      navigate("/pos", { replace: true });
      return;
    }
    lastPosOrderIdParamRef.current = "";

    if (!tid) {
      lastTableParamRef.current = "";
      return;
    }

    if (tid === lastTableParamRef.current && !searchChanged) return;

    activateTableTab(tid);
    lastTableParamRef.current = tid;
    navigate("/pos", { replace: true });
  }, [location.search, activateTableTab, navigate, openOrderForPosEdit]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (shopPosWriteBlocked) {
      toastShopLockedPos();
      return;
    }
    setSubmitting(true);
    try {
      const hadNoCustomer = !selectedCustomer;
      const orderData = {
        shopId: selectedShopId,
        branchId: effectiveBranchId,
        tableId:
          selectedTableId && selectedTableId !== "none"
            ? selectedTableId
            : null,
        note: note || null,
        customerId: selectedCustomer?.id || null,
        guestName: guestName?.trim() || null,
        guestPhone: guestPhone?.trim() || null,
        pointsToRedeem:
          selectedCustomer && pointsToRedeem > 0 ? pointsToRedeem : null,
        items: cart.map((item) => {
          const tid = normalizeToppingIdList(item.toppingIds);
          return {
            productId: item.productId,
            ...(item.variantId ? { variantId: item.variantId } : {}),
            ...(tid.length ? { toppingIds: tid } : {}),
            quantity: item.quantity,
            ...(item.sellByWeight && item.weight != null
              ? { weight: Number(item.weight) }
              : {}),
          };
        }),
        ...(paymentMethod === "ShipCOD"
          ? { checkoutPaymentMethod: "ShipCOD" }
          : {}),
      };

      const res = await createOrder(
        selectedShopId,
        effectiveBranchId,
        orderData,
      );
      let finalOrder = res.data?.data;

      const deferPayment = paymentMethod === "ShipCOD";
      if (paymentMethod && finalOrder?.id && !deferPayment) {
        try {
          const payRes = await confirmPayment(
            finalOrder.id,
            selectedShopId,
            `POS-${Date.now()}`,
            paymentMethod,
          );
          finalOrder = payRes.data?.data ?? finalOrder;
          if (
            paymentMethod === "Transfer" &&
            transferPaymentProofFile &&
            finalOrder?.id
          ) {
            try {
              const fd = new FormData();
              fd.append("file", transferPaymentProofFile);
              const up = await uploadOrderPaymentProof(
                finalOrder.id,
                selectedShopId,
                fd,
              );
              finalOrder = up.data?.data ?? finalOrder;
            } catch (upErr) {
              console.error(upErr);
              if (isShopInactiveApiError(upErr)) {
                toast.error(t("pages.pos.toast.shopLocked"));
                setTransferPaymentProofFile(null);
                setSubmitting(false);
                return;
              }
              toast.warning(t("pages.pos.toast.transferProofUploadWarning"));
            }
          }
        } catch (payErr) {
          if (isShopInactiveApiError(payErr)) {
            toast.error(t("pages.pos.toast.shopLocked"));
            setTransferPaymentProofFile(null);
            setSubmitting(false);
            return;
          }
          toast.info(t("pages.pos.toast.orderCreatedUnpaid"));
        }
      }

      const br = branches.find((b) => b.id === effectiveBranchId);
      const branchName = br?.name || null;
      const tableName =
        selectedTableId && selectedTableId !== "none"
          ? tables.find((tbl) => tbl.id === selectedTableId)?.name || null
          : null;

      const invoiceLocale = resolveInvoiceLocale(br);
      const invoiceT = getInvoiceT(invoiceLocale);
      setInvoicePayload({
        invoiceLocale,
        order: finalOrder,
        printedAt: new Date().toISOString(),
        shopName: selectedShop?.name,
        shopAddress: selectedShop?.address,
        shopPhone: selectedShop?.phone,
        branchName,
        branchWifiSsid: br?.wifiSsid || null,
        branchWifiPassword: br?.wifiPassword || null,
        customerName:
          selectedCustomer?.name ||
          (guestName?.trim() ? guestName.trim() : null) ||
          null,
        tableName,
        paymentMethodLabel: getPaymentMethodLabel(
          invoiceT,
          finalOrder?.paymentMethod || paymentMethod,
        ),
      });
      setInvoiceOpen(true);

      toast.success(
        deferPayment
          ? t("pages.pos.toast.checkoutCodSuccess")
          : t("pages.pos.toast.checkoutSuccess"),
      );
      setCheckoutOpen(false);
      if (orderTabs.length > 1) {
        closeTab(activeTabId);
      } else {
        // Giữ bàn trên tab sau thanh toán; nhóm bàn được server cập nhật (fetchGroups bên dưới).
        updateActiveTab({
          orderId: null,
          displayOrderCode: null,
          cart: [],
          note: "",
          customer: null,
          guestName: "",
          guestPhone: "",
          pointsToRedeem: 0,
          tableId:
            selectedTableId && selectedTableId !== "none"
              ? selectedTableId
              : "",
        });
        setCustomerResults([]);
      }
      fetchData();
      fetchGroups();

      if (hadNoCustomer && finalOrder?.id) {
        setPostSaleOrderId(finalOrder.id);
        setPostSaleName("");
        setPostSalePhone("");
        setPostSaleOpen(true);
      }
    } catch (err) {
      console.error("Order creation failed", err);
      toastPosOrderError(err, t("pages.pos.toast.createOrderFailed"));
    } finally {
      setTransferPaymentProofFile(null);
      setSubmitting(false);
    }
  };

  const tabBarProps = {
    tabs: orderTabs,
    activeTabId,
    onSelect: switchTab,
    onAdd: addTab,
    onClose: closeTab,
    tables,
  };

  const cartPanelProps = {
    cart,
    totalItems,
    subtotal,
    totalSavings,
    note,
    setNote,
    guestName,
    guestPhone,
    setGuestName,
    setGuestPhone,
    selectedTableId,
    setSelectedTableId,
    availableTables,
    updateQuantity,
    updateWeight,
    removeFromCart,
    clearCart,
    selectedCustomer,
    onCustomerSearch: handleCustomerSearch,
    onSelectCustomer: handleSelectCustomer,
    onClearCustomer: handleClearCustomer,
    customerResults,
    customerSearching,
    pointsToRedeem,
    taxPreview,
    taxPreviewLoading,
    showTableSelect: tables.length > 0,
    onHoldOrder: handleHoldOrder,
    holdDisabled:
      shopPosWriteBlocked ||
      !effectiveBranchId ||
      cart.length === 0 ||
      submitting,
    checkoutDisabled: shopPosWriteBlocked || cart.length === 0,
    canMoveTable:
      !shopPosWriteBlocked &&
      !!activeOrderId &&
      !!selectedTableId &&
      selectedTableId !== "none",
    onOpenMoveTableDialog: () => {
      setMoveToTableId("none");
      setMoveTableOpen(true);
    },
    onOpenGroupDialog: () => {
      setGroupDialogOpen(true);
      setGroupSelectedIds([]);
    },
    onOpenSplitDialog: () => {
      setSplitDialogOpen(true);
      setSplitToTableId("none");
      setSplitQtyByLineKey({});
    },
    splitDisabled:
      shopPosWriteBlocked ||
      !activeOrderId ||
      cart.length === 0 ||
      submitting,
    onMergeGroupBills: handleMergeGroupBills,
    mergeGroupDisabled: mergeGroupBillDisabled,
    mergeGroupBusy: mergeGroupSubmitting,
    activeGroup,
    tables,
    onQuickSwitchTable: (tid) => setSelectedTableId(tid),
    canPay,
  };

  return {
    activateTableTab,
    activeGroup,
    activeOrderId,
    activePromotions,
    activeTab,
    activeTabId,
    activeTabIdRef,
    addTab,
    addToCart,
    queueAddProductWithToppings,
    confirmToppingPickerSelection,
    cancelToppingPicker,
    toppingPicker,
    availableTables,
    branches,
    cart,
    cartOpen,
    cartPanelProps,
    cartRef,
    categories,
    checkoutOpen,
    clearCart,
    closeTab,
    customerResults,
    customerSearchTimer,
    customerSearching,
    draftInvoiceMeta,
    draftOrderForPreview,
    effectiveBranchId,
    fetchData,
    fetchGroups,
    filteredProducts,
    displayOrderCode,
    groupDialogOpen,
    groupOrderTabs,
    groupSelectedIds,
    guestName,
    guestPhone,
    handleCheckout,
    handleClearCustomer,
    handleConfirmMoveTable,
    handleCreateGroup,
    handleCustomerSearch,
    handleHoldOrder,
    handleMergeGroupBills,
    handlePostSaleCustomerSave,
    handleSelectCustomer,
    handleSplit,
    handleUngroup,
    holdSuccessMessage,
    holdSuccessOpen,
    invoiceOpen,
    invoicePayload,
    invoicePreviewOpen,
    lastTableParamRef,
    loadedGroupRef,
    loading,
    location,
    mergeGroupBillDisabled,
    mergeGroupSubmitting,
    moveTableOpen,
    moveToTableId,
    navigate,
    nextTabIdRef,
    note,
    openCheckoutInvoicePreview,
    openPosCheckout,
    openOrderByCode,
    orderLookupInput,
    orderLookupSubmitting,
    orderTabs,
    paymentMethod,
    transferPaymentProofFile,
    setTransferPaymentProofFile,
    pointsToRedeem,
    postSaleName,
    postSaleOpen,
    postSaleOrderId,
    postSalePhone,
    postSaleSaving,
    prevSearchRef,
    previewPrintedAt,
    products,
    promoMap,
    promotions,
    removeFromCart,
    searchTerm,
    selectedBranchId,
    selectedCategory,
    selectedCustomer,
    selectedShop,
    selectedShopId,
    shopPosWriteBlocked,
    selectedTableId,
    setActiveTabId,
    setCart,
    setCartOpen,
    setCheckoutOpen,
    setCustomerResults,
    setCustomerSearching,
    setGroupDialogOpen,
    setGroupSelectedIds,
    setGuestName,
    setGuestPhone,
    setHoldSuccessMessage,
    setHoldSuccessOpen,
    setInvoiceOpen,
    setInvoicePayload,
    setInvoicePreviewOpen,
    setLoading,
    setMergeGroupSubmitting,
    setMoveTableOpen,
    setMoveToTableId,
    setNote,
    setOrderLookupInput,
    setOrderTabs,
    setPaymentMethod,
    setPointsToRedeem,
    setPostSaleName,
    setPostSaleOpen,
    setPostSaleOrderId,
    setPostSalePhone,
    setPostSaleSaving,
    setPreviewPrintedAt,
    setProducts,
    setPromotions,
    setSearchTerm,
    setSelectedBranchId,
    setSelectedCategory,
    setSelectedCustomer,
    setSelectedTableId,
    setSplitDialogOpen,
    setSplitQtyByLineKey,
    setSplitToTableId,
    setSubmitting,
    setTableGroups,
    setTables,
    setTaxPreview,
    setTaxPreviewLoading,
    setVariantPickerProduct,
    splitDialogOpen,
    splitQtyByLineKey,
    splitToTableId,
    submitting,
    subtotal,
    switchTab,
    syncTimerRef,
    tabBarProps,
    tableGroupByTableId,
    tableGroups,
    tables,
    taxPreview,
    taxPreviewLoading,
    totalAfterPoints,
    totalItems,
    totalSavings,
    updateActiveTab,
    updateQuantity,
    updateWeight,
    variantPickerProduct,
  };

}
