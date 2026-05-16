import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useShop } from "../../hooks/useShop.js";
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
  BarChart3,
  Eye,
  MoreHorizontal,
  Plus,
  Loader2,
  Users,
  Shield,
  FileDown,
  FileUser,
  UserPlus,
  Search,
  RefreshCw,
  X,
  Warehouse,
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
import { StaffListStatCards } from "@/components/staffs/StaffListStatCards.jsx";
import {
  dataTableContainer,
  listBranchSelectWrap,
  listSearchWrap,
  listToolbarActions,
  listToolbarFilters,
  listToolbarRoot,
} from "@/components/table/listPageLayout.js";

import { removeStaff } from "../../api/staffApi.js";
import {
  getAllStaff,
  exportStaffProfiles,
  deleteExternalProfile,
} from "../../api/staffProfileApi.js";
import AddStaffModal from "./AddStaffModal.jsx";
import EditStaffModal from "./EditStaffModal.jsx";
import StaffProfileModal from "./StaffProfileModal.jsx";
import { SHOP_ROLE_BADGE_VARIANT } from "../../constants/shopRoles.js";
import { getShopRoleLabel } from "@/utils/shopLabels";

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

const matchStaffSegment = (staff, segment) => {
  if (segment === "ALL") return true;
  if (segment === "INTERNAL") return !staff.external;
  if (segment === "EXTERNAL") return Boolean(staff.external);
  if (segment === "MANAGER") {
    const role = staff.role;
    return role === "MANAGER" || role === "OWNER";
  }
  return true;
};

