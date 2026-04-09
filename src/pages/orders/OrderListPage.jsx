import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ShoppingCart,
  Loader2,
  MoreHorizontal,
  CreditCard,
  XCircle,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  Receipt,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { useShop } from "../../hooks/useShop.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import {
  getOrders,
  filterOrders,
  cancelOrder,
  confirmPayment,
  updateOrderStatus,
} from "../../api/orderApi.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";
import { DataTableViewOptions } from "@/components/table/DataTableViewOptions.jsx";
import CreateOrderModal from "./CreateOrderModal";

// ─── Constants ───────────────────────────────────────────────────────────────

const ORDER_STATUSES = {
  PENDING: {
    label: "Chờ xử lý",
    icon: Clock,
    cls: "bg-amber-100 text-amber-800 border-amber-200",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    icon: CheckCircle2,
    cls: "bg-blue-100 text-blue-800 border-blue-200",
  },
  SHIPPING: {
    label: "Đang giao",
    icon: Truck,
    cls: "bg-violet-100 text-violet-800 border-violet-200",
  },
  COMPLETED: {
    label: "Hoàn tất",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    icon: Ban,
    cls: "bg-red-100 text-red-800 border-red-200",
  },
};

const PAYMENT_METHODS = [
  { value: "Cash", label: "Tiền mặt" },
  { value: "Card", label: "Thẻ" },
  { value: "Transfer", label: "Chuyển khoản" },
];

// ─── Status Badge ────────────────────────────────────────────────────────────

const OrderStatusBadge = ({ status }) => {
  const cfg = ORDER_STATUSES[status] || { label: status, icon: Clock, cls: "" };
  const IconComp = cfg.icon;
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, iconClassName, loading }) => {
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
      </CardContent>
    </Card>
  );
};

// ─── Order Detail Dialog ─────────────────────────────────────────────────────

