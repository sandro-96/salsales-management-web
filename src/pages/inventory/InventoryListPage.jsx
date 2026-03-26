import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  flexRender,
  getCoreRowModel,
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
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop.js";
import { getBranchProducts } from "../../api/productApi.js";
import { getTransactionHistory } from "../../api/inventoryApi.js";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";

import InventoryActionModal from "./InventoryActionModal.jsx";

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, sub, iconClassName, loading }) => {
  const IconComp = icon;
  return (
    <Card className="py-4 gap-3">
      <CardContent className="flex items-center gap-4">
        <div
          className={`flex items-center justify-center h-11 w-11 rounded-xl shrink-0 ${iconClassName}`}
        >
          <IconComp className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          {loading ? (
            <>
              <Skeleton className="h-6 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold tracking-tight leading-none">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {label}
              </p>
            </>
          )}
        </div>
        {sub && !loading && (
          <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
            {sub}
          </span>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Stock Status Badge ──────────────────────────────────────────────────────

const StockStatusBadge = ({ quantity, minQuantity }) => {
  if (quantity <= 0)
    return (
      <Badge variant="destructive" className="gap-1 text-[11px]">
        <PackageX className="h-3 w-3" /> Hết hàng
      </Badge>
    );
  if (minQuantity > 0 && quantity <= minQuantity)
    return (
      <Badge className="gap-1 text-[11px] bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
        <AlertTriangle className="h-3 w-3" /> Sắp hết
      </Badge>
    );
  return (
    <Badge className="gap-1 text-[11px] bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
      Còn hàng
    </Badge>
  );
};

// ─── Transaction Type Badge ──────────────────────────────────────────────────

const TxTypeBadge = ({ type }) => {
  const map = {
    IMPORT: {
      label: "Nhập hàng",
      icon: TrendingUp,
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    EXPORT: {
      label: "Xuất hàng",
      icon: TrendingDown,
      cls: "bg-orange-100 text-orange-800 border-orange-200",
    },
    ADJUSTMENT: {
      label: "Điều chỉnh",
      icon: SlidersHorizontal,
      cls: "bg-blue-100 text-blue-800 border-blue-200",
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
  const {
    selectedShopId,
    selectedBranchId,
    selectedBranch,
    branches,
    setSelectedBranchId,
    isOwner,
    isStaff,
  } = useShop();

  const canManage = isOwner || isStaff;

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
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, selectedBranchId, pagination, sorting, debouncedKeyword]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Fetch transactions ───────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!selectedShopId || !selectedBranchId || txProductFilter === "ALL") return;
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
      toast.error("Không thể tải lịch sử giao dịch.");
    } finally {
      setTxLoading(false);
    }
  }, [
    selectedShopId,
    selectedBranchId,
    txPagination,
    txProductFilter,
  ]);

  useEffect(() => {
    if (activeTab === "history") fetchTransactions();
  }, [activeTab, fetchTransactions]);

  // ── Computed stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity ?? 0), 0);
    const lowStock = products.filter(
      (p) => p.quantity > 0 && p.minQuantity > 0 && p.quantity <= p.minQuantity,
    ).length;
    const outOfStock = products.filter((p) => (p.quantity ?? 0) <= 0).length;
    return { totalProducts, totalStock, lowStock, outOfStock };
  }, [products]);

  // ── Filtered products ────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (stockFilter === "ALL") return products;
    if (stockFilter === "LOW_STOCK")
      return products.filter(
        (p) =>
          p.quantity > 0 && p.minQuantity > 0 && p.quantity <= p.minQuantity,
      );
    if (stockFilter === "OUT_OF_STOCK")
      return products.filter((p) => (p.quantity ?? 0) <= 0);
    if (stockFilter === "IN_STOCK")
      return products.filter(
        (p) =>
          p.quantity > 0 && (p.minQuantity <= 0 || p.quantity > p.minQuantity),
      );
    return products;
  }, [products, stockFilter]);

  // ── Filtered transactions (client-side type filter) ─────────────────────
  const filteredTransactions = useMemo(() => {
    if (txTypeFilter === "ALL") return transactions;
    return transactions.filter((tx) => tx.type === txTypeFilter);
  }, [transactions, txTypeFilter]);

  // ── Action handlers ──────────────────────────────────────────────────────
  const openAction = (product, type) => {
    setActionProduct(product);
    setActionType(type);
    setActionOpen(true);
  };

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
          const images = row.original.images ?? row.original.productImages;
          const firstImg = Array.isArray(images) ? images[0] : null;
          return (
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
          );
        },
      },
      {
        accessorKey: "productName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Sản phẩm" />
        ),
        cell: ({ row }) => {
          const name = row.original.productName || row.original.name;
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
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground font-mono">
            {row.original.sku || "—"}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Giá bán" />
        ),
        cell: ({ row }) => {
          const price = row.original.price ?? row.original.defaultPrice;
          return (
            <span className="text-sm font-medium">
              {price ? Number(price).toLocaleString("vi-VN") + " ₫" : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tồn kho" />
        ),
        cell: ({ row }) => {
          const qty = row.original.quantity ?? 0;
          return (
            <span
              className={`text-sm font-semibold tabular-nums ${qty <= 0 ? "text-red-600" : ""}`}
            >
              {qty.toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        accessorKey: "minQuantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tồn tối thiểu" />
        ),
        cell: ({ row }) => {
          const min = row.original.minQuantity ?? 0;
          return (
            <span className="text-sm text-muted-foreground tabular-nums">
              {min > 0 ? min.toLocaleString("vi-VN") : "—"}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Trạng thái",
        enableSorting: false,
        cell: ({ row }) => (
          <StockStatusBadge
            quantity={row.original.quantity ?? 0}
            minQuantity={row.original.minQuantity ?? 0}
          />
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const product = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Mở menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuLabel>Thao tác kho</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "IMPORT");
                  }}
                  disabled={!canManage}
                >
                  <PackagePlus className="h-4 w-4 mr-2 text-emerald-600" />
                  Nhập hàng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "EXPORT");
                  }}
                  disabled={!canManage || (product.quantity ?? 0) <= 0}
                >
                  <PackageMinus className="h-4 w-4 mr-2 text-orange-600" />
                  Xuất hàng
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openAction(product, "ADJUSTMENT");
                  }}
                  disabled={!canManage}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-blue-600" />
                  Điều chỉnh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canManage],
  );

  const stockTable = useReactTable({
    data: filteredProducts,
    columns: stockColumns,
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
    state: { sorting, pagination, columnVisibility, rowSelection },
  });

  // ── Transaction table columns ────────────────────────────────────────────
  const txColumns = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Thời gian" />
        ),
        cell: ({ row }) => {
          const d = row.original.createdAt;
          if (!d) return "—";
          const date = new Date(d);
          return (
            <div>
              <p className="text-sm">{date.toLocaleDateString("vi-VN")}</p>
              <p className="text-xs text-muted-foreground">
                {date.toLocaleTimeString("vi-VN")}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "productName",
        header: "Sản phẩm",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">
              {row.original.productName || "—"}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {row.original.sku || ""}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Loại",
        cell: ({ row }) => <TxTypeBadge type={row.original.type} />,
      },
      {
        accessorKey: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Số lượng" />
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
              {Math.abs(qty).toLocaleString("vi-VN")}
            </span>
          );
        },
      },
      {
        accessorKey: "currentStock",
        header: "Tồn sau GD",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {(row.original.currentStock ?? 0).toLocaleString("vi-VN")}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Ghi chú",
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
        accessorKey: "createdBy",
        header: "Người thực hiện",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdBy || "—"}
          </span>
        ),
      },
    ],
    [],
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quản lý kho hàng
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedBranch
                ? `Chi nhánh: ${selectedBranch.name}`
                : "Chọn chi nhánh để xem tồn kho"}
            </p>
          </div>
          {branches.length > 1 && (
            <Select
              value={selectedBranchId ?? ""}
              onValueChange={setSelectedBranchId}
            >
              <SelectTrigger className="w-[220px]">
                <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* ── No branch fallback ──────────────────────────────────────── */}
        {noBranch ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Warehouse className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">Chưa chọn chi nhánh</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Vui lòng chọn một chi nhánh để xem và quản lý tồn kho sản phẩm.
            </p>
          </div>
        ) : (
          <>
            {/* ── Stat Cards ────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={Package}
                label="Tổng sản phẩm"
                value={stats.totalProducts.toLocaleString("vi-VN")}
                iconClassName="bg-violet-100 text-violet-600"
                loading={loading && products.length === 0}
              />
              <StatCard
                icon={Warehouse}
                label="Tổng tồn kho"
                value={stats.totalStock.toLocaleString("vi-VN")}
                iconClassName="bg-sky-100 text-sky-600"
                loading={loading && products.length === 0}
              />
              <StatCard
                icon={AlertTriangle}
                label="Sắp hết hàng"
                value={stats.lowStock}
                iconClassName="bg-amber-100 text-amber-600"
                loading={loading && products.length === 0}
              />
              <StatCard
                icon={PackageX}
                label="Hết hàng"
                value={stats.outOfStock}
                iconClassName="bg-red-100 text-red-600"
                loading={loading && products.length === 0}
              />
            </div>

            {/* ── Tabs ──────────────────────────────────────────────────── */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="stock" className="gap-1.5">
                  <Package className="h-4 w-4" /> Tồn kho
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5">
                  <History className="h-4 w-4" /> Lịch sử
                </TabsTrigger>
              </TabsList>

              {/* ──── Stock Tab ──────────────────────────────────────────── */}
              <TabsContent value="stock">
                <div className="flex flex-col gap-4">
                  {/* Toolbar */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <div className="relative flex-1 min-w-0 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          placeholder="Tìm sản phẩm..."
                          value={keyword}
                          onChange={(e) => handleKeywordChange(e.target.value)}
                          className="pl-9 flex-1 min-w-0"
                        />
                      </div>
                      <Select
                        value={stockFilter}
                        onValueChange={(v) => {
                          setStockFilter(v);
                          setPagination((p) => ({ ...p, pageIndex: 0 }));
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="ALL">Tất cả</SelectItem>
                          <SelectItem value="IN_STOCK">Còn hàng</SelectItem>
                          <SelectItem value="LOW_STOCK">
                            Sắp hết hàng
                          </SelectItem>
                          <SelectItem value="OUT_OF_STOCK">Hết hàng</SelectItem>
                        </SelectContent>
                      </Select>
                      <DataTableViewOptions table={stockTable} />
                    </div>
                  </div>

                  {/* Table */}
                  <div className="relative overflow-hidden rounded-md border">
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
                              Đang tải...
                            </TableCell>
                          </TableRow>
                        ) : stockTable.getRowModel().rows?.length ? (
                          stockTable.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
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
                              colSpan={stockColumns.length}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {stockFilter !== "ALL"
                                ? "Không có sản phẩm phù hợp với bộ lọc."
                                : "Chưa có sản phẩm nào trong chi nhánh."}
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
                  {/* Toolbar */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {products.length > 0 && (
                      <Select
                        value={txProductFilter}
                        onValueChange={(v) => {
                          setTxProductFilter(v);
                          setTransactions([]);
                          setTxTotalCount(0);
                          setTxPagination((p) => ({ ...p, pageIndex: 0 }));
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Chọn sản phẩm để xem lịch sử" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="ALL" disabled>Chọn sản phẩm</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.productName || p.name}{" "}
                              {p.sku ? `(${p.sku})` : ""}
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
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="ALL">Tất cả loại</SelectItem>
                        <SelectItem value="IMPORT">Nhập hàng</SelectItem>
                        <SelectItem value="EXPORT">Xuất hàng</SelectItem>
                        <SelectItem value="ADJUSTMENT">Điều chỉnh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className="relative overflow-hidden rounded-md border">
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
                              Đang tải...
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
                                    ? "Chọn sản phẩm để xem lịch sử giao dịch."
                                    : "Chưa có giao dịch nào."}
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
          if (activeTab === "history") fetchTransactions();
        }}
      />
    </div>
  );
};

export default InventoryListPage;
