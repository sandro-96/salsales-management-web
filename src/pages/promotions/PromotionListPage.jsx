import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
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
  Plus,
  Loader2,
  DollarSign,
  Tag,
  Warehouse,
  Globe,
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
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { PromotionListStatCards } from "@/components/promotions/PromotionListStatCards.jsx";
import {
  dataTableContainer,
  listBranchSelectWrap,
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

import { getPromotions, deletePromotion } from "../../api/promotionApi.js";
import PromotionFormModal from "./PromotionFormModal.jsx";

const getPromotionStatusKey = (promo) => {
  if (!promo.active) return "PAUSED";
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  if (now < start) return "UPCOMING";
  if (now > end) return "EXPIRED";
  return "ACTIVE";
};

const getPromotionStatus = (promo, t) => {
  const key = getPromotionStatusKey(promo);
  const map = {
    PAUSED: {
      label: t("pages.promotions.list.statusPaused"),
      variant: "secondary",
    },
    UPCOMING: {
      label: t("pages.promotions.list.statusUpcoming"),
      variant: "outline",
    },
    EXPIRED: {
      label: t("pages.promotions.list.statusExpired"),
      variant: "destructive",
    },
    ACTIVE: {
      label: t("pages.promotions.list.statusActive"),
      variant: "default",
    },
  };
  return map[key];
};

const formatDate = (dateStr, locale) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function DiscountValue({ type, value, numberLocale }) {
  if (type === "PERCENT") {
    return <span className="font-semibold tabular-nums">{value}%</span>;
  }
  const formatted = Number(value).toLocaleString(numberLocale);
  return (
    <span className="inline-flex items-baseline gap-0.5 max-w-full min-w-0 font-semibold tabular-nums whitespace-nowrap">
      <span className="truncate">{formatted}</span>
      <span className="shrink-0">đ</span>
    </span>
  );
}

const PromotionListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { selectedShopId, branches } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const shopId = selectedShopId;
  const canCreate = hasShopPermission(PERM.PROMOTION_CREATE);
  const canUpdate = hasShopPermission(PERM.PROMOTION_UPDATE);
  const canDelete = hasShopPermission(PERM.PROMOTION_DELETE);
  const { confirm } = useAlertDialog();
  const debounceRef = useRef(null);

  const branchMap = useMemo(() => {
    const map = {};
    branches?.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  const [promotions, setPromotions] = useState([]);
  const [shopPromotions, setShopPromotions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const clientMode =
    statusFilter !== "ALL" || Boolean(debouncedKeyword.trim());

  const handleKeywordChange = (value) => {
    setKeyword(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(value);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
  };

  useEffect(() => {
    const applyColumnVisibility = () => {
      const w = window.innerWidth;
      setColumnVisibility({
        priority: w >= 1024,
        startDate: w >= 1024,
        endDate: w >= 1024,
        branch: w >= 768,
        scope: w >= 1280,
      });
    };
    applyColumnVisibility();
    window.addEventListener("resize", applyColumnVisibility);
    return () => window.removeEventListener("resize", applyColumnVisibility);
  }, []);

  const fetchShopPromotions = useCallback(async () => {
    if (!shopId) return;
    setSummaryLoading(true);
    try {
      const params = { page: 0, size: 500, sort: "startDate,desc" };
      if (branchFilter !== "__all__") params.branchId = branchFilter;
      const res = await getPromotions(shopId, params);
      const data = res.data?.data;
      const list =
        data && typeof data === "object" && "content" in data
          ? (data.content ?? [])
          : Array.isArray(data)
            ? data
            : [];
      setShopPromotions(list);
    } catch {
      setShopPromotions([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [shopId, branchFilter]);

  const fetchPromotions = useCallback(async () => {
    if (!shopId || clientMode) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
      };
      if (branchFilter !== "__all__") {
        params.branchId = branchFilter;
      }
      if (sorting.length > 0) {
        params.sort = `${sorting[0].id},${sorting[0].desc ? "desc" : "asc"}`;
      } else {
        params.sort = "startDate,desc";
      }
      const res = await getPromotions(shopId, params);
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setPromotions(data.content ?? []);
        setTotalCount(data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setPromotions(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error("Fetch promotions error:", err);
      toast.error(t("pages.promotions.list.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, sorting, branchFilter, clientMode, t]);

  useEffect(() => {
    fetchShopPromotions();
  }, [fetchShopPromotions]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const stats = useMemo(() => {
    const s = {
      total: shopPromotions.length,
      active: 0,
      upcoming: 0,
      expired: 0,
      paused: 0,
    };
    for (const p of shopPromotions) {
      const key = getPromotionStatusKey(p);
      if (key === "ACTIVE") s.active += 1;
      else if (key === "UPCOMING") s.upcoming += 1;
      else if (key === "EXPIRED") s.expired += 1;
      else if (key === "PAUSED") s.paused += 1;
    }
    return s;
  }, [shopPromotions]);

  const filteredList = useMemo(() => {
    let list = shopPromotions;
    if (statusFilter !== "ALL") {
      list = list.filter((p) => getPromotionStatusKey(p) === statusFilter);
    }
    const kw = debouncedKeyword.trim().toLowerCase();
    if (kw) {
      list = list.filter((p) => p.name?.toLowerCase().includes(kw));
    }
    return list;
  }, [shopPromotions, statusFilter, debouncedKeyword]);

  const tableData = useMemo(() => {
    if (!clientMode) {
      if (!debouncedKeyword.trim()) return promotions;
      const kw = debouncedKeyword.toLowerCase();
      return promotions.filter((p) => p.name?.toLowerCase().includes(kw));
    }
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [
    clientMode,
    promotions,
    debouncedKeyword,
    filteredList,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  const pageCount = useMemo(() => {
    if (clientMode) {
      return Math.max(
        1,
        Math.ceil(filteredList.length / pagination.pageSize) || 1,
      );
    }
    const kw = debouncedKeyword.trim();
    if (kw) {
      const count = promotions.filter((p) =>
        p.name?.toLowerCase().includes(kw.toLowerCase()),
      ).length;
      return Math.max(1, Math.ceil(count / pagination.pageSize) || 1);
    }
    return Math.max(1, Math.ceil(totalCount / pagination.pageSize) || 1);
  }, [
    clientMode,
    filteredList.length,
    pagination.pageSize,
    debouncedKeyword,
    promotions,
    totalCount,
  ]);

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    Boolean(debouncedKeyword.trim()) ||
    branchFilter !== "__all__";

  const clearFilters = useCallback(() => {
    setKeyword("");
    setDebouncedKeyword("");
    setStatusFilter("ALL");
    setBranchFilter("__all__");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchShopPromotions();
    if (!clientMode) fetchPromotions();
  }, [fetchShopPromotions, fetchPromotions, clientMode]);

  const handleOpenEdit = useCallback((promo) => {
    setEditingPromotion(promo);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (promo) => {
      const ok = await confirm(
        t("pages.promotions.list.deleteConfirm", { name: promo.name }),
        {
          title: t("pages.promotions.list.deleteTitle"),
          confirmText: t("pages.promotions.list.deleteConfirmBtn"),
          cancelText: t("pages.promotions.list.cancel"),
          variant: "destructive",
        },
      );
      if (!ok) return;

      setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
      setShopPromotions((prev) => prev.filter((p) => p.id !== promo.id));
      setTotalCount((c) => Math.max(0, c - 1));

      try {
        setIsSubmitting(true);
        const res = await deletePromotion(promo.id, shopId);
        if (res.data?.success) {
          toast.success(t("pages.promotions.list.deleteSuccess"));
          handleRefresh();
        } else {
          toast.error(
            res.data?.message || t("pages.promotions.list.deleteFail"),
          );
          handleRefresh();
        }
      } catch (err) {
        console.error("Delete promotion error:", err);
        toast.error(t("pages.promotions.list.deleteError"));
        handleRefresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirm, t, shopId, handleRefresh],
  );

  const renderPromotionActions = useCallback(
    (promo, { Item, Label, Separator }) => (
      <>
        <Label>{t("pages.promotions.list.actions")}</Label>
        <Separator />
        <Item
          onClick={(e) => {
            e?.stopPropagation?.();
            handleOpenEdit(promo);
          }}
        >
          {canUpdate
            ? t("pages.promotions.list.edit")
            : t("pages.promotions.list.viewDetail")}
        </Item>
        {canDelete && (
          <Item
            className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
            disabled={isSubmitting}
            onClick={(e) => {
              e?.stopPropagation?.();
              handleDelete(promo);
            }}
          >
            {t("pages.promotions.list.delete")}
            <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
              ⌘⌫
            </DropdownMenuShortcut>
          </Item>
        )}
      </>
    ),
    [t, canUpdate, canDelete, isSubmitting, handleOpenEdit, handleDelete],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.promotions.list.colName")}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium min-w-0 max-w-[200px] sm:max-w-none truncate">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.promotions.list.colPriority")}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-sm font-medium">
            {row.original.priority ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "discountType",
        header: t("pages.promotions.list.colDiscountType"),
        cell: ({ row }) => {
          const type = row.getValue("discountType");
          const value = row.original.discountValue;
          return (
            <div className="flex items-center gap-1.5 min-w-0 max-w-[100px] sm:max-w-none">
              {type !== "PERCENT" ? (
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-green-500" />
              ) : null}
              <DiscountValue
                type={type}
                value={value}
                numberLocale={numberLocale}
              />
            </div>
          );
        },
      },
      {
        accessorKey: "startDate",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.promotions.list.colStartDate")}
          />
        ),
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            {formatDate(row.getValue("startDate"), numberLocale)}
          </div>
        ),
      },
      {
        accessorKey: "endDate",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.promotions.list.colEndDate")}
          />
        ),
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            {formatDate(row.getValue("endDate"), numberLocale)}
          </div>
        ),
      },
      {
        id: "branch",
        header: t("pages.promotions.list.colScope"),
        cell: ({ row }) => {
          const bid = row.original.branchId;
          if (!bid) {
            return (
              <Badge variant="outline" className="text-xs gap-1 max-w-full">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {t("pages.promotions.list.scopeAllShop")}
                </span>
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="text-xs gap-1 max-w-full">
              <Warehouse className="h-3 w-3 shrink-0" />
              <span className="truncate">{branchMap[bid] || bid}</span>
            </Badge>
          );
        },
      },
      {
        id: "scope",
        header: t("pages.promotions.list.colProducts"),
        cell: ({ row }) => {
          const ids = row.original.applicableProductIds;
          if (!ids || ids.length === 0) {
            return (
              <Badge variant="outline" className="text-xs">
                {t("pages.promotions.list.scopeAllProducts")}
              </Badge>
            );
          }
          return (
            <Badge variant="secondary" className="text-xs">
              {t("pages.promotions.list.productCount", { count: ids.length })}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: t("pages.promotions.list.colStatus"),
        cell: ({ row }) => {
          const { label, variant } = getPromotionStatus(row.original, t);
          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const promo = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">
                    {t("pages.promotions.list.openMenu")}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                {renderPromotionActions(promo, {
                  Item: DropdownMenuItem,
                  Label: DropdownMenuLabel,
                  Separator: DropdownMenuSeparator,
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, numberLocale, branchMap, renderPromotionActions],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    manualPagination: true,
    manualSorting: !clientMode,
    pageCount,
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

  const emptyMessage =
    hasActiveFilters || clientMode
      ? t("pages.promotions.list.emptyFilter")
      : t("pages.promotions.list.empty");

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex min-w-0">
      <div className="flex flex-col gap-4 min-w-0">
        <ListPageHeader
          icon={Tag}
          title={t("pages.promotions.list.title")}
          subtitle={t("pages.promotions.list.subtitle")}
        />

        <PromotionListStatCards
          stats={stats}
          activeFilter={statusFilter}
          loading={summaryLoading && shopPromotions.length === 0}
          numberLocale={numberLocale}
          onFilterChange={(key) => {
            setStatusFilter(key);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={listSearchWrap}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.promotions.list.searchPlaceholder")}
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            {branches?.length > 0 && (
              <Select
                value={branchFilter}
                onValueChange={(v) => {
                  setBranchFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className={listBranchSelectWrap}>
                  <Warehouse className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">
                    {t("pages.promotions.list.allScopes")}
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className={listToolbarActions}>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("pages.promotions.list.clearFilters")}
                </span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleRefresh}
              disabled={loading || summaryLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading || summaryLoading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {t("pages.promotions.list.refresh")}
              </span>
            </Button>
            <DataTableViewOptions table={table} />
            {canCreate && (
              <Button
                variant="success"
                size="sm"
                className="cursor-pointer gap-1.5"
                onClick={() => {
                  setEditingPromotion(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("pages.promotions.list.addPromotion")}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className={dataTableContainer}>
          {loading && tableData.length > 0 && (
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
              {(loading || summaryLoading) && tableData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("pages.promotions.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const promo = row.original;
                  const rowEl = (
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                      onClick={() => handleOpenEdit(promo)}
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
                    <ContextMenu key={row.id}>
                      <ContextMenuTrigger asChild>{rowEl}</ContextMenuTrigger>
                      <ContextMenuContent className="min-w-[12rem] bg-background w-48">
                        {renderPromotionActions(promo, {
                          Item: ContextMenuItem,
                          Label: ContextMenuLabel,
                          Separator: ContextMenuSeparator,
                        })}
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="h-8 w-8 text-muted-foreground/40" />
                      <span>{emptyMessage}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      <PromotionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        promotion={editingPromotion}
        shopId={shopId}
        branches={branches}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default PromotionListPage;
