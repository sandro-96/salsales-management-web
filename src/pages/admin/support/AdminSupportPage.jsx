import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2, MessageSquarePlus } from "lucide-react";

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
import { Card } from "@/components/ui/card";
import { DataTableColumnHeader } from "@/components/table/DataTableColumnHeader.jsx";
import { DataTablePagination } from "@/components/table/DataTablePagination.jsx";

import {
  adminListTickets,
  adminGetTicket,
  adminReplyTicket,
  adminUpdateTicketStatus,
  adminGetTicketStats,
} from "@/api/adminSupportApi.js";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import TicketDetailModal from "@/pages/support/TicketDetailModal.jsx";
import {
  TICKET_STATUS_MAP,
  TICKET_LIST_WS_TYPES,
  ticketStatusBadgeClass,
} from "@/constants/supportTicketStatus.js";
import { WebSocketMessageTypes } from "@/constants/websocket.js";
import { parseSpringPage } from "@/utils/springPage.js";

const PRIORITY_BADGE_CLASS = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-muted dark:text-foreground",
  MEDIUM:
    "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200",
  HIGH:
    "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-200",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-200",
};

const PRIORITY_KEYS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const STAT_CARD_STYLE = {
  OPEN: "text-amber-700 dark:text-amber-400",
  IN_PROGRESS: "text-sky-700 dark:text-sky-400",
  RESOLVED: "text-emerald-700 dark:text-emerald-400",
  CLOSED: "text-slate-600 dark:text-slate-400",
};

const AdminSupportPage = () => {
  const { user } = useAuth();
  const { subscribe, connected } = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [stats, setStats] = useState({});

  const [detailTicketId, setDetailTicketId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [sorting, setSorting] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [statusFilter, setStatusFilter] = useState("__all__");
  const [priorityFilter, setPriorityFilter] = useState("__all__");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [keyword, setKeyword] = useState("");

  const fetchTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const params = {
          page: pagination.pageIndex,
          size: pagination.pageSize,
        };
        if (statusFilter !== "__all__") params.status = statusFilter;
        if (priorityFilter !== "__all__") params.priority = priorityFilter;
        if (assignedFilter === "mine" && user?.id) params.assigneeId = user.id;
        if (keyword.trim()) params.keyword = keyword.trim();

        const res = await adminListTickets(params);
        const { content, totalElements } = parseSpringPage(res.data?.data);
        setTickets(content);
        setTotalCount(totalElements);
      } catch (err) {
        console.error("Admin fetch tickets error:", err);
        toast.error(t("pages.support.admin.fetchError"));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      pagination,
      statusFilter,
      priorityFilter,
      assignedFilter,
      keyword,
      user?.id,
      t,
    ],
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminGetTicketStats();
      if (res.data?.success) setStats(res.data.data || {});
    } catch (err) {
      console.error("Admin fetch stats error:", err);
    }
  }, []);

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
      fetchStats();
    });
  }, [user?.id, connected, subscribe, fetchTickets, fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const qid = searchParams.get("ticketId");
    if (qid) {
      setDetailTicketId(qid);
      setDetailOpen(true);
    }
  }, [searchParams]);

  const handleOpenDetail = useCallback((ticket) => {
    setDetailTicketId(ticket.id);
    setDetailOpen(true);
  }, []);

  const handleDetailChange = (nextOpen) => {
    setDetailOpen(nextOpen);
    if (!nextOpen) {
      const next = new URLSearchParams(searchParams);
      next.delete("ticketId");
      setSearchParams(next, { replace: true });
    }
  };

  const adminAdapter = useMemo(
    () => ({
      getTicket: (_shopId, ticketId) => adminGetTicket(ticketId),
      reply: (_shopId, ticketId, data) => adminReplyTicket(ticketId, data),
      updateStatus: (_shopId, ticketId, data) =>
        adminUpdateTicketStatus(ticketId, data),
    }),
    [],
  );

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
          <div className="max-w-[260px]">
            <div className="font-medium line-clamp-1">
              {row.original.subject}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {t(`pages.support.category.${row.original.category}`, {
                defaultValue: row.original.category,
              })}
              {row.original.replyCount > 0
                ? ` · ${t("pages.support.admin.repliesInline", { count: row.original.replyCount })}`
                : ""}
            </div>
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
              {t(`pages.support.ticketStatus.${st}`, { defaultValue: st })}
            </Badge>
          );
        },
        size: 120,
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
        size: 110,
      },
      {
        accessorKey: "shopId",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.admin.colShop")}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs truncate max-w-[120px] block">
            {row.original.shopId || "—"}
          </span>
        ),
        size: 140,
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
          <div className="truncate max-w-[180px]">
            <div className="font-medium text-sm">{row.original.userName}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.userEmail}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "assigneeName",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("pages.support.admin.colAssignee")}
          />
        ),
        cell: ({ row }) =>
          row.original.assigneeName ? (
            <span className="text-sm">{row.original.assigneeName}</span>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {t("pages.support.admin.unassigned")}
            </span>
          ),
        size: 140,
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
    ],
    [t, formatDate],
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

  const statCardKeys = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("pages.support.admin.title")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("pages.support.admin.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCardKeys.map((key) => (
          <Card key={key} className="p-4">
            <div className="text-xs text-muted-foreground">
              {t(`pages.support.ticketStatus.${key}`)}
            </div>
            <div
              className={`text-2xl font-semibold mt-1 ${STAT_CARD_STYLE[key] || ""}`}
            >
              {stats[key] ?? 0}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder={t("pages.support.admin.searchPlaceholder")}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="w-64"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue
              placeholder={t("pages.support.admin.statusPlaceholder")}
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
          value={priorityFilter}
          onValueChange={(v) => {
            setPriorityFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue
              placeholder={t("pages.support.admin.priorityPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              {t("pages.support.admin.allPriority")}
            </SelectItem>
            {PRIORITY_KEYS.map((k) => (
              <SelectItem key={k} value={k}>
                {t(`pages.support.priority.${k}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={assignedFilter}
          onValueChange={(v) => {
            setAssignedFilter(v);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("pages.support.admin.assignedAll")}
            </SelectItem>
            <SelectItem value="mine">
              {t("pages.support.admin.assignedMine")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
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
                    {t("pages.support.admin.emptyFiltered")}
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

      <TicketDetailModal
        open={detailOpen}
        onOpenChange={handleDetailChange}
        shopId={null}
        ticketId={detailTicketId}
        isManager
        apiAdapter={adminAdapter}
        onUpdated={() => {
          fetchTickets();
          fetchStats();
        }}
      />
    </div>
  );
};

export default AdminSupportPage;
