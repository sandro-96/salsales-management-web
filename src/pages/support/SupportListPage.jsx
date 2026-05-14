import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
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

import { listMyTickets, deleteTicket } from "../../api/supportApi.js";
import CreateTicketModal from "./CreateTicketModal.jsx";
import TicketDetailModal from "./TicketDetailModal.jsx";
import {
  TICKET_STATUS_MAP,
  TICKET_LIST_WS_TYPES,
  ticketStatusBadgeClass,
} from "@/constants/supportTicketStatus.js";
import { WebSocketMessageTypes } from "@/constants/websocket.js";

const PRIORITY_BADGE_CLASS = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  MEDIUM:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  HIGH:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CATEGORY_KEYS = [
  "GENERAL",
  "ORDER",
  "PRODUCT",
  "PAYMENT",
  "ACCOUNT",
  "OTHER",
];

const SupportListPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const isMobile = useIsMobile();
  const { confirm } = useAlertDialog();
  const { t, i18n } = useTranslation();

  const dateFnsLocale = useMemo(
    () => (i18n.language?.startsWith("en") ? enUS : vi),
    [i18n.language],
  );

  const formatDate = useCallback(
    (d) => {
      if (!d) return "";
      try {
        return format(new Date(d), "dd/MM/yyyy HH:mm", {
          locale: dateFnsLocale,
        });
      } catch {
        return d;
      }
    },
    [dateFnsLocale],
  );

  const [tickets, setTickets] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const qid = searchParams.get("ticketId");
    if (qid) {
      setDetailTicketId(qid);
      setDetailOpen(true);
    }
  }, [searchParams]);

  const handleDetailOpenChange = (nextOpen) => {
    setDetailOpen(nextOpen);
    if (!nextOpen) {
      const next = new URLSearchParams(searchParams);
      next.delete("ticketId");
      setSearchParams(next, { replace: true });
    }
  };

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [categoryFilter, setCategoryFilter] = useState("__all__");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      userName: !isMobile,
      category: !isMobile,
      createdAt: !isMobile,
    }));
  }, [isMobile]);

  const fetchTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: pagination.pageIndex,
          size: pagination.pageSize,
        };
        if (statusFilter !== "__all__") params.status = statusFilter;
        if (categoryFilter !== "__all__") params.category = categoryFilter;
        if (keyword.trim()) params.keyword = keyword.trim();

        const res = await listMyTickets(params);
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
        toast.error(t("pages.support.list.fetchError"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [pagination, statusFilter, categoryFilter, keyword, t],
  );

  useEffect(() => {
    fetchTickets(false);
  }, [fetchTickets]);

  useEffect(() => {
    if (!user?.id || !connected) return;
    return subscribe(`/topic/notifications/${user.id}`, (message) => {
      if (message.type !== WebSocketMessageTypes.NOTIFICATION || !message.data)
        return;
      const d = message.data;
      if (d.referenceType !== "TICKET") return;
      if (!TICKET_LIST_WS_TYPES.has(d.type)) return;
      fetchTickets(true);
    });
  }, [user?.id, connected, subscribe, fetchTickets]);

  const handleDelete = useCallback(
    async (ticket) => {
      const ok = await confirm(
        t("pages.support.list.deleteConfirm", { subject: ticket.subject }),
        {
          title: t("pages.support.list.deleteTitle"),
          confirmText: t("pages.support.list.deleteConfirmBtn"),
          cancelText: t("common.cancel"),
          variant: "destructive",
        },
      );
      if (!ok) return;
      try {
        const res = await deleteTicket(ticket.id);
        if (res.data?.success) {
          toast.success(t("pages.support.list.deleteSuccess"));
          fetchTickets();
        } else {
          toast.error(
            res.data?.message || t("pages.support.list.deleteFail"),
          );
        }
      } catch (err) {
        console.error("Delete ticket error:", err);
        toast.error(t("pages.support.list.deleteError"));
      }
    },
    [confirm, t, fetchTickets],
  );

  const handleOpenDetail = useCallback((ticket) => {
    setDetailTicketId(ticket.id);
    setDetailOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "subject",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colSubject")}
          />
        ),
        cell: ({ row }) => (
          <div className="max-w-[250px]">
            <span className="font-medium line-clamp-1">
              {row.original.subject}
            </span>
            {row.original.replyCount > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                {t("pages.support.list.colReplies", {
                  count: row.original.replyCount,
                })}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colStatus")}
          />
        ),
        cell: ({ row }) => {
          const st = row.original.status;
          return (
            <Badge variant="outline" className={ticketStatusBadgeClass(st)}>
              {t(`pages.support.ticketStatus.${st}`, {
                defaultValue: st,
              })}
            </Badge>
          );
        },
        size: 130,
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colPriority")}
          />
        ),
        cell: ({ row }) => {
          const p = row.original.priority || "MEDIUM";
          const cls =
            PRIORITY_BADGE_CLASS[p] || PRIORITY_BADGE_CLASS.MEDIUM;
          return (
            <Badge className={cls}>
              {t(`pages.support.priority.${p}`, { defaultValue: p })}
            </Badge>
          );
        },
        size: 120,
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colCategory")}
          />
        ),
        cell: ({ row }) =>
          t(`pages.support.category.${row.original.category}`, {
            defaultValue: row.original.category,
          }),
        size: 120,
      },
      {
        accessorKey: "userName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colSender")}
          />
        ),
        cell: ({ row }) => (
          <div className="truncate max-w-[150px]">
            <div className="font-medium text-sm">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.userEmail}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.list.colCreated")}
          />
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
        size: 140,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {t("pages.support.list.actions")}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.stopPropagation();
                    handleOpenDetail(row.original);
                  }}
                >
                  {t("pages.support.list.viewDetail")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(e) => {
                    e.stopPropagation();
                    handleDelete(row.original);
                  }}
                >
                  {t("pages.support.list.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 60,
      },
    ],
    [t, formatDate, handleDelete, handleOpenDetail],
  );

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
    <div className="w-full p-4 md:p-6 space-y-4 md:max-w-7xl md:mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("pages.support.list.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("pages.support.list.subtitle")}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} variant="success">
          <Plus className="mr-2 h-4 w-4" />
          {t("pages.support.list.create")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
        <Input
          placeholder={t("pages.support.list.searchPlaceholder")}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-full sm:w-64"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue
              placeholder={t("pages.support.list.statusPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              {t("pages.support.list.allStatus")}
            </SelectItem>
            {Object.keys(TICKET_STATUS_MAP).map((k) => (
              <SelectItem key={k} value={k}>
                {t(`pages.support.ticketStatus.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue
              placeholder={t("pages.support.list.categoryPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              {t("pages.support.list.allCategories")}
            </SelectItem>
            {CATEGORY_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`pages.support.category.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
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
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12"
                >
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-12"
                >
                  <MessageSquarePlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground">
                    {t("pages.support.list.empty")}
                  </p>
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
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
        onCreated={fetchTickets}
      />

      <TicketDetailModal
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        shopId={null}
        ticketId={detailTicketId}
        isManager={false}
        onUpdated={fetchTickets}
      />
    </div>
  );
};

export default SupportListPage;