const StaffListPage = () => {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language?.startsWith("en") ? "en-US" : "vi-VN";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedShopId, branches, isOwner, shopRole } = useShop();
  const shopId = selectedShopId;
  const canManageStaff = isOwner || shopRole === "MANAGER";
  const branchMap = Object.fromEntries(
    (branches || []).map((b) => [b.id, b.name]),
  );
  const { confirm } = useAlertDialog();
  const debounceRef = useRef(null);

  const [staffList, setStaffList] = useState([]);
  const [shopStaff, setShopStaff] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addExternalModalOpen, setAddExternalModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState(() => {
    const bid = searchParams.get("branchId");
    return bid && String(bid).trim() ? String(bid).trim() : "__all__";
  });

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
    const bid = searchParams.get("branchId");
    if (!bid) return;
    if (branchFilter === bid) return;
    setBranchFilter(bid);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, branches]);

  useEffect(() => {
    if (branchFilter === "__all__") return;
    if (!Array.isArray(branches) || branches.length === 0) return;
    const ok = branches.some((b) => b.id === branchFilter);
    if (!ok) setBranchFilter("__all__");
  }, [branches, branchFilter]);

  useEffect(() => {
    const applyColumnVisibility = () => {
      const w = window.innerWidth;
      setColumnVisibility({
        phone: w >= 640,
        position: w >= 768,
        department: w >= 1024,
        branchId: w >= 768,
        createdAt: w >= 1280,
      });
    };
    applyColumnVisibility();
    window.addEventListener("resize", applyColumnVisibility);
    return () => window.removeEventListener("resize", applyColumnVisibility);
  }, []);

  const fetchShopStaff = useCallback(async () => {
    if (!shopId) return;
    setSummaryLoading(true);
    try {
      const params = { page: 0, size: 500 };
      if (branchFilter !== "__all__") params.branchId = branchFilter;
      const res = await getAllStaff(shopId, params);
      const data = res.data?.data;
      const list =
        data && typeof data === "object" && "content" in data
          ? (data.content ?? [])
          : Array.isArray(data)
            ? data
            : [];
      setShopStaff(list);
    } catch {
      setShopStaff([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [shopId, branchFilter]);

  const fetchStaff = useCallback(async () => {
    if (!shopId || clientMode) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
      };
      if (debouncedKeyword.trim()) {
        params.keyword = debouncedKeyword.trim();
      }
      if (branchFilter !== "__all__") {
        params.branchId = branchFilter;
      }
      const res = await getAllStaff(shopId, params);
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setStaffList(data.content ?? []);
        setTotalCount(data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setStaffList(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error("Fetch staff error:", err);
      toast.error(t("pages.staffs.list.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, debouncedKeyword, branchFilter, clientMode, t]);

  useEffect(() => {
    fetchShopStaff();
  }, [fetchShopStaff]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const stats = useMemo(() => {
    let internal = 0;
    let external = 0;
    let manager = 0;
    for (const s of shopStaff) {
      if (s.external) external += 1;
      else internal += 1;
      if (s.role === "MANAGER" || s.role === "OWNER") manager += 1;
    }
    return {
      total: shopStaff.length,
      internal,
      external,
      manager,
    };
  }, [shopStaff]);

  const filteredList = useMemo(() => {
    let list = shopStaff.filter((s) => matchStaffSegment(s, segmentFilter));
    const kw = debouncedKeyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(kw) ||
          s.email?.toLowerCase().includes(kw) ||
          s.phone?.toLowerCase().includes(kw) ||
          s.position?.toLowerCase().includes(kw) ||
          s.department?.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [shopStaff, segmentFilter, debouncedKeyword]);

  const tableData = useMemo(() => {
    if (!clientMode) return staffList;
    const start = pagination.pageIndex * pagination.pageSize;
    return filteredList.slice(start, start + pagination.pageSize);
  }, [
    clientMode,
    staffList,
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
    fetchShopStaff();
    if (!clientMode) fetchStaff();
  }, [fetchShopStaff, fetchStaff, clientMode]);

  const handleDelete = useCallback(
    async (staff) => {
      if (staff.role === "OWNER") {
        toast.error(t("pages.staffs.list.deleteOwnerError"));
        return;
      }

      const label =
        staff.fullName || staff.email || t("pages.staffs.list.defaultStaffLabel");
      const ok = await confirm(
        t("pages.staffs.list.deleteConfirm", { label }),
        {
          title: t("pages.staffs.list.deleteTitle"),
          confirmText: t("pages.staffs.list.deleteConfirmBtn"),
          cancelText: t("pages.staffs.list.cancel"),
          variant: "destructive",
        },
      );
      if (!ok) return;

      try {
        setIsSubmitting(true);
        if (staff.external && staff.id) {
          const res = await deleteExternalProfile(shopId, staff.id);
          if (res.data?.success) {
            toast.success(t("pages.staffs.list.deleteSuccess"));
            handleRefresh();
          } else {
            toast.error(res.data?.message || t("pages.staffs.list.deleteFail"));
          }
        } else {
          const res = await removeStaff(shopId, staff.userId);
          if (res.data?.success) {
            toast.success(t("pages.staffs.list.deleteSuccess"));
            handleRefresh();
          } else {
            toast.error(res.data?.message || t("pages.staffs.list.deleteFail"));
          }
        }
      } catch (err) {
        console.error("Remove staff error:", err);
        toast.error(
          err.response?.data?.message || t("pages.staffs.list.deleteError"),
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirm, t, shopId, handleRefresh],
  );

  const handleOpenEdit = useCallback((staff) => {
    if (staff.role === "OWNER") return;
    if (staff.external) {
      setEditingStaff(staff);
      setProfileModalOpen(true);
      return;
    }
    setEditingStaff(staff);
    setEditModalOpen(true);
  }, []);

  const handleOpenProfile = useCallback((staff) => {
    setEditingStaff(staff);
    setProfileModalOpen(true);
  }, []);

  const handleNavigateOverview = useCallback(
    (staff) => {
      if (!staff) return;
      const id = staff.external ? staff.id : staff.userId;
      if (!id) return;
      navigate(`/staffs/${id}`);
    },
    [navigate],
  );

  const handleExportProfiles = async () => {
    if (!shopId) return;
    setExporting(true);
    try {
      const res = await exportStaffProfiles(shopId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "staff_profiles.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t("pages.staffs.list.exportSuccess"));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("pages.staffs.list.exportFail"));
    } finally {
      setExporting(false);
    }
  };

  const renderStaffActions = useCallback(
    (staff, { Item, Label, Separator }) => {
      const isOwner = !staff.external && staff.role === "OWNER";
      return (
        <>
          <Label>{t("pages.staffs.list.actions")}</Label>
          <Separator />
          <Item
            onClick={(e) => {
              e?.stopPropagation?.();
              handleNavigateOverview(staff);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t("pages.staffs.list.viewDetail")}
          </Item>
          <Item
            onClick={(e) => {
              e?.stopPropagation?.();
              handleOpenProfile(staff);
            }}
          >
            <FileUser className="h-4 w-4 mr-2" />
            {t("pages.staffs.list.quickEditProfile")}
          </Item>
          {!staff.external && !isOwner && canManageStaff && (
            <Item
              onClick={(e) => {
                e?.stopPropagation?.();
                handleOpenEdit(staff);
              }}
            >
              {t("pages.staffs.list.editRolePermissions")}
            </Item>
          )}
          {canManageStaff && !isOwner && (
            <Item
              className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
              disabled={isSubmitting}
              onClick={(e) => {
                e?.stopPropagation?.();
                handleDelete(staff);
              }}
            >
              {t("pages.staffs.list.delete")}
              <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                ⌘⌫
              </DropdownMenuShortcut>
            </Item>
          )}
        </>
      );
    },
    [
      t,
      canManageStaff,
      isSubmitting,
      handleNavigateOverview,
      handleOpenProfile,
      handleOpenEdit,
      handleDelete,
    ],
  );

  const columns = useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        enableHiding: false,
        cell: ({ row }) => {
          const staff = row.original;
          return (
            <div className="flex items-center justify-center shrink-0">
              {staff.avatarUrl ? (
                <img
                  src={staff.avatarUrl}
                  alt={staff.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {(staff.fullName || staff.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
          );
        },
        size: 50,
      },
      {
        accessorKey: "fullName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.staffs.list.colFullName")}
          />
        ),
        cell: ({ row }) => (
          <div className="font-medium min-w-0 max-w-[160px] sm:max-w-none truncate">
            {row.getValue("fullName") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.staffs.list.colEmail")}
          />
        ),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground min-w-0 max-w-[180px] truncate">
            {row.getValue("email") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: t("pages.staffs.list.colPhone"),
        cell: ({ row }) => (
          <div className="text-sm whitespace-nowrap">
            {row.getValue("phone") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "position",
        header: t("pages.staffs.list.colPosition"),
        cell: ({ row }) => (
          <div className="text-sm truncate max-w-[120px]">
            {row.getValue("position") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: t("pages.staffs.list.colDepartment"),
        cell: ({ row }) => (
          <div className="text-sm truncate max-w-[120px]">
            {row.getValue("department") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "branchId",
        header: t("pages.staffs.list.colBranch"),
        cell: ({ row }) => {
          const bid = row.getValue("branchId");
          return (
            <div className="text-sm truncate max-w-[100px]">
              {bid ? branchMap[bid] || bid : "-"}
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: t("pages.staffs.list.colType"),
        cell: ({ row }) => {
          const staff = row.original;
          if (staff.external) {
            return (
              <Badge variant="secondary" className="gap-1 whitespace-nowrap text-xs">
                {t("pages.staffs.list.externalBadge")}
              </Badge>
            );
          }
          const role = row.getValue("role");
          return (
            <Badge
              variant={SHOP_ROLE_BADGE_VARIANT[role] || "outline"}
              className="gap-1 text-xs whitespace-nowrap"
            >
              <Shield className="h-3 w-3 shrink-0" />
              {getShopRoleLabel(t, role) || role}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.staffs.list.colCreatedAt")}
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
          const staff = row.original;
          if (!staff.external && staff.role === "OWNER") return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onContextMenu={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">
                    {t("pages.staffs.list.openMenu")}
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-52">
                {renderStaffActions(staff, {
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
    [t, numberLocale, branchMap, renderStaffActions],
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
      ? t("pages.staffs.list.emptyFilter")
      : t("pages.staffs.list.empty");

  return (
    <div className="h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4 min-w-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
            {t("pages.staffs.list.title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pages.staffs.list.subtitle")}
          </p>
        </div>

        <StaffListStatCards
          stats={stats}
          activeFilter={segmentFilter}
          loading={summaryLoading && shopStaff.length === 0}
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
                placeholder={t("pages.staffs.list.searchPlaceholder")}
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
            {branches?.length > 1 && (
              <Select
                value={branchFilter}
                onValueChange={(v) => {
                  setBranchFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className={listBranchSelectWrap}>
                  <Warehouse className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder={t("pages.staffs.list.allBranches")} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">
                    {t("pages.staffs.list.allBranches")}
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
                  {t("pages.staffs.list.clearFilters")}
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
                {t("pages.staffs.list.refresh")}
              </span>
            </Button>
            <DataTableViewOptions table={table} />
            {canManageStaff && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => navigate("/staffs/dashboard")}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("pages.staffs.list.overview")}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleExportProfiles}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {t("pages.staffs.list.exportExcel")}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setAddExternalModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("pages.staffs.list.addExternal")}
                  </span>
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={() => setAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("pages.staffs.list.addStaff")}
                  </span>
                </Button>
              </>
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
                    {t("pages.staffs.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const staff = row.original;
                  const rowEl = (
                    <TableRow
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer"
                      onClick={() => handleNavigateOverview(staff)}
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
                      <ContextMenuContent className="min-w-[12rem] bg-background w-52">
                        {renderStaffActions(staff, {
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

      <AddStaffModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        shopId={shopId}
        onSuccess={handleRefresh}
      />

      <StaffProfileModal
        open={addExternalModalOpen}
        onClose={() => setAddExternalModalOpen(false)}
        staff={null}
        shopId={shopId}
        onSuccess={handleRefresh}
        isNewExternal
      />

      <EditStaffModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        staff={editingStaff}
        shopId={shopId}
        onSuccess={handleRefresh}
      />

      <StaffProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        staff={editingStaff}
        shopId={shopId}
        onSuccess={handleRefresh}
      />
    </div>
  );
};

export default StaffListPage;
