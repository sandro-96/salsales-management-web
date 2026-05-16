import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useShop } from "../../hooks/useShop.js";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  MoreHorizontal,
  PackagePlus,
  Package,
  Loader2,
  ScanLine,
  FileSpreadsheet,
  Layers,
  CopyPlus,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import {
  dataTableContainer,
  listBranchSelectWrap,
  listInputGrow,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
  listSearchWrap,
  listFilterSelectWrap,
} from "@/components/table/listPageLayout.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import {
  getProducts,
  getProductSummary,
  deleteProduct,
  toggleProductActive,
  updateProductTrackInventory,
} from "../../api/productApi.js";
import ProductFormModal from "./ProductFormModal.jsx";
import ProductImportExportDialog from "./ProductImportExportDialog.jsx";
import ShopToppingsModal from "./ShopToppingsModal.jsx";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import {
  PRODUCT_CATEGORIES,
  translateProductCategory,
} from "@/constants/productConstants.js";
import { ProductListEmptyState } from "@/components/products/ProductListEmptyState.jsx";
import { ProductListStatCards } from "@/components/products/ProductListStatCards.jsx";

/** Dữ liệu clone cho form tạo mới — ProductForm xử lý qua prefill.__isClone */
function buildProductClonePrefill(product, nameSuffix = "") {
  if (!product) return null;
  const baseName = String(product.name ?? "").trim();
  return {
    __isClone: true,
    name: baseName ? `${baseName}${nameSuffix}` : "",
    sku: "",
    barcode: "",
    unit: product.unit ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    supplierId: product.supplierId ?? "",
    defaultPrice: Number(product.defaultPrice ?? product.price ?? 0) || 0,
    costPrice: Number(product.costPrice ?? product.branchCostPrice ?? 0) || 0,
    active: product.active !== false,
    trackInventory: !!product.trackInventory,
    sellByWeight: !!product.sellByWeight,
    variants: Array.isArray(product.variants) ? product.variants : [],
    images: Array.isArray(product.images) ? [...product.images] : [],
    assignedToppingIds: [...(product.assignedToppingIds ?? [])],
  };
}

const ProductPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { selectedShopId, branches, selectedShop, fetchShops } = useShop();
  const { hasShopPermission, hasAnyShopPermission } = useShopPermissions();
  const shopId = selectedShopId;
  const canCreate = hasShopPermission(PERM.PRODUCT_CREATE);
  const canUpdate = hasShopPermission(PERM.PRODUCT_UPDATE);
  const canDelete = hasShopPermission(PERM.PRODUCT_DELETE);
  const canUpdateStatus = hasShopPermission(PERM.PRODUCT_UPDATE_STATUS);
  const canImportExport = hasAnyShopPermission([
    PERM.PRODUCT_IMPORT,
    PERM.PRODUCT_EXPORT,
  ]);
  const canManageShopToppings = hasShopPermission(PERM.SHOP_UPDATE);
  const { confirm } = useAlertDialog();

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalPrefillDefaults, setModalPrefillDefaults] = useState(null);
  const [importExportOpen, setImportExportOpen] = useState(false);
  const [toppingsSettingsOpen, setToppingsSettingsOpen] = useState(false);
  const [createStep, setCreateStep] = useState("scan"); // "scan" | "form"

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const debounceRef = useRef(null);

  const hasFilters =
    !!debouncedKeyword ||
    activeFilter !== "ALL" ||
    categoryFilter !== "ALL";

  const buildFilterParams = useCallback(() => {
    const params = {};
    if (activeFilter === "ACTIVE") params.active = true;
    if (activeFilter === "INACTIVE") params.active = false;
    if (categoryFilter && categoryFilter !== "ALL") {
      params.category = categoryFilter;
    }
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    return params;
  }, [activeFilter, categoryFilter, debouncedKeyword]);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
  };

  const fetchStats = useCallback(async () => {
    if (!shopId) return;
    setStatsLoading(true);
    const params = {};
    if (debouncedKeyword) params.keyword = debouncedKeyword;
    if (categoryFilter && categoryFilter !== "ALL") {
      params.category = categoryFilter;
    }
    try {
      const res = await getProductSummary(shopId, params);
      const data = res.data?.data;
      setStats({
        total: data?.total ?? 0,
        active: data?.active ?? 0,
        inactive: data?.inactive ?? 0,
      });
    } catch {
      setStats({ total: 0, active: 0, inactive: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, [shopId, debouncedKeyword, categoryFilter]);

  const fetchProducts = useCallback(
    async ({ silent = false } = {}) => {
      if (!shopId) return;
      if (!silent) setLoading(true);
      try {
        const params = {
          page: pagination.pageIndex,
          size: pagination.pageSize,
          ...buildFilterParams(),
        };
        if (sorting.length > 0) {
          params.sortBy = sorting[0].id;
          params.sortDir = sorting[0].desc ? "DESC" : "ASC";
        }
        const res = await getProducts(shopId, params);
        const data = res.data?.data;
        if (data && typeof data === "object" && "content" in data) {
          setProducts(data.content ?? []);
          setTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
        } else {
          const list = Array.isArray(data) ? data : [];
          setProducts(list);
          setTotalCount(list.length);
        }
      } catch (err) {
        console.error("Fetch products error:", err);
        if (!silent) toast.error(t("pages.products.list.fetchError"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [shopId, pagination, sorting, buildFilterParams, t],
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const clearFilters = () => {
    setKeyword("");
    setDebouncedKeyword("");
    setActiveFilter("ALL");
    setCategoryFilter("ALL");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const openAddProduct = (step = "form") => {
    setEditingProduct(null);
    setModalPrefillDefaults(null);
    setCreateStep(step);
    setModalOpen(true);
  };

  const handleToggleActive = async (product) => {
    try {
      const res = await toggleProductActive(shopId, product.productId);
      if (res.data?.success) {
        const updated = res.data.data;
        setProducts((prev) =>
          prev.map((p) =>
            p.productId === product.productId ? { ...p, ...updated } : p,
          ),
        );
        toast.success(
          updated?.active
            ? t("pages.products.list.activated")
            : t("pages.products.list.deactivated"),
        );
        fetchStats();
      }
    } catch {
      toast.error(t("pages.products.list.statusUpdateFail"));
    }
  };

  const handleToggleTrackInventory = async (product, trackInventory) => {
    try {
      const res = await updateProductTrackInventory(
        shopId,
        product.productId,
        trackInventory,
      );
      if (res.data?.success) {
        const updated = res.data.data;
        setProducts((prev) =>
          prev.map((p) =>
            p.productId === product.productId ? { ...p, ...updated } : p,
          ),
        );
        toast.success(
          trackInventory
            ? t("pages.products.list.trackInventoryOn")
            : t("pages.products.list.trackInventoryOff"),
        );
      } else {
        toast.error(res.data?.message || t("pages.products.list.updateFail"));
      }
    } catch {
      toast.error(t("pages.products.list.trackInventoryUpdateFail"));
    }
  };

  const handleDelete = async (product) => {
    const ok = await confirm(
      t("pages.products.list.deleteConfirm", { name: product.name }),
      {
        title: t("pages.products.list.deleteTitle"),
        confirmText: t("pages.products.list.deleteConfirmBtn"),
        cancelText: t("pages.products.list.cancel"),
        variant: "destructive",
      },
    );
    if (!ok) return;

    // Optimistic update: remove immediately from UI
    setProducts((prev) =>
      prev.filter((p) => p.productId !== product.productId),
    );
    setTotalCount((c) => c - 1);

    try {
      setIsSubmitting(true);
      const res = await deleteProduct(shopId, product.productId);
      if (res.data?.success) {
        toast.success(t("pages.products.list.deleteSuccess"));
        fetchProducts();
        fetchStats();
      } else {
        toast.error(res.data?.message || t("pages.products.list.deleteFail"));
        fetchProducts(); // revert
      }
    } catch (err) {
      console.error("Delete product error:", err);
      toast.error(t("pages.products.list.deleteError"));
      fetchProducts(); // revert
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalPrefillDefaults(null);
    setEditingProduct(null);
  };

  const handleOpenEdit = (product) => {
    setModalPrefillDefaults(null);
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleCloneFromProduct = (product) => {
    if (!canCreate) return;
    const payload = buildProductClonePrefill(
      product,
      t("pages.products.list.cloneNameSuffix"),
    );
    if (!payload) return;
    setEditingProduct(null);
    setCreateStep("form");
    setModalPrefillDefaults(payload);
    setModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      accessorKey: "images",
      header: "",
      enableSorting: false,
      enableHiding: false,
      size: 56,
      cell: ({ row }) => {
        const images = row.getValue("images");
        const firstImg = Array.isArray(images) ? images[0] : null;
        return (
          <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {firstImg ? (
              <img
                src={firstImg}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("pages.products.list.colName")}
        />
      ),
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="min-w-0">
            <div className="font-medium truncate flex items-center gap-2">
              <span className="truncate">{row.getValue("name")}</span>
              {!product.active ? (
                <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5">
                  {t("pages.products.list.inactiveBadge")}
                </Badge>
              ) : null}
            </div>
            {product.barcode ? (
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                {product.barcode}
              </p>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: t("pages.products.list.colSku"),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground font-mono">
          {row.getValue("sku") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: t("pages.products.list.colCategory"),
      cell: ({ row }) => {
        const raw = row.getValue("category");
        return (
          <div>{raw ? translateProductCategory(t, raw) : "-"}</div>
        );
      },
    },
    {
      accessorKey: "defaultPrice",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("pages.products.list.colDefaultPrice")}
        />
      ),
      cell: ({ row }) => {
        const price = row.getValue("defaultPrice");
        return (
          <div className="font-medium">
            {price ? Number(price).toLocaleString(numberLocale) + " ₫" : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("pages.products.list.colActive")}
        />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const checked = !!product.active;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <Switch
              checked={checked}
              disabled={!canUpdateStatus}
              onCheckedChange={() => handleToggleActive(product)}
            />
          </div>
        );
      },
    },
    {
      accessorKey: "trackInventory",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("pages.products.list.colTrackInventory")}
        />
      ),
      cell: ({ row }) => {
        const product = row.original;
        const checked = !!product.trackInventory;
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <Switch
              checked={checked}
              disabled={!canUpdate}
              onCheckedChange={(val) =>
                handleToggleTrackInventory(product, val)
              }
            />
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">{t("pages.products.list.openMenu")}</span>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background">
                <DropdownMenuLabel>{t("pages.products.list.actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    handleOpenEdit(product);
                  }}
                >
                  {canUpdate
                    ? t("pages.products.list.edit")
                    : t("pages.products.list.viewDetail")}
                </DropdownMenuItem>
                {canCreate && (
                  <DropdownMenuItem
                    onSelect={() => handleCloneFromProduct(product)}
                  >
                    <CopyPlus className="h-4 w-4" />
                    {t("pages.products.list.cloneFrom")}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                    disabled={isSubmitting}
                    onSelect={() => handleDelete(product)}
                  >
                    {t("pages.products.list.delete")}
                    <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                      ⌘⌫
                    </DropdownMenuShortcut>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [t, numberLocale, canUpdate, canCreate, canDelete, canUpdateStatus, isSubmitting]);

  const table = useReactTable({
    data: products,
    columns,
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
    },
  });

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex w-full min-w-0">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {t("pages.products.list.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("pages.products.list.subtitle")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={loading}
            onClick={() => fetchProducts()}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-1.5", loading && "animate-spin")}
            />
            {t("pages.products.list.refresh")}
          </Button>
        </div>

        <ProductListStatCards
          stats={stats}
          activeFilter={activeFilter}
          loading={statsLoading}
          numberLocale={numberLocale}
          onFilterChange={(key) => {
            setActiveFilter(key);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={cn(listSearchWrap, "relative")}>
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.products.list.searchPlaceholder")}
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className={cn(listInputGrow, "pl-9 pr-9")}
              />
              {keyword ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setKeyword("");
                    setDebouncedKeyword("");
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  aria-label={t("pages.products.list.clearSearch")}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className={listFilterSelectWrap}>
                <SelectValue
                  placeholder={t("pages.products.list.categoryFilter")}
                />
              </SelectTrigger>
              <SelectContent className="bg-background max-h-64">
                <SelectItem value="ALL">
                  {t("pages.products.list.allCategories")}
                </SelectItem>
                {PRODUCT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {translateProductCategory(t, c.value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DataTableViewOptions table={table} />
          </div>
          <div className={listToolbarActions}>
            {selectedShop?.toppingsEnabled && canManageShopToppings && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setToppingsSettingsOpen(true)}
              >
                <Layers className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">
                  {t("pages.products.list.toppingsSettings")}
                </span>
              </Button>
            )}
            {canImportExport && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setImportExportOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">
                  {t("pages.products.list.excel")}
                </span>
              </Button>
            )}
            {canCreate && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => openAddProduct("scan")}
                >
                  <ScanLine className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {t("pages.products.list.scanBarcode")}
                  </span>
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => openAddProduct("form")}
                >
                  <PackagePlus className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">
                    {t("pages.products.list.addProduct")}
                  </span>
                </Button>
              </>
            )}
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
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("pages.products.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const product = row.original;
                  return (
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow
                          data-state={row.getIsSelected() && "selected"}
                          className={cn(
                            "cursor-pointer",
                            !product.active && "opacity-70",
                          )}
                          onClick={() => handleOpenEdit(product)}
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
                      </ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[11rem] bg-background">
                        <ContextMenuLabel>
                          {t("pages.products.list.actions")}
                        </ContextMenuLabel>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onSelect={() => handleOpenEdit(product)}
                        >
                          {canUpdate
                            ? t("pages.products.list.edit")
                            : t("pages.products.list.viewDetail")}
                        </ContextMenuItem>
                        {canCreate && (
                          <ContextMenuItem
                            onSelect={() => handleCloneFromProduct(product)}
                          >
                            <CopyPlus className="h-4 w-4" />
                            {t("pages.products.list.cloneFrom")}
                          </ContextMenuItem>
                        )}
                        {canDelete && (
                          <ContextMenuItem
                            className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                            disabled={isSubmitting}
                            onSelect={() => handleDelete(product)}
                          >
                            {t("pages.products.list.delete")}
                            <ContextMenuShortcut>
                              ⌘⌫
                            </ContextMenuShortcut>
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    <ProductListEmptyState
                      hasFilters={hasFilters}
                      canCreate={canCreate}
                      onAdd={() => openAddProduct("form")}
                      onClearFilters={clearFilters}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      <ProductFormModal
        open={modalOpen}
        onClose={handleModalClose}
        product={editingProduct}
        shopId={shopId}
        onSuccess={() => {
          fetchProducts();
          fetchStats();
        }}
        startStep={editingProduct ? undefined : createStep}
        prefillDefaults={modalPrefillDefaults ?? undefined}
      />

      <ProductImportExportDialog
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
        shopId={shopId}
        branches={branches}
        onImportSuccess={() => {
          fetchProducts();
          fetchStats();
        }}
      />

      <ShopToppingsModal
        open={toppingsSettingsOpen}
        onClose={() => setToppingsSettingsOpen(false)}
        shopId={shopId}
        onSaved={() => {
          fetchProducts();
          fetchShops(shopId);
        }}
      />
    </div>
  );
};

export default ProductPage;
