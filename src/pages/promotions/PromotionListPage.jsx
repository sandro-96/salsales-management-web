import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Percent,
  DollarSign,
  Tag,
  Warehouse,
  Globe,
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
  getPromotions,
  deletePromotion,
} from "../../api/promotionApi.js";
import PromotionFormModal from "./PromotionFormModal.jsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPromotionStatus = (promo) => {
  if (!promo.active) return { label: "Tạm dừng", variant: "secondary" };
  const now = new Date();
  const start = new Date(promo.startDate);
  const end = new Date(promo.endDate);
  if (now < start) return { label: "Sắp diễn ra", variant: "outline" };
  if (now > end) return { label: "Đã hết hạn", variant: "destructive" };
  return { label: "Đang hoạt động", variant: "default" };
};

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

const formatDiscount = (type, value) => {
  if (type === "PERCENT") return `${value}%`;
  return Number(value).toLocaleString("vi-VN") + "đ";
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PromotionListPage = () => {
  const { selectedShopId, branches } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const shopId = selectedShopId;
  const canCreate = hasShopPermission(PERM.PROMOTION_CREATE);
  const canUpdate = hasShopPermission(PERM.PROMOTION_UPDATE);
  const canDelete = hasShopPermission(PERM.PROMOTION_DELETE);
  const { confirm } = useAlertDialog();

  const branchMap = useMemo(() => {
    const map = {};
    branches?.forEach((b) => { map[b.id] = b.name; });
    return map;
  }, [branches]);

  const [promotions, setPromotions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [branchFilter, setBranchFilter] = useState("__all__");
  const [keyword, setKeyword] = useState("");

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchPromotions = useCallback(async () => {
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
      toast.error("Không thể tải danh sách khuyến mãi.");
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, sorting, branchFilter]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleDelete = async (promo) => {
    const ok = await confirm(
      `Bạn có chắc muốn xóa khuyến mãi "${promo.name}" không? Hành động này không thể hoàn tác.`,
      {
        title: "Xóa khuyến mãi",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      },
    );
    if (!ok) return;

    setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    setTotalCount((c) => c - 1);

    try {
      setIsSubmitting(true);
      const res = await deletePromotion(promo.id, shopId);
      if (res.data?.success) {
        toast.success("Xóa khuyến mãi thành công.");
        fetchPromotions();
      } else {
        toast.error(res.data?.message || "Xóa khuyến mãi thất bại.");
        fetchPromotions();
      }
    } catch (err) {
      console.error("Delete promotion error:", err);
      toast.error("Đã xảy ra lỗi khi xóa khuyến mãi.");
      fetchPromotions();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (promo) => {
    setEditingPromotion(promo);
    setModalOpen(true);
  };

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tên khuyến mãi" />
      ),
      cell: ({ row }) => (
        <div className="font-medium min-w-[140px]">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "discountType",
      header: "Loại giảm giá",
      cell: ({ row }) => {
        const type = row.getValue("discountType");
        const value = row.original.discountValue;
        return (
          <div className="flex items-center gap-1.5">
            {type === "PERCENT" ? (
              <Percent className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <DollarSign className="h-3.5 w-3.5 text-green-500" />
            )}
            <span className="font-semibold">
              {formatDiscount(type, value)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "startDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày bắt đầu" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("startDate"))}</div>
      ),
    },
    {
      accessorKey: "endDate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ngày kết thúc" />
      ),
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.getValue("endDate"))}</div>
      ),
    },
    {
      id: "branch",
      header: "Phạm vi",
      cell: ({ row }) => {
        const bid = row.original.branchId;
        if (!bid) {
          return (
            <Badge variant="outline" className="text-xs gap-1">
              <Globe className="h-3 w-3" />
              Toàn shop
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs gap-1">
            <Warehouse className="h-3 w-3" />
            {branchMap[bid] || bid}
          </Badge>
        );
      },
    },
    {
      id: "scope",
      header: "Sản phẩm",
      cell: ({ row }) => {
        const ids = row.original.applicableProductIds;
        if (!ids || ids.length === 0) {
          return (
            <Badge variant="outline" className="text-xs">
              Tất cả SP
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {ids.length} sản phẩm
          </Badge>
        );
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const { label, variant } = getPromotionStatus(row.original);
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
                  handleOpenEdit(promo);
                }}
              >
                {canUpdate ? "Chỉnh sửa" : "Xem chi tiết"}
              </DropdownMenuItem>
              {canDelete && (
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                  disabled={isSubmitting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(promo);
                  }}
                >
                  Xóa
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
  ];

  const filteredPromotions = useMemo(() => {
    if (!keyword.trim()) return promotions;
    const kw = keyword.toLowerCase();
    return promotions.filter((p) => p.name?.toLowerCase().includes(kw));
  }, [promotions, keyword]);

  // ── Table ────────────────────────────────────────────────────────────────

  const table = useReactTable({
    data: filteredPromotions,
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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="h-full flex-1 flex-col gap-8 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quản lý khuyến mãi
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo và quản lý các chương trình khuyến mãi cho cửa hàng.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Input
              placeholder="Tìm khuyến mãi..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 min-w-0 sm:max-w-xs"
            />
            {branches?.length > 0 && (
              <Select
                value={branchFilter}
                onValueChange={(v) => {
                  setBranchFilter(v);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="__all__">Tất cả phạm vi</SelectItem>
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
            {canCreate && (
              <Button
                variant="success"
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  setEditingPromotion(null);
                  setModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Thêm khuyến mãi</span>
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="relative overflow-hidden rounded-md border">
          {loading && promotions.length > 0 && (
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
              {loading && promotions.length === 0 ? (
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
                      <Tag className="h-8 w-8 text-muted-foreground/40" />
                      <span>Chưa có khuyến mãi nào.</span>
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
        onSuccess={fetchPromotions}
      />
    </div>
  );
};

export default PromotionListPage;
