import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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

import { removeStaff } from "../../api/staffApi.js";
import {
  getAllStaff,
  exportStaffProfiles,
  deleteExternalProfile,
} from "../../api/staffProfileApi.js";
import AddStaffModal from "./AddStaffModal.jsx";
import EditStaffModal from "./EditStaffModal.jsx";
import StaffProfileModal from "./StaffProfileModal.jsx";
import {
  SHOP_ROLE_BADGE_VARIANT,
  SHOP_ROLE_LABELS,
} from "../../constants/shopRoles.js";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const StaffListPage = () => {
  const [searchParams] = useSearchParams();
  const { selectedShopId, branches } = useShop();
  const shopId = selectedShopId;
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
      toast.error("Không thể tải danh sách nhân viên.");
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, debouncedKeyword, branchFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (staff) => {
    if (staff.role === "OWNER") {
      toast.error("Không thể xóa chủ cửa hàng.");
      return;
    }

    const label = staff.fullName || staff.email || "nhân viên";
    const ok = await confirm(`Bạn có chắc muốn xóa "${label}" không?`, {
      title: "Xóa nhân viên",
      confirmText: "Xóa",
      cancelText: "Hủy",
      variant: "destructive",
    });
    if (!ok) return;

    try {
      setIsSubmitting(true);
      if (staff.external && staff.id) {
        const res = await deleteExternalProfile(shopId, staff.id);
        if (res.data?.success) {
          toast.success("Xóa nhân viên thành công.");
          fetchStaff();
        } else {
          toast.error(res.data?.message || "Xóa nhân viên thất bại.");
        }
      } else {
        const res = await removeStaff(shopId, staff.userId);
        if (res.data?.success) {
          toast.success("Xóa nhân viên thành công.");
          fetchStaff();
        } else {
          toast.error(res.data?.message || "Xóa nhân viên thất bại.");
        }
      }
    } catch (err) {
      console.error("Remove staff error:", err);
      toast.error(
        err.response?.data?.message || "Đã xảy ra lỗi khi xóa nhân viên.",
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
      toast.success("Xuất file Excel thành công.");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Không thể xuất file Excel.");
    }
  };

  const columns = [
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
        <DataTableColumnHeader column={column} title="Họ tên" />
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
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground min-w-[180px]">
          {row.getValue("email") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Số điện thoại",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("phone") || "-"}</div>
      ),
    },
    {
      accessorKey: "position",
      header: "Vị trí",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("position") || "-"}</div>
      ),
    },
    {
      accessorKey: "department",
      header: "Phòng ban",
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue("department") || "-"}</div>
      ),
    },
    {
      accessorKey: "branchId",
      header: "Chi nhánh",
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
      header: "Loại",
      cell: ({ row }) => {
        const staff = row.original;
        if (staff.external) {
          return (
            <Badge variant="secondary" className="gap-1 whitespace-nowrap">
              Ngoài HT
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
            {SHOP_ROLE_LABELS[role] || role}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày tạo" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("createdAt"))}</div>
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
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenProfile(staff);
                }}
              >
                <FileUser className="h-4 w-4 mr-2" />
                Hồ sơ nhân sự
              </DropdownMenuItem>
              {!staff.external && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(staff);
                  }}
                >
                  Chỉnh sửa vai trò & quyền
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-100 focus:text-red-700"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(staff);
                }}
              >
                Xóa
                <DropdownMenuShortcut className="ml-auto text-xs tracking-widest text-muted-foreground">
                  ⌘⌫
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
    <div className="h-full flex-1 flex-col gap-8 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quản lý nhân viên
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý nhân viên hệ thống và nhân viên ngoài hệ thống (tạp vụ,
              bưng bê...).
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Input
              placeholder="Tìm theo tên, email, SĐT, vị trí..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 min-w-0 sm:max-w-xs"
            />
            {branches?.length > 1 && (
              <Select
                value={branchFilter}
                onValueChange={(v) => {
                  setBranchFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">Tất cả chi nhánh</SelectItem>
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
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={handleExportProfiles}
            >
              <FileDown className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setAddExternalModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Ngoài HT</span>
            </Button>
            <Button
              variant="success"
              size="sm"
              className="cursor-pointer"
              onClick={() => setAddModalOpen(true)}
            >
              <Plus className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Thêm nhân viên</span>
            </Button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-md border">
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
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer"
                    onClick={() => handleOpenProfile(row.original)}
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
                      <span>Chưa có nhân viên nào.</span>
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
