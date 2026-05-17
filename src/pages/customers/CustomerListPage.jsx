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
  Users,
  Warehouse,
  Download,
  Search,
  Mail,
  Phone,
  MapPin,
  Star,
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
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { CustomerListStatCards } from "@/components/customers/CustomerListStatCards.jsx";
import {
  dataTableContainer,
  listBranchSelectWrap,
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";

import {
  getCustomers,
  deleteCustomer,
  exportCustomers,
} from "../../api/customerApi.js";
import CustomerFormModal from "./CustomerFormModal.jsx";

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

const matchCustomerSegment = (customer, segment) => {
  if (segment === "ALL") return true;
  if (segment === "WITH_PHONE") return Boolean(customer.phone?.trim());
  if (segment === "WITH_EMAIL") return Boolean(customer.email?.trim());
  if (segment === "LOYALTY") return (customer.loyaltyPoints ?? 0) > 0;
  return true;
};

const CustomerListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { selectedShopId, branches } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const shopId = selectedShopId;
  const canManage = hasShopPermission(PERM.CUSTOMER_UPDATE);
  const canDelete = hasShopPermission(PERM.CUSTOMER_DELETE);
  const { confirm } = useAlertDialog();
  const debounceRef = useRef(null);

  const branchMap = useMemo(() => {
    const map = {};
    branches?.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  const [customers, setCustomers] = useState([]);
  const [shopCustomers, setShopCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  const clientMode = segmentFilter !== "ALL";

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
        email: w >= 768,
        address: w >= 1024,
        branch: w >= 768,
        createdAt: w >= 1280,
      });
    };
    applyColumnVisibility();
    window.addEventListener("resize", applyColumnVisibility);
    return () => window.removeEventListener("resize", applyColumnVisibility);
  }, []);

  const fetchShopCustomers = useCallback(async () => {
    if (!shopId) return;
    setSummaryLoading(true);
    try {
      const params = { page: 0, size: 500, sortBy: "createdAt", sortDir: "desc" };
      if (branchFilter !== "__all__") params.branchId = branchFilter;
      const res = await getCustomers(shopId, params);
      const data = res.data?.data;
      const list =
        data && typeof data === "object" && "content" in data
          ? (data.content ?? [])
          : Array.isArray(data)
            ? data
            : [];
      setShopCustomers(list);
    } catch {
      setShopCustomers([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [shopId, branchFilter]);

  const fetchCustomers = useCallback(async () => {
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
      if (debouncedKeyword.trim()) {
        params.keyword = debouncedKeyword.trim();
      }
      if (sorting.length > 0) {
        params.sortBy = sorting[0].id;
        params.sortDir = sorting[0].desc ? "desc" : "asc";
      }
      const res = await getCustomers(shopId, params);
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setCustomers(data.content ?? []);
        setTotalCount(data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setCustomers(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error("Fetch customers error:", err);
      toast.error(t("pages.customers.list.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, sorting, branchFilter, debouncedKeyword, clientMode, t]);

  useEffect(() => {
    fetchShopCustomers();
  }, [fetchShopCustomers]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const stats = useMemo(() => {
    let withPhone = 0;
    let withEmail = 0;
    let loyalty = 0;
    for (const c of shopCustomers) {
      if (c.phone?.trim()) withPhone += 1;
      if (c.email?.trim()) withEmail += 1;
      if ((c.loyaltyPoints ?? 0) > 0) loyalty += 1;
    }
    return {
      total: shopCustomers.length,
      withPhone,
      withEmail,
      loyalty,
    };
  }, [shopCustomers]);

  const filteredList = useMemo(() => {
    let list = shopCustomers.filter((c) => matchCustomerSegment(c, segmentFilter));
    const kw = debouncedKeyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(kw) ||
          c.phone?.toLowerCase().includes(kw) ||
          c.email?.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [shopCustomers, segmentFilter, debouncedKeyword]);

  const tableData = useMemo(() => {
    if (!clientMode) return customers;
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [
    clientMode,
    customers,
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
    return Math.max(1, Math.ceil(totalCount / pagination.pageSize) || 1);
  }, [clientMode, filteredList.length, pagination.pageSize, totalCount]);

  const hasActiveFilters =
    segmentFilter !== "ALL" ||
    Boolean(debouncedKeyword.trim()) ||
    branchFilter !== "__all__";

  const clearFilters = useCallback(() => {
    setKeyword("");
    setDebouncedKeyword("");
    setSegmentFilter("ALL");
    setBranchFilter("__all__");
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchShopCustomers();
    if (!clientMode) fetchCustomers();
  }, [fetchShopCustomers, fetchCustomers, clientMode]);

  const handleDelete = useCallback(
    async (cust) => {
      const ok = await confirm(
        t("pages.customers.list.deleteConfirm", { name: cust.name }),
        {
          title: t("pages.customers.list.deleteTitle"),
          confirmText: t("pages.customers.list.deleteConfirmBtn"),
          cancelText: t("pages.customers.list.cancel"),
          variant: "destructive",
        },
      );
      if (!ok) return;

      setCustomers((prev) => prev.filter((c) => c.id !== cust.id));
      setShopCustomers((prev) => prev.filter((c) => c.id !== cust.id));
      setTotalCount((c) => Math.max(0, c - 1));

      try {
        setIsSubmitting(true);
        const res = await deleteCustomer(cust.id, shopId, cust.branchId);
        if (res.data?.success) {
          toast.success(t("pages.customers.list.deleteSuccess"));
          handleRefresh();
        } else {
          toast.error(res.data?.message || t("pages.customers.list.deleteFail"));
          handleRefresh();
        }
      } catch (err) {
        console.error("Delete customer error:", err);
        toast.error(t("pages.customers.list.deleteError"));
        handleRefresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirm, t, shopId, handleRefresh],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (branchFilter !== "__all__") params.branchId = branchFilter;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      const res = await exportCustomers(shopId, params);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "customers.xlsx";
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success(t("pages.customers.list.exportSuccess"));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("pages.customers.list.exportFail"));
    } finally {
      setExporting(false);
    }
  };

  const handleOpenEdit = useCallback((cust) => {
    setEditingCustomer(cust);
    setModalOpen(true);
  }, []);

  const renderCustomerActions = useCallback(
    (cust, { Item, Label, Separator }) => (
      <>
        <Label>{t("pages.customers.list.actions")}</Label>
        <Separator />
        <Item
          onClick={(e) => {
            e?.stopPropagation?.();
            handleOpenEdit(cust);
          }}
        >
          {canManage
            ? t("pages.customers.list.edit")
            : t("pages.customers.list.viewDetail")}
        </Item>
        {canDelete && (
          <Item
            className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
            disabled={isSubmitting}
            onClick={(e) => {
              e?.stopPropagation?.();
              handleDelete(cust);
            }}
          >
            {t("pages.customers.list.delete")}
            <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
              ⌘⌫
            </DropdownMenuShortcut>
          </Item>
        )}
      </>
    ),
    [t, canManage, canDelete, isSubmitting, handleOpenEdit, handleDelete],
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.customers.list.colName")}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium min-w-0 max-w-[160px] sm:max-w-none truncate">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: t("pages.customers.list.colPhone"),
        cell: ({ row }) => {
          const val = row.getValue("phone");
          return val ? (
            <div className="flex items-center gap-1.5 text-sm min-w-0">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{val}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        accessorKey: "email",
        header: t("pages.customers.list.colEmail"),
        cell: ({ row }) => {
          const val = row.getValue("email");
          return val ? (
            <div className="flex items-center gap-1.5 text-sm min-w-0 max-w-[180px]">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{val}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        accessorKey: "address",
        header: t("pages.customers.list.colAddress"),
        cell: ({ row }) => {
          const val = row.getValue("address");
          return val ? (
            <div className="flex items-center gap-1.5 text-sm min-w-0 max-w-[200px]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{val}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          );
        },
      },
      {
        id: "branch",
        header: t("pages.customers.list.colBranch"),
        cell: ({ row }) => {
          const bid = row.original.branchId;
          if (!bid)
            return <span className="text-muted-foreground text-sm">-</span>;
          return (
            <Badge variant="secondary" className="text-xs gap-1 max-w-full">
              <Warehouse className="h-3 w-3 shrink-0" />
              <span className="truncate">{branchMap[bid] || bid}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: "loyaltyPoints",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.customers.list.colLoyaltyPoints")}
          />
        ),
        cell: ({ row }) => {
          const points = row.getValue("loyaltyPoints") ?? 0;
          return (
            <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500 fill-yellow-500" />
              <span className="font-medium tabular-nums">
                {points.toLocaleString(numberLocale)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.customers.list.colCreatedAt")}
          />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(row.getValue("createdAt"), numberLocale)}
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const cust = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">
                    {t("pages.customers.list.openMenu")}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                {renderCustomerActions(cust, {
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
    [t, numberLocale, branchMap, renderCustomerActions],
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
      ? t("pages.customers.list.emptyFilter")
      : t("pages.customers.list.empty");

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4 min-w-0">
        <ListPageHeader
          icon={Users}
          title={t("pages.customers.list.title")}
          subtitle={t("pages.customers.list.subtitle")}
        />

        <CustomerListStatCards
          stats={stats}
          activeFilter={segmentFilter}
          loading={summaryLoading && shopCustomers.length === 0}
          numberLocale={numberLocale}
          onFilterChange={(key) => {
            setSegmentFilter(key);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        />

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={listSearchWrap}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.customers.list.searchPlaceholder")}
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
                    {t("pages.customers.list.allBranches")}
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
                  {t("pages.customers.list.clearFilters")}
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
                {t("pages.customers.list.refresh")}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="gap-1.5 shrink-0"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {t("pages.customers.list.exportExcel")}
              </span>
            </Button>
            <DataTableViewOptions table={table} />
            {canManage && (
              <Button
                variant="success"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => {
                  setEditingCustomer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("pages.customers.list.addCustomer")}
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
                    {t("pages.customers.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const cust = row.original;
                  const rowEl = (
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                      onClick={() => handleOpenEdit(cust)}
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
                        {renderCustomerActions(cust, {
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
                      <Users className="h-8 w-8 text-muted-foreground/40" />
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

      <CustomerFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        customer={editingCustomer}
        shopId={shopId}
        branches={branches}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default CustomerListPage;