const OrderDetailDialog = ({ open, onClose, order }) => {
  if (!order) return null;
  const tax = order.taxSnapshot;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Chi tiết đơn hàng
          </DialogTitle>
          <DialogDescription>
            Mã đơn:{" "}
            <span className="font-mono text-foreground">{order.id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            {order.paid ? (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
                Đã thanh toán
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px]">
                Chưa thanh toán
              </Badge>
            )}
          </div>

          {order.note && (
            <div className="text-sm">
              <span className="text-muted-foreground">Ghi chú: </span>
              {order.note}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-sm">
                      {item.productName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {(
                        item.priceAfterDiscount ??
                        item.price ??
                        0
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {(
                        (item.priceAfterDiscount ?? item.price ?? 0) *
                        item.quantity
                      ).toLocaleString("vi-VN")}{" "}
                      ₫
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tax && (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="tabular-nums">
                  {(tax.netAmount ?? 0).toLocaleString("vi-VN")} ₫
                </span>
              </div>
              {tax.taxes?.map((t, i) => (
                <div
                  key={i}
                  className="flex justify-between text-muted-foreground"
                >
                  <span>
                    {t.label} ({(t.rate * 100).toFixed(0)}%)
                  </span>
                  <span className="tabular-nums">
                    {(t.amount ?? 0).toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-base pt-1 border-t mt-2">
                <span>Tổng cộng</span>
                <span className="tabular-nums">
                  {(tax.grandTotal ?? order.totalPrice ?? 0).toLocaleString(
                    "vi-VN",
                  )}{" "}
                  ₫
                </span>
              </div>
            </div>
          )}

          {!tax && (
            <div className="flex justify-between font-semibold text-base">
              <span>Tổng cộng</span>
              <span className="tabular-nums">
                {(order.totalPrice ?? 0).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          )}

          {order.paymentMethod && (
            <div className="text-sm text-muted-foreground">
              Thanh toán: {order.paymentMethod}
              {order.paymentTime &&
                ` — ${new Date(order.paymentTime).toLocaleString("vi-VN")}`}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const OrderListPage = () => {
  const {
    selectedShopId,
    selectedBranchId,
    branches,
    setSelectedBranchId,
    isOwner,
    isStaff,
  } = useShop();
  const { confirm } = useAlertDialog();
  const canManage = isOwner || isStaff;

  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!selectedShopId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        sort: "createdAt,desc",
      };
      if (selectedBranchId) params.branchId = selectedBranchId;

      const res =
        statusFilter === "ALL"
          ? await getOrders(selectedShopId, params)
          : await filterOrders(selectedShopId, statusFilter, params);

      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setOrders(data.content ?? []);
        setTotalCount(data.page?.totalElements ?? data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setOrders(list);
        setTotalCount(list.length);
      }
    } catch {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, selectedBranchId, pagination, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "PENDING").length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const revenue = orders
      .filter((o) => o.paid)
      .reduce(
        (sum, o) => sum + (o.taxSnapshot?.grandTotal ?? o.totalPrice ?? 0),
        0,
      );
    return { total, pending, completed, revenue };
  }, [orders]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleCancel = useCallback(
    async (order) => {
      const ok = await confirm(
        `Bạn có chắc muốn hủy đơn hàng này? Tồn kho sẽ được hoàn lại.`,
        {
          title: "Hủy đơn hàng",
          confirmText: "Hủy đơn",
          cancelText: "Đóng",
          variant: "destructive",
        },
      );
      if (!ok) return;
      try {
        setSubmitting(true);
        await cancelOrder(order.id, selectedShopId);
        toast.success("Đã hủy đơn hàng.");
        fetchOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể hủy đơn hàng.");
      } finally {
        setSubmitting(false);
      }
    },
    [confirm, selectedShopId, fetchOrders],
  );

  const handleStatusChange = useCallback(
    async (order, newStatus) => {
      try {
        setSubmitting(true);
        await updateOrderStatus(order.id, selectedShopId, newStatus);
        toast.success(
          `Đã cập nhật trạng thái: ${ORDER_STATUSES[newStatus]?.label || newStatus}`,
        );
        fetchOrders();
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Không thể cập nhật trạng thái.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [selectedShopId, fetchOrders],
  );

  const openPaymentDialog = (order) => {
    setPayingOrderId(order.id);
    setPaymentMethod("Cash");
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!payingOrderId) return;
    try {
      setSubmitting(true);
      const paymentId = `PAY-${Date.now()}`;
      await confirmPayment(
        payingOrderId,
        selectedShopId,
        paymentId,
        paymentMethod,
      );
      toast.success("Thanh toán thành công.");
      setPaymentDialogOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể xác nhận thanh toán.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Mã đơn",
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {(row.original.id ?? "").slice(-8).toUpperCase()}
          </span>
        ),
      },
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
        accessorKey: "items",
        header: "Sản phẩm",
        enableSorting: false,
        cell: ({ row }) => {
          const items = row.original.items ?? [];
          if (items.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="max-w-[200px]">
              <p className="text-sm font-medium truncate">
                {items[0].productName}
              </p>
              {items.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  +{items.length - 1} sản phẩm khác
                </p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "totalAmount",
        header: "SL",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.totalAmount ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "totalPrice",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tổng tiền" />
        ),
        cell: ({ row }) => {
          const total =
            row.original.taxSnapshot?.grandTotal ??
            row.original.totalPrice ??
            0;
          return (
            <span className="text-sm font-semibold tabular-nums">
              {total.toLocaleString("vi-VN")} ₫
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "paid",
        header: "Thanh toán",
        cell: ({ row }) =>
          row.original.paid ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1">
              <CreditCard className="h-3 w-3" /> Đã TT
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] gap-1">
              Chưa TT
            </Badge>
          ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const order = row.original;
          const isTerminal =
            order.status === "CANCELLED" || order.status === "COMPLETED";
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Mở menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-48">
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedOrder(order);
                    setDetailOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" /> Xem chi tiết
                </DropdownMenuItem>

                {!order.paid && !isTerminal && canManage && (
                  <DropdownMenuItem onClick={() => openPaymentDialog(order)}>
                    <CreditCard className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    Thanh toán
                  </DropdownMenuItem>
                )}

                {order.status === "PENDING" && canManage && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "CONFIRMED")}
                    disabled={submitting}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /> Xác
                    nhận
                  </DropdownMenuItem>
                )}

                {order.status === "CONFIRMED" && canManage && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange(order, "SHIPPING")}
                    disabled={submitting}
                  >
                    <Truck className="h-4 w-4 mr-2 text-violet-600" /> Giao hàng
                  </DropdownMenuItem>
                )}

                {(order.status === "SHIPPING" ||
                  order.status === "CONFIRMED") &&
                  canManage && (
                    <DropdownMenuItem
                      onClick={() => handleStatusChange(order, "COMPLETED")}
                      disabled={submitting}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                      Hoàn tất
                    </DropdownMenuItem>
                  )}

                {!order.paid && !isTerminal && canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700"
                      onClick={() => handleCancel(order)}
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4 mr-2" /> Hủy đơn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canManage, submitting, handleCancel, handleStatusChange],
  );

  const table = useReactTable({
    data: orders,
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
    state: { sorting, pagination, columnVisibility, rowSelection },
  });

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Quản lý đơn hàng
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và xử lý đơn hàng
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Tạo đơn hàng
            </Button>
          )}
        </div>

        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={ShoppingCart}
            label="Tổng đơn hàng"
            value={stats.total}
            iconClassName="bg-violet-100 text-violet-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={Clock}
            label="Chờ xử lý"
            value={stats.pending}
            iconClassName="bg-amber-100 text-amber-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CheckCircle2}
            label="Hoàn tất"
            value={stats.completed}
            iconClassName="bg-emerald-100 text-emerald-600"
            loading={loading && orders.length === 0}
          />
          <StatCard
            icon={CreditCard}
            label="Doanh thu"
            value={stats.revenue.toLocaleString("vi-VN") + " ₫"}
            iconClassName="bg-sky-100 text-sky-600"
            loading={loading && orders.length === 0}
          />
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[170px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(ORDER_STATUSES).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branches.length > 1 && (
              <Select
                value={selectedBranchId ?? "ALL"}
                onValueChange={(v) =>
                  setSelectedBranchId(v === "ALL" ? null : v)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tất cả chi nhánh" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ALL">Tất cả chi nhánh</SelectItem>
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
        </div>

        {/* ── Table ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-md border">
          {loading && orders.length > 0 && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading && orders.length === 0 ? (
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
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(row.original);
                      setDetailOpen(true);
                    }}
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
                    <div className="flex flex-col items-center gap-2 py-4">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                      <p>Chưa có đơn hàng nào.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </div>

      {/* ── Detail Dialog ─────────────────────────────────────────── */}
      <OrderDetailDialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        order={selectedOrder}
      />

      {/* ── Payment Confirmation Dialog ───────────────────────────── */}
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(v) => !v && setPaymentDialogOpen(false)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-600" /> Xác nhận thanh
              toán
            </DialogTitle>
            <DialogDescription>
              Chọn phương thức thanh toán cho đơn hàng.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPaymentDialogOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button onClick={handleConfirmPayment} disabled={submitting}>
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                )}
                Xác nhận
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateOrderModal
        open={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        onCreated={fetchOrders}
      />
    </div>
  );
};

export default OrderListPage;
