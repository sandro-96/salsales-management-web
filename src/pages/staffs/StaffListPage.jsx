import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  listInputGrow,
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

  const [staffList, setStaffList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  // Init from deeplink to avoid double-fetch/flicker on first render
  const [branchFilter, setBranchFilter] = useState(() => {
    const bid = searchParams.get("branchId");
    return bid && String(bid).trim() ? String(bid).trim() : "__all__";
  });

  // Branch deeplink: /staffs?branchId=...
  useEffect(() => {
    const bid = searchParams.get("branchId");
    if (!bid) return;
    if (branchFilter === bid) return;
    setBranchFilter(bid);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, branches]);

  // If deeplink branchId is invalid for current shop, fall back to all
  useEffect(() => {
    if (branchFilter === "__all__") return;
    if (!Array.isArray(branches) || branches.length === 0) return;
    const ok = branches.some((b) => b.id === branchFilter);
    if (!ok) setBranchFilter("__all__");
  }, [branches, branchFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchStaff = useCallback(async () => {
    if (!shopId) return;
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
  }, [shopId, pagination, debouncedKeyword, branchFilter, t]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (staff) => {
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
          fetchStaff();
        } else {
          toast.error(res.data?.message || t("pages.staffs.list.deleteFail"));
        }
      } else {
        const res = await removeStaff(shopId, staff.userId);
        if (res.data?.success) {
          toast.success(t("pages.staffs.list.deleteSuccess"));
          fetchStaff();
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
  };

  const handleOpenEdit = (staff) => {
    if (staff.role === "OWNER") return;
    if (staff.external) {
      handleOpenProfile(staff);
      return;
    }
    setEditingStaff(staff);
    setEditModalOpen(true);
  };

  const handleOpenProfile = (staff) => {
    setEditingStaff(staff);
    setProfileModalOpen(true);
  };

  const handleNavigateOverview = (staff) => {
    if (!staff) return;
    const id = staff.external ? staff.id : staff.userId;
    if (!id) return;
    navigate(`/staffs/${id}`);
  };

  const handleExportProfiles = async () => {
    if (!shopId) return;
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
    }
  };

  const columns = useMemo(
    () => [
    {
      id: "avatar",
      header: "",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex items-center justify-center">
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
        <DataTableColumnHeader column={column} title={t("pages.staffs.list.colFullName")} />
      ),
      cell: ({ row }) => (
        <div className="font-medium min-w-[140px]">
          {row.getValue("fullName") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("pages.staffs.list.colEmail")} />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground min-w-[180px]">
          {row.getValue("email") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("pages.staffs.list.colPhone"),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("phone") || "-"}</div>
      ),
    },
    {
      accessorKey: "position",
      header: t("pages.staffs.list.colPosition"),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("position") || "-"}</div>
      ),
    },
    {
      accessorKey: "department",
      header: t("pages.staffs.list.colDepartment"),
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("department") || "-"}</div>
      ),
    },
    {
      accessorKey: "branchId",
      header: t("pages.staffs.list.colBranch"),
      cell: ({ row }) => {
        const bid = row.getValue("branchId");
        return (
          <div className="text-sm">
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
            <Badge variant="secondary" className="gap-1 whitespace-nowrap">
              {t("pages.staffs.list.externalBadge")}
            </Badge>
          );
        }
        const role = row.getValue("role");
        return (
          <Badge
            variant={SHOP_ROLE_BADGE_VARIANT[role] || "outline"}
            className="gap-1"
          >
            <Shield className="h-3 w-3" />
            {getShopRoleLabel(t, role) || role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t("pages.staffs.list.colCreatedAt")} />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("createdAt"), numberLocale)}</div>
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
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t("pages.staffs.list.openMenu")}</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuLabel>{t("pages.staffs.list.actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateOverview(staff);
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t("pages.staffs.list.viewDetail")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenProfile(staff);
                }}
              >
                <FileUser className="h-4 w-4 mr-2" />
                {t("pages.staffs.list.quickEditProfile")}
              </DropdownMenuItem>
              {!staff.external && canManageStaff && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(staff);
                  }}
                >
                  {t("pages.staffs.list.editRolePermissions")}
                </DropdownMenuItem>
              )}
              {canManageStaff && (
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(staff);
                  }}
                >
                  {t("pages.staffs.list.delete")}
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
    [t, numberLocale, branchMap, canManageStaff, isSubmitting],
  );

  const table = useReactTable({
    data: staffList,
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
              {t("pages.staffs.list.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("pages.staffs.list.subtitle")}
            </p>
          </div>
        </div>

        <div className={listToolbarRoot}>
          <div className={listToolbarFilters}>
            <Input
              placeholder={t("pages.staffs.list.searchPlaceholder")}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={listInputGrow}
            />
            {branches?.length > 1 && (
              <Select
                value={branchFilter}
                onValueChange={(v) => {
                  setBranchFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className={listBranchSelectWrap}>
                  <SelectValue placeholder={t("pages.staffs.list.allBranches")} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">{t("pages.staffs.list.allBranches")}</SelectItem>
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
            {canManageStaff && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => navigate("/staffs/dashboard")}
              >
                <BarChart3 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("pages.staffs.list.overview")}</span>
              </Button>
            )}
            {canManageStaff && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={handleExportProfiles}
              >
                <FileDown className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("pages.staffs.list.exportExcel")}</span>
              </Button>
            )}
            {canManageStaff && (
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => setAddExternalModalOpen(true)}
              >
                <UserPlus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("pages.staffs.list.addExternal")}</span>
              </Button>
            )}
            {canManageStaff && (
              <Button
                variant="success"
                size="sm"
                className="cursor-pointer"
                onClick={() => setAddModalOpen(true)}
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">{t("pages.staffs.list.addStaff")}</span>
              </Button>
            )}
          </div>
        </div>

        <div className={dataTableContainer}>
          {loading && staffList.length > 0 && (
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
              {loading && staffList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("pages.staffs.list.loading")}
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => handleNavigateOverview(row.original)}
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
                      <span>{t("pages.staffs.list.empty")}</span>
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
        onSuccess={fetchStaff}
      />

      <StaffProfileModal
        open={addExternalModalOpen}
        onClose={() => setAddExternalModalOpen(false)}
        staff={null}
        shopId={shopId}
        onSuccess={fetchStaff}
        isNewExternal
      />

      <EditStaffModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        staff={editingStaff}
        shopId={shopId}
        onSuccess={fetchStaff}
      />

      <StaffProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        staff={editingStaff}
        shopId={shopId}
        onSuccess={fetchStaff}
      />
    </div>
  );
};

export default StaffListPage;
