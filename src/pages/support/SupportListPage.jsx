import { useState, useEffect, useCallback } from "react";
import { useShop } from "../../hooks/useShop.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal, Plus, Loader2, MessageSquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";

import { getTickets, getMyTickets, deleteTicket } from "../../api/supportApi.js";
import CreateTicketModal from "./CreateTicketModal.jsx";
import TicketDetailModal from "./TicketDetailModal.jsx";

const STATUS_MAP = {
  OPEN: { label: "Mở", variant: "default" },
  IN_PROGRESS: { label: "Đang xử lý", variant: "secondary" },
  RESOLVED: { label: "Đã giải quyết", variant: "outline" },
  CLOSED: { label: "Đã đóng", variant: "destructive" },
};

const PRIORITY_MAP = {
  LOW: { label: "Thấp", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  MEDIUM: { label: "Trung bình", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  HIGH: { label: "Cao", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  URGENT: { label: "Khẩn cấp", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const CATEGORY_MAP = {
  GENERAL: "Chung",
  ORDER: "Đơn hàng",
  PRODUCT: "Sản phẩm",
  PAYMENT: "Thanh toán",
  ACCOUNT: "Tài khoản",
  OTHER: "Khác",
};

const formatDate = (d) => {
  if (!d) return "";
  try { return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi }); }
  catch { return d; }
};

const SupportListPage = () => {
  const { selectedShopId, isOwner, isStaff, shopRole } = useShop();
  const shopId = selectedShopId;
  const isManager = isOwner || shopRole === "MANAGER" || shopRole === "ADMIN";
  const { confirm } = useAlertDialog();

  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState("all"); // "all" for managers, "my" for staff

  const fetchTickets = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.pageIndex,
        size: pagination.pageSize,
      };
      if (statusFilter !== "__all__") params.status = statusFilter;
      if (categoryFilter !== "__all__") params.category = categoryFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const fetcher = (isManager && viewMode === "all") ? getTickets : getMyTickets;
      const res = await fetcher(shopId, params);
      const data = res.data?.data;

      if (data && typeof data === "object" && "content" in data) {
        setTickets(data.content ?? []);
        setTotalCount(data.totalElements ?? 0);
      } else {
        const list = Array.isArray(data) ? data : [];
        setTickets(list);
        setTotalCount(list.length);
      }
    } catch (err) {
      console.error("Fetch tickets error:", err);
      toast.error("Không thể tải danh sách ticket.");
    } finally {
      setLoading(false);
    }
  }, [shopId, pagination, sorting, statusFilter, categoryFilter, keyword, viewMode, isManager]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleDelete = async (ticket) => {
    const ok = await confirm(
      `Bạn có chắc muốn xóa ticket "${ticket.subject}" không?`,
      { title: "Xóa ticket", confirmText: "Xóa", cancelText: "Hủy", variant: "destructive" }
    );
    if (!ok) return;
    try {
      const res = await deleteTicket(shopId, ticket.id);
      if (res.data?.success) {
        toast.success("Xóa ticket thành công.");
        fetchTickets();
      } else {
        toast.error(res.data?.message || "Xóa ticket thất bại.");
      }
    } catch (err) {
      console.error("Delete ticket error:", err);
      toast.error("Đã xảy ra lỗi khi xóa ticket.");
    }
  };

  const handleOpenDetail = (ticket) => {
    setDetailTicketId(ticket.id);
    setDetailOpen(true);
  };

  const columns = [
    {
      accessorKey: "subject",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tiêu đề" />,
      cell: ({ row }) => (
        <div className="max-w-[250px]">
          <span className="font-medium line-clamp-1">{row.original.subject}</span>
          {row.original.replyCount > 0 && (
            <span className="text-xs text-muted-foreground ml-1">({row.original.replyCount} phản hồi)</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Trạng thái" />,
      cell: ({ row }) => {
        const s = STATUS_MAP[row.original.status] || STATUS_MAP.OPEN;
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
      size: 130,
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ưu tiên" />,
      cell: ({ row }) => {
        const p = PRIORITY_MAP[row.original.priority] || PRIORITY_MAP.MEDIUM;
        return <Badge className={p.className}>{p.label}</Badge>;
      },
      size: 120,
    },
    {
      accessorKey: "category",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Danh mục" />,
      cell: ({ row }) => CATEGORY_MAP[row.original.category] || row.original.category,
      size: 120,
    },
    {
      accessorKey: "userName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Người gửi" />,
      cell: ({ row }) => (
        <div className="truncate max-w-[150px]">
          <div className="font-medium text-sm">{row.original.userName}</div>
          <div className="text-xs text-muted-foreground">{row.original.userEmail}</div>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ngày tạo" />,
      cell: ({ row }) => formatDate(row.original.createdAt),
      size: 140,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleOpenDetail(row.original)}>
              Xem chi tiết
            </DropdownMenuItem>
            {isManager && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(row.original)}
              >
                Xóa
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      size: 60,
    },
  ];

  const table = useReactTable({
    data: tickets,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hỗ trợ</h1>
          <p className="text-muted-foreground text-sm">Quản lý yêu cầu hỗ trợ từ nhân viên.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo yêu cầu
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Tìm kiếm tiêu đề, người gửi..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-64"
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Danh mục" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Tất cả danh mục</SelectItem>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isManager && (
          <Select value={viewMode} onValueChange={(v) => { setViewMode(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ticket</SelectItem>
              <SelectItem value="my">Ticket của tôi</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12">
                  <MessageSquarePlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground">Chưa có yêu cầu hỗ trợ nào.</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => handleOpenDetail(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />

      <CreateTicketModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        shopId={shopId}
        onCreated={fetchTickets}
      />

      <TicketDetailModal
        open={detailOpen}
        onOpenChange={setDetailOpen}
        shopId={shopId}
        ticketId={detailTicketId}
        isManager={isManager}
        onUpdated={fetchTickets}
      />
    </div>
  );
};

export default SupportListPage;
