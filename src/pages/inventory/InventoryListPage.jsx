import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Package,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Loader2,
  AlertTriangle,
  PackageX,
  Warehouse,
  ArrowDownUp,
  Search,
  History,
  TrendingDown,
  TrendingUp,
  MoreHorizontal,
  EyeOff,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { getBranchProducts } from "../../api/productApi.js";
import {
  getInventorySummary,
  getTransactionHistory,
} from "../../api/inventoryApi.js";
import { InventoryStatCards } from "@/components/inventory/InventoryStatCards.jsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import {
  dataTableContainer,
  listFilterSelectWrap,
  listProductSelectWrap,
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

import InventoryActionModal from "./InventoryActionModal.jsx";

function InventoryStockContextMenu({ product, canManage, openAction, t, children }) {
  if (product.trackInventory === false) {
    return children;
  }

  const isSub = product._isVariantRow;
  const lineQty = isSub
    ? (product._displayQty ?? 0)
    : (product.quantity ?? 0);
  const pre = isSub ? product._variantId || null : null;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[11rem] bg-background">
        <ContextMenuLabel>
          {t("pages.inventory.list.actionsInventory")}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!canManage}
          onSelect={() => openAction(product, "IMPORT", pre)}
        >
          <PackagePlus className="h-4 w-4 mr-2 text-emerald-600" />
          {t("pages.inventory.list.import")}
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canManage || lineQty <= 0}
          onSelect={() => openAction(product, "EXPORT", pre)}
        >
          <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
          {t("pages.inventory.list.export")}
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canManage}
          onSelect={() => openAction(product, "ADJUSTMENT", pre)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2 text-blue-600" />
          {t("pages.inventory.list.adjustment")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

// ─── Stock Status Badge ──────────────────────────────────────────────────────

const StockStatusBadge = ({ quantity, minQuantity, trackInventory }) => {
  const { t } = useTranslation();
  if (trackInventory === false)
    return (
      <Badge className="gap-1 text-[11px] bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100">
        <EyeOff className="h-3 w-3" /> {t("pages.inventory.list.statusNotTracked")}
      </Badge>
    );
  if (quantity <= 0)
    return (
      <Badge variant="destructive" className="gap-1 text-[11px]">
        <PackageX className="h-3 w-3" /> {t("pages.inventory.list.statusOutOfStock")}
      </Badge>
    );
  if (minQuantity > 0 && quantity <= minQuantity)
    return (
      <Badge className="gap-1 text-[11px] bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40 dark:hover:bg-amber-500/15">
        <AlertTriangle className="h-3 w-3" /> {t("pages.inventory.list.statusLowStock")}
      </Badge>
    );
  return (
    <Badge className="gap-1 text-[11px] bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40 dark:hover:bg-emerald-500/15">
      {t("pages.inventory.list.statusInStock")}
    </Badge>
  );
};

// ─── Transaction Type Badge ──────────────────────────────────────────────────

/**
 * Cây tồn kho: 1 dòng sản phẩm (cha) + subRows = từng biến thể (tồn/SKU/giá theo biến thể).
 */
function buildStockTreeRows(products) {
  if (!Array.isArray(products)) return [];
  return products.map((p) => {
    const bvs = (p.branchVariants || []).filter((bv) => bv?.variantId);
    if (p.trackInventory === false || bvs.length === 0) {
      return {
        ...p,
        _rowKey: p.id,
        _isVariantRow: false,
        subRows: undefined,
      };
    }
    const subRows = bvs.map((bv) => {
      const variantMeta = (p.variants || []).find(
        (v) => v.variantId === bv.variantId,
      );
      const price =
        bv.price > 0 ? bv.price : p.price ?? p.defaultPrice ?? 0;
      return {
        ...p,
        _rowKey: `${p.id}::${bv.variantId}`,
        _isVariantRow: true,
        _variantId: bv.variantId,
        _variantLabel: variantMeta?.name || null,
        _displaySku: variantMeta?.sku || p.sku,
        _displayQty: bv.quantity ?? 0,
        _displayPrice: price,
        subRows: undefined,
      };
    });
    return {
      ...p,
      _rowKey: p.id,
      _isVariantRow: false,
      subRows,
    };
  });
}

const TxTypeBadge = ({ type }) => {
  const { t } = useTranslation();
  const map = {
    IMPORT: {
      label: t("pages.inventory.list.txImport"),
      icon: TrendingUp,
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40",
    },
    EXPORT: {
      label: t("pages.inventory.list.txExport"),
      icon: TrendingDown,
      cls: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/15 dark:text-orange-200 dark:border-orange-500/40",
    },
    ADJUSTMENT: {
      label: t("pages.inventory.list.txAdjustment"),
      icon: SlidersHorizontal,
      cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:border-blue-500/40",
    },
  };
  const cfg = map[type] || { label: type, icon: ArrowDownUp, cls: "" };
  const IconComp = cfg.icon;
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const InventoryListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const {
    selectedShopId,
    selectedBranchId,
    selectedBranch,
    branches,
    setSelectedBranchId,
  } = useShop();
  const { hasShopPermission } = useShopPermissions();

  const canManage = hasShopPermission(PERM.INVENTORY_MANAGE);

  // ── Stock tab state ──────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const debounceRef = useRef(null);

  // ── Transaction tab state ────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [txTotalCount, setTxTotalCount] = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const [txPagination, setTxPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [txTypeFilter, setTxTypeFilter] = useState("ALL");
  const [txProductFilter, setTxProductFilter] = useState("ALL");

  // ── Action modal state ───────────────────────────────────────────────────
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState("IMPORT");
  const [actionProduct, setActionProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("stock");
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [historyProducts, setHistoryProducts] = useState([]);

  // ── Keyword debounce ─────────────────────────────────────────────────────
  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
  };

  // ── Fetch branch products ────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    if (!selectedShopId || !selectedBranchId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
      };
      if (sorting.length > 0) {
        params.sortBy = sorting[0].id;
        params.sortDir = sorting[0].desc ? "DESC" : "ASC";
      }
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (stockFilter && stockFilter !== "ALL") {
        params.stockStatus = stockFilter;
      }

      const res = await getBranchProducts(
        selectedShopId,
        selectedBranchId,
        params,
      );
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setProducts(data.content ?? []);
        setTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        setTotalCount(list.length);
      }
    } catch {
      toast.error(t("pages.inventory.list.fetchProductsError"));
    } finally {
      setLoading(false);
    }
  }, [
    selectedShopId,
    selectedBranchId,
    pagination,
    sorting,
    debouncedKeyword,
    stockFilter,
    t,
  ]);

  const fetchSummary = useCallback(async () => {
    if (!selectedShopId || !selectedBranchId) return;
    setSummaryLoading(true);
    try {
      const res = await getInventorySummary(selectedShopId, selectedBranchId, {
        keyword: debouncedKeyword || undefined,
      });
      setSummary(res.data?.data ?? null);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedShopId, selectedBranchId, debouncedKeyword]);

  useEffect(() => {
    fetchProducts();
    fetchSummary();
  }, [fetchProducts, fetchSummary]);

  useEffect(() => {
    if (activeTab !== "history" || !selectedShopId || !selectedBranchId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getBranchProducts(selectedShopId, selectedBranchId, {
          page: 0,
          size: 200,
          stockStatus: "ALL",
        });
        const data = res.data?.data;
        const list =
          data && typeof data === "object" && "content" in data
            ? (data.content ?? [])
            : Array.isArray(data)
              ? data
              : [];
        if (!cancelled) {
          setHistoryProducts(list.filter((p) => p.trackInventory !== false));
        }
      } catch {
        if (!cancelled) setHistoryProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedShopId, selectedBranchId]);

  // ── Fetch transactions ───────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!selectedShopId || !selectedBranchId || txProductFilter === "ALL")
      return;
    setTxLoading(true);
    try {
      const params = {
        page: txPagination.pageIndex,
        size: txPagination.pageSize,
        sort: "createdAt,desc",
      };

      const res = await getTransactionHistory(
        selectedShopId,
        selectedBranchId,
        txProductFilter,
        params,
      );
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setTransactions(data.content ?? []);
        setTxTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setTransactions(list);
        setTxTotalCount(list.length);
      }
    } catch {
      toast.error(t("pages.inventory.list.fetchHistoryError"));
    } finally {
      setTxLoading(false);
    }
  }, [selectedShopId, selectedBranchId, txPagination, txProductFilter, t]);

  useEffect(() => {
    if (activeTab === "history") fetchTransactions();
  }, [activeTab, fetchTransactions]);

  const hasActiveFilters = Boolean(debouncedKeyword) || stockFilter !== "ALL";

  const clearFilters = useCallback(() => {
    setKeyword("");
    setDebouncedKeyword("");
    setStockFilter("ALL");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchProducts();
    fetchSummary();
    if (activeTab === "history" && txProductFilter !== "ALL") {
      fetchTransactions();
    }
  }, [
    fetchProducts,
    fetchSummary,
    activeTab,
    txProductFilter,
    fetchTransactions,
  ]);

  const selectedHistoryProduct = useMemo(
    () => historyProducts.find((p) => p.id === txProductFilter),
    [historyProducts, txProductFilter],
  );

  // ── Filtered transactions (client-side type filter) ─────────────────────
  const filteredTransactions = useMemo(() => {
    if (txTypeFilter === "ALL") return transactions;
    return transactions.filter((tx) => tx.type === txTypeFilter);
  }, [transactions, txTypeFilter]);

  const stockTreeData = useMemo(
    () => buildStockTreeRows(products),
    [products],
  );

  /** Mặc định thu gọn biến thể; `{ [rowId]: true }` hoặc `true` = mở tất cả. */
  const [stockExpanded, setStockExpanded] = useState({});

  // Chỉ thu gọn khi đổi bộ lọc/trang/chi nhánh — không reset sau refresh tồn (giữ biến thể đang mở).
  useEffect(() => {
    setStockExpanded({});
  }, [debouncedKeyword, stockFilter, pagination.pageIndex, selectedBranchId]);

  const toggleExpandAllVariants = useCallback(() => {
    setStockExpanded((prev) => (prev === true ? {} : true));
  }, []);

  const handleStockRowClick = useCallback((row) => {
    if (row.original._isVariantRow) return;
    if (!row.getCanExpand()) return;
    row.toggleExpanded();
  }, []);

  // ── Action handlers ──────────────────────────────────────────────────────
  const openAction = useCallback((product, type, preselectVariantId = null) => {
    setActionProduct(
      preselectVariantId
        ? { ...product, __preselectVariantId: preselectVariantId }
        : product,
    );
    setActionType(type);
    setActionOpen(true);
  }, []);

  // ── Stock table columns ──────────────────────────────────────────────────
  const stockColumns = useMemo(
    () => [
      {
        accessorKey: "images",
        header: "",
        enableSorting: false,
        enableHiding: false,
        size: 56,
        cell: ({ row }) => {
          const isSub = row.original._isVariantRow;
          const images = row.original.images ?? row.original.productImages;
          const firstImg = Array.isArray(images) ? images[0] : null;
          const canExpand = row.getCanExpand?.() ?? false;
          return (
            <div className="flex items-center gap-0.5 shrink-0">
              {!isSub && canExpand && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label={
                    row.getIsExpanded()
                      ? t("pages.inventory.list.collapseVariants")
                      : t("pages.inventory.list.expandVariants")
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    row.getToggleExpandedHandler()(e);
                  }}
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  {row.getIsExpanded() ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              )}
              {!isSub && !canExpand && <span className="w-8 shrink-0" />}
              {isSub && <span className="w-8 shrink-0" />}
              {!isSub ? (
                <div className="w-10 h-10 rounded-md border overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                  {firstImg ? (
                    <img
                      src={firstImg}
                      alt={row.original.productName || row.original.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              ) : (
                <span className="w-10 h-10 shrink-0 block" aria-hidden />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "productName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colProduct")}
          />
        ),
        cell: ({ row }) => {
          const name = row.original.productName || row.original.name;
          const isSub = row.original._isVariantRow;
          const vlabel = row.original._variantLabel;
          if (isSub) {
            return (
              <div className="pl-2 border-l-2 border-primary/25 ml-1 py-0.5">
                <p className="text-sm font-medium leading-tight">
                  {vlabel || t("pages.inventory.list.variant")}
                </p>
              </div>
            );
          }
          return (
            <div>
              <p className="font-medium text-sm leading-tight">{name}</p>
              {row.original.category && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.original.category}
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colPrice")}
          />
        ),
        cell: ({ row }) => {
          const isSub = row.original._isVariantRow;
          const hasVariants =
            (row.original.branchVariants || []).filter((x) => x?.variantId)
              .length > 0;
          if (!isSub && hasVariants) {
            return (
              <span className="text-xs text-muted-foreground italic">
                {t("pages.inventory.list.perVariant")}
              </span>
            );
          }
          const price =
            row.original._displayPrice ??
            row.original.price ??
            row.original.defaultPrice;
          return (
            <span className="text-sm font-medium">
              {price ? Number(price).toLocaleString(numberLocale) + " ₫" : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colStock")}
          />
        ),
        cell: ({ row }) => {
          if (row.original.trackInventory === false)
            return <span className="text-sm text-muted-foreground">—</span>;
          const isSub = row.original._isVariantRow;
          const qty = isSub
            ? row.original._displayQty ?? 0
            : row.original.quantity ?? 0;
          return (
            <span
              className={`text-sm font-semibold tabular-nums ${qty <= 0 ? "text-red-600" : ""}`}
            >
              {qty.toLocaleString(numberLocale)}
            </span>
          );
        },
      },
      {
        accessorKey: "minQuantity",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colMinStock")}
          />
        ),
        cell: ({ row }) => {
          if (row.original.trackInventory === false)
            return <span className="text-sm text-muted-foreground">—</span>;
          if (row.original._isVariantRow)
            return <span className="text-sm text-muted-foreground">—</span>;
          const min = row.original.minQuantity ?? 0;
          return (
            <span className="text-sm text-muted-foreground tabular-nums">
              {min > 0 ? min.toLocaleString(numberLocale) : "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: t("pages.inventory.list.colStatus"),
        enableSorting: false,
        cell: ({ row }) => {
          const isSub = row.original._isVariantRow;
          const qty = isSub
            ? row.original._displayQty ?? 0
            : row.original.quantity ?? 0;
          return (
            <StockStatusBadge
              quantity={qty}
              minQuantity={row.original.minQuantity ?? 0}
              trackInventory={row.original.trackInventory}
            />
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const product = row.original;
          if (product.trackInventory === false) return null;
          const isSub = product._isVariantRow;
          const lineQty = isSub
            ? product._displayQty ?? 0
            : product.quantity ?? 0;
          const pre = isSub ? product._variantId || null : null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">{t("pages.inventory.list.openMenu")}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuLabel>
                  {t("pages.inventory.list.actionsInventory")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "IMPORT", pre);
                  }}
                  disabled={!canManage}
                >
                  <PackagePlus className="h-4 w-4 mr-2 text-emerald-600" />
                  {t("pages.inventory.list.import")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "EXPORT", pre);
                  }}
                  disabled={!canManage || lineQty <= 0}
                >
                  <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                  {t("pages.inventory.list.export")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "ADJUSTMENT", pre);
                  }}
                  disabled={!canManage}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-blue-600" />
                  {t("pages.inventory.list.adjustment")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canManage, openAction, t, numberLocale],
  );

  const stockTable = useReactTable({
    data: stockTreeData,
    columns: stockColumns,
    getRowId: (row) => row._rowKey ?? row.id,
    getSubRows: (row) => row.subRows,
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setStockExpanded,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      pagination,
      columnVisibility,
      rowSelection,
      expanded: stockExpanded,
    },
  });

  // ── Transaction table columns ────────────────────────────────────────────
  const txColumns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colTime")}
          />
        ),
        cell: ({ row }) => {
          const d = row.original.createdAt;
          if (!d) return "—";
          const date = new Date(d);
          return (
            <div>
              <p className="text-sm">{date.toLocaleDateString(numberLocale)}</p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleTimeString(numberLocale)}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "productName",
        header: t("pages.inventory.list.colProduct"),
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">
              {row.original.productName || "—"}
            </p>
            {row.original.variantId && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("pages.inventory.list.variantLabel")}{" "}
                <span
                  className={
                    row.original.variantName ? "" : "font-mono break-all"
                  }
                >
                  {row.original.variantName || row.original.variantId}
                </span>
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: t("pages.inventory.list.colType"),
        cell: ({ row }) => <TxTypeBadge type={row.original.type} />,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.inventory.list.colQuantity")}
          />
        ),
        cell: ({ row }) => {
          const type = row.original.type;
          const qty = row.original.quantity ?? 0;
          const isPositive = type === "IMPORT";
          return (
            <span
              className={`text-sm font-semibold tabular-nums ${isPositive ? "text-emerald-600" : type === "EXPORT" ? "text-orange-600" : "text-blue-600"}`}
            >
              {isPositive ? "+" : type === "EXPORT" ? "-" : ""}
              {Math.abs(qty).toLocaleString(numberLocale)}
            </span>
          );
        },
      },
      {
        accessorKey: "currentStock",
        header: t("pages.inventory.list.colStockAfter"),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {(row.original.currentStock ?? 0).toLocaleString(numberLocale)}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: t("pages.inventory.list.colNote"),
        cell: ({ row }) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground max-w-[180px] truncate cursor-default">
                {row.original.note || "—"}
              </p>
            </TooltipTrigger>
            {row.original.note && (
              <TooltipContent side="top" className="max-w-xs">
                {row.original.note}
              </TooltipContent>
            )}
          </Tooltip>
        ),
      },
      {
        accessorKey: "createdByName",
        header: t("pages.inventory.list.colPerformedBy"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdByName || "—"}
          </span>
        ),
      },
    ],
    [t, numberLocale],
  );

  const txTable = useReactTable({
    data: filteredTransactions,
    columns: txColumns,
    manualPagination: true,
    pageCount: Math.ceil(txTotalCount / txPagination.pageSize),
    onPaginationChange: setTxPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { pagination: txPagination },
  });

  // ── No branch selected prompt ────────────────────────────────────────────
  const noBranch = !selectedBranchId;

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <ListPageHeader
          icon={Package}
          title={t("pages.inventory.list.title")}
          subtitle={
            selectedBranch
              ? t("pages.inventory.list.subtitleBranch", {
                  name: selectedBranch.name,
                })
              : t("pages.inventory.list.subtitleSelectBranch")
          }
          actions={
            branches.length > 1 ? (
              <Select
                value={selectedBranchId ?? ""}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue
                    placeholder={t("pages.inventory.list.selectBranch")}
                  />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null
          }
        />

        {/* ── No branch fallback ──────────────────────────────────────── */}
        {noBranch ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Warehouse className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">
              {t("pages.inventory.list.noBranchTitle")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("pages.inventory.list.noBranchHint")}
            </p>
          </div>
        ) : (
          <>
            <InventoryStatCards
              summary={summary}
              activeFilter={stockFilter}
              loading={summaryLoading && !summary}
              numberLocale={numberLocale}
              onFilterChange={(key) => {
                setStockFilter(key);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="stock" className="gap-1.5">
                  <Package className="h-4 w-4" /> {t("pages.inventory.list.tabStock")}
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5">
                  <History className="h-4 w-4" /> {t("pages.inventory.list.tabHistory")}
                </TabsTrigger>
              </TabsList>

              {/* ──── Stock Tab ──────────────────────────────────────────── */}
              <TabsContent value="stock">
                <div className="flex flex-col gap-4">
                  {/* Toolbar */}
                  <div className={listToolbarFilters}>
                    <div className={listSearchWrap}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder={t("pages.inventory.list.searchPlaceholder")}
                        value={keyword}
                        onChange={(e) => handleKeywordChange(e.target.value)}
                        className="pl-9 w-full"
                      />
                    </div>
                    <div className={listToolbarActions}>
                      {hasActiveFilters && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={clearFilters}
                        >
                          <X className="h-4 w-4" />
                          {t("pages.inventory.list.clearFilters")}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={toggleExpandAllVariants}
                      >
                        {stockExpanded === true ? (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            {t("pages.inventory.list.collapseAllVariants")}
                          </>
                        ) : (
                          <>
                            <ChevronRight className="h-4 w-4" />
                            {t("pages.inventory.list.expandAllVariants")}
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleRefresh}
                        disabled={loading || summaryLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${loading || summaryLoading ? "animate-spin" : ""}`}
                        />
                        {t("pages.inventory.list.refresh")}
                      </Button>
                      <DataTableViewOptions table={stockTable} />
                    </div>
                  </div>

                  {/* Table */}
                  <div className={dataTableContainer}>
                    {loading && products.length > 0 && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        {stockTable.getHeaderGroups().map((hg) => (
                          <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                              <TableHead key={h.id}>
                                {h.isPlaceholder
                                  ? null
                                  : flexRender(
                                      h.column.columnDef.header,
                                      h.getContext(),
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {loading && products.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={stockColumns.length}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {t("pages.inventory.list.loading")}
                            </TableCell>
                          </TableRow>
                        ) : stockTable.getRowModel().rows?.length ? (
                          stockTable.getRowModel().rows.map((row) => {
                            const product = row.original;
                            const rowEl = (
                              <TableRow
                                data-state={row.getIsSelected() && "selected"}
                                className={cn(
                                  product.trackInventory !== false &&
                                    "cursor-pointer",
                                  row.depth > 0
                                    ? "bg-muted/20 hover:bg-muted/30"
                                    : undefined,
                                )}
                                onClick={() => handleStockRowClick(row)}
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <TableCell
                                    key={cell.id}
                                    onClick={
                                      cell.column.id === "actions"
                                        ? (e) => e.stopPropagation()
                                        : undefined
                                    }
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );

                            return (
                              <InventoryStockContextMenu
                                key={row.id}
                                product={product}
                                canManage={canManage}
                                openAction={openAction}
                                t={t}
                              >
                                {rowEl}
                              </InventoryStockContextMenu>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={stockColumns.length}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {stockFilter !== "ALL" || debouncedKeyword
                                ? t("pages.inventory.list.emptyFilter")
                                : t("pages.inventory.list.emptyBranch")}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <DataTablePagination table={stockTable} />
                </div>
              </TabsContent>

              {/* ──── History Tab ────────────────────────────────────────── */}
              <TabsContent value="history">
                <div className="flex flex-col gap-4">
                  {txProductFilter === "ALL" ? (
                    <Card className="border-dashed bg-muted/30">
                      <CardContent className="py-4 flex gap-3 items-start">
                        <History className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">
                            {t("pages.inventory.list.historyBannerTitle")}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {t("pages.inventory.list.historyBannerDesc")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : selectedHistoryProduct ? (
                    <p className="text-sm text-muted-foreground">
                      {t("pages.inventory.list.historyViewing", {
                        name:
                          selectedHistoryProduct.productName ||
                          selectedHistoryProduct.name,
                      })}
                    </p>
                  ) : null}

                  {/* Toolbar */}
                  <div className={listToolbarFilters}>
                    {historyProducts.length > 0 && (
                      <Select
                        value={txProductFilter}
                        onValueChange={(v) => {
                          setTxProductFilter(v);
                          setTransactions([]);
                          setTxTotalCount(0);
                          setTxPagination((p) => ({ ...p, pageIndex: 0 }));
                        }}
                      >
                        <SelectTrigger className={listProductSelectWrap}>
                          <SelectValue
                            placeholder={t(
                              "pages.inventory.list.selectProductHistory",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="ALL">
                            {t("pages.inventory.list.selectProduct")}
                          </SelectItem>
                          {historyProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.productName || p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select
                      value={txTypeFilter}
                      onValueChange={(v) => {
                        setTxTypeFilter(v);
                      }}
                    >
                      <SelectTrigger className={listFilterSelectWrap}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="ALL">
                          {t("pages.inventory.list.filterAllTypes")}
                        </SelectItem>
                        <SelectItem value="IMPORT">
                          {t("pages.inventory.list.txImport")}
                        </SelectItem>
                        <SelectItem value="EXPORT">
                          {t("pages.inventory.list.txExport")}
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          {t("pages.inventory.list.txAdjustment")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className={dataTableContainer}>
                    {txLoading && transactions.length > 0 && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        {txTable.getHeaderGroups().map((hg) => (
                          <TableRow key={hg.id}>
                            {hg.headers.map((h) => (
                              <TableHead key={h.id}>
                                {h.isPlaceholder
                                  ? null
                                  : flexRender(
                                      h.column.columnDef.header,
                                      h.getContext(),
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {txLoading && transactions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={txColumns.length}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {t("pages.inventory.list.loading")}
                            </TableCell>
                          </TableRow>
                        ) : txTable.getRowModel().rows?.length ? (
                          txTable.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={txColumns.length}
                              className="h-24 text-center text-muted-foreground"
                            >
                              <div className="flex flex-col items-center gap-2 py-4">
                                <ArrowDownUp className="h-8 w-8 text-muted-foreground/40" />
                                <p>
                                  {txProductFilter === "ALL"
                                    ? t("pages.inventory.list.historySelectProduct")
                                    : t("pages.inventory.list.historyEmpty")}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <DataTablePagination table={txTable} />
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* ── Inventory Action Modal ──────────────────────────────────── */}
      <InventoryActionModal
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        product={actionProduct}
        actionType={actionType}
        onSuccess={() => {
          fetchProducts();
          fetchSummary();
          if (activeTab === "history") fetchTransactions();
        }}
      />
    </div>
  );
};

export default InventoryListPage;
