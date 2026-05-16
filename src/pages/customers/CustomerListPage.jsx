import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  dataTableContainer,
  listBranchSelectWrap,
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";

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

const CustomerListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const { selectedShopId, branches } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const shopId = selectedShopId;
  const canManage = hasShopPermission(PERM.CUSTOMER_UPDATE);
  const canDelete = hasShopPermission(PERM.CUSTOMER_DELETE);
  const { confirm } = useAlertDialog();

  const branchMap = useMemo(() => {
    const map = {};
    branches?.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [branches]);

  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchCustomers = useCallback(async () => {
    if (!shopId) return;
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
  }, [shopId, pagination, sorting, branchFilter, debouncedKeyword, t]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async (cust) => {
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
    setTotalCount((c) => c - 1);

    try {
      setIsSubmitting(true);
      const res = await deleteCustomer(cust.id, shopId, cust.branchId);
      if (res.data?.success) {
        toast.success(t("pages.customers.list.deleteSuccess"));
        fetchCustomers();
      } else {
        toast.error(res.data?.message || t("pages.customers.list.deleteFail"));
        fetchCustomers();
      }
    } catch (err) {
      console.error("Delete customer error:", err);
      toast.error(t("pages.customers.list.deleteError"));
      fetchCustomers();
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setModalOpen(true);
  };

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
        <div className="font-medium min-w-[140px]">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("pages.customers.list.colPhone"),
      cell: ({ row }) => {
        const val = row.getValue("phone");
        return val ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            {val}
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
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate max-w-[180px]">{val}</span>
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
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate max-w-[200px]">{val}</span>
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
          <Badge variant="secondary" className="text-xs gap-1">
            <Warehouse className="h-3 w-3" />
            {branchMap[bid] || bid}
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
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">
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
        <div className="text-sm text-muted-foreground">
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">
                  {t("pages.customers.list.openMenu")}
                </span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuLabel>
                {t("pages.customers.list.actions")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(cust);
                }}
              >
                {canManage
                  ? t("pages.customers.list.edit")
                  : t("pages.customers.list.viewDetail")}
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(cust);
                  }}
                >
                  {t("pages.customers.list.delete")}
                  <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                    ⌘⌫
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ],
    [
      t,
      numberLocale,
      branchMap,
      canManage,
      canDelete,
      isSubmitting,
    ],
  );

  const table = useReactTable({
    data: customers,
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
    <div className="h-full min-w-0 flex-1 flex-col gap-8 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("pages.customers.list.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pages.customers.list.subtitle")}
            </p>
          </div>
        </div>

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <div className={listSearchWrap}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={t("pages.customers.list.searchPlaceholder")}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-8 w-full"
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
            <DataTableViewOptions table={table} />
          </div>
          <div className={listToolbarActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="cursor-pointer"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin sm:mr-1" />
              ) : (
                <Download className="h-4 w-4 sm:mr-1" />
              )}
              <span className="hidden sm:inline">
                {t("pages.customers.list.exportExcel")}
              </span>
            </Button>
            {canManage && (
              <Button
                variant="success"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setEditingCustomer(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">
                  {t("pages.customers.list.addCustomer")}
                </span>
              </Button>
            )}
          </div>
        </div>

        <div className={dataTableContainer}>
          {loading && customers.length > 0 && (
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
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("pages.customers.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => handleOpenEdit(row.original)}
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
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/40" />
                      <span>{t("pages.customers.list.empty")}</span>
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
        onSuccess={fetchCustomers}
      />
    </div>
  );
};

export default CustomerListPage;
