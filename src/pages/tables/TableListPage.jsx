import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation, Trans } from "react-i18next";
import {
  Armchair,
  Plus,
  Loader2,
  MoreHorizontal,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  Lock,
  Search,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useShop } from "../../hooks/useShop.js";
import { useShopPermissions } from "../../hooks/useShopPermissions.js";
import { useBranchChannel } from "../../hooks/useBranchChannel.js";
import { useWebSocket } from "../../hooks/useWebSocket.js";
import { useRealtimePollFallback } from "../../hooks/useRealtimePollFallback.js";
import { WebSocketMessageTypes } from "../../constants/websocket.js";
import { PERM } from "../../constants/shopPermissions.js";
import { useAlertDialog } from "../../hooks/useAlertDialog.js";
import {
  getTables,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from "../../api/tableApi.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NumericInput } from "@/components/ui/numeric-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveApiError } from "@/utils/apiMessage";

const TABLE_STATUS_STYLE = {
  AVAILABLE: {
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/40",
    ring: "ring-emerald-300 dark:ring-emerald-500/40",
  },
  OCCUPIED: {
    icon: Users,
    cls: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/40",
    ring: "ring-amber-300 dark:ring-amber-500/40",
  },
  CLOSED: {
    icon: Lock,
    cls: "bg-gray-100 text-gray-600 border-gray-300 dark:bg-muted dark:text-muted-foreground dark:border-border",
    ring: "ring-gray-300 dark:ring-border",
  },
};

function useTableStatuses() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      Object.fromEntries(
        Object.entries(TABLE_STATUS_STYLE).map(([key, style]) => [
          key,
          {
            ...style,
            label: t(`pages.tables.status.${key}`),
          },
        ]),
      ),
    [t],
  );
}

const TableStatusBadge = ({ status, tableStatuses }) => {
  const cfg = tableStatuses[status] || tableStatuses.AVAILABLE;
  const IconComp = cfg.icon;
  return (
    <Badge className={`gap-1 text-[11px] ${cfg.cls} hover:${cfg.cls}`}>
      <IconComp className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
};

// ─── Table Form Dialog ───────────────────────────────────────────────────────

const TableFormDialog = ({
  open,
  onClose,
  table: editTable,
  shopId,
  branchId,
  onSuccess,
  canCreate = false,
  canUpdate = false,
}) => {
  const { t } = useTranslation();
  const isEdit = !!editTable;
  const readOnly = isEdit ? !canUpdate : !canCreate;
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [note, setNote] = useState("");
  const [alwaysAvailable, setAlwaysAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editTable) {
        setName(editTable.name || "");
        setCapacity(editTable.capacity ? String(editTable.capacity) : "");
        setNote(editTable.note || "");
        setAlwaysAvailable(!!editTable.alwaysAvailable);
      } else {
        setName("");
        setCapacity("");
        setNote("");
        setAlwaysAvailable(false);
      }
    }
  }, [open, editTable]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t("pages.tables.form.nameRequired"));
      return;
    }
    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        shopId,
        branchId,
        capacity: capacity ? Number(capacity) : null,
        note: note.trim() || null,
        alwaysAvailable,
      };
      if (isEdit) {
        data.status = editTable.status;
        await updateTable(editTable.id, shopId, data);
        toast.success(t("pages.tables.form.updateSuccess"));
      } else {
        data.status = "AVAILABLE";
        await createTable(shopId, data);
        toast.success(t("pages.tables.form.createSuccess"));
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        resolveApiError(t, err) || t("pages.tables.form.genericError"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Armchair className="h-5 w-5" />
            {isEdit
              ? t("pages.tables.form.editTitle")
              : t("pages.tables.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("pages.tables.form.editDesc")
              : t("pages.tables.form.createDesc")}
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={readOnly} className="space-y-4 disabled:opacity-70">
          <div className="space-y-2">
            <Label htmlFor="table-name">{t("pages.tables.form.nameLabel")}</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("pages.tables.form.namePlaceholder")}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-capacity">
              {t("pages.tables.form.capacityLabel")}
            </Label>
            <NumericInput
              id="table-capacity"
              value={capacity}
              onChange={setCapacity}
              formatted={false}
              placeholder={t("pages.tables.form.capacityPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-note">{t("pages.tables.form.noteLabel")}</Label>
            <Textarea
              id="table-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("pages.tables.form.notePlaceholder")}
              rows={2}
            />
          </div>

          <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
            <input
              type="checkbox"
              className="mt-1"
              checked={alwaysAvailable}
              onChange={(e) => setAlwaysAvailable(e.target.checked)}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {t("pages.tables.form.alwaysAvailableTitle")}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                <Trans i18nKey="pages.tables.form.alwaysAvailableHint" />
              </p>
            </div>
          </label>
        </fieldset>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly
              ? t("pages.tables.form.close")
              : t("pages.tables.form.cancel")}
          </Button>
          {!readOnly && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {isEdit ? t("pages.tables.form.save") : t("pages.tables.form.create")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Table Card ──────────────────────────────────────────────────────────────

const TableCard = ({
  table,
  tableStatuses,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenPos,
}) => {
  const { t } = useTranslation();
  const canManage = canUpdate || canDelete;
  const cfg = tableStatuses[table.status] || tableStatuses.AVAILABLE;
  const isOccupied = table.status === "OCCUPIED";
  const isAlwaysAvailable = !!table.alwaysAvailable;
  const isClosed = table.status === "CLOSED";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isClosed) return;
        onOpenPos?.(table);
      }}
      onKeyDown={(e) => {
        if (isClosed) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenPos?.(table);
        }
      }}
      className={`relative py-0 gap-0 transition-shadow hover:shadow-md cursor-pointer ${
        isClosed ? "opacity-80 cursor-not-allowed" : ""
      } ${isOccupied ? "ring-2 " + cfg.ring : ""}`}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${cfg.cls}`}
            >
              <Armchair className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{table.name}</p>
              {table.capacity && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />{" "}
                  {t("pages.tables.capacityGuests", { count: table.capacity })}
                </p>
              )}
            </div>
          </div>
          {canManage && !isOccupied && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background w-44">
                <DropdownMenuLabel>{t("pages.tables.card.actions")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canUpdate && (
                  <DropdownMenuItem
                    onClick={() => onEdit(table)}
                    disabled={isOccupied}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> {t("pages.tables.card.edit")}
                  </DropdownMenuItem>
                )}
                {canUpdate && table.status !== "AVAILABLE" && !isOccupied && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(table, "AVAILABLE")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    {t("pages.tables.card.openTable")}
                  </DropdownMenuItem>
                )}
                {canUpdate && table.status !== "CLOSED" && !isOccupied && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(table, "CLOSED")}
                  >
                    <Lock className="h-4 w-4 mr-2 text-gray-600" />{" "}
                    {t("pages.tables.card.closeTable")}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-500/15 dark:focus:text-red-200"
                      onClick={() => onDelete(table)}
                      disabled={isOccupied}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> {t("pages.tables.card.delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <TableStatusBadge status={table.status} tableStatuses={tableStatuses} />
            {isAlwaysAvailable && (
              <Badge className="text-[10px] bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-200 dark:border-sky-500/40 dark:hover:bg-sky-500/15">
                {t("pages.tables.alwaysAvailableBadge")}
              </Badge>
            )}
          </div>
          {!isAlwaysAvailable && table.currentOrderId && (
            <span className="text-[10px] font-mono text-muted-foreground">
              #{table.currentOrderId.slice(-6)}
            </span>
          )}
        </div>

        {table.note && (
          <p className="text-xs text-muted-foreground truncate">{table.note}</p>
        )}
      </CardContent>
    </Card>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const TableListPage = () => {
  const { t, i18n } = useTranslation();
  const tableStatuses = useTableStatuses();
  const sortLocale = i18n.language?.startsWith("en") ? "en" : "vi";
  const navigate = useNavigate();
  const {
    selectedShopId,
    selectedBranchId,
    selectedBranch,
    branches,
    setSelectedBranchId,
  } = useShop();
  const { hasShopPermission } = useShopPermissions();
  const { confirm } = useAlertDialog();
  const canCreate = hasShopPermission(PERM.TABLE_CREATE);
  const canUpdate = hasShopPermission(PERM.TABLE_UPDATE);
  const canDelete = hasShopPermission(PERM.TABLE_DELETE);

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const { connected: wsConnected } = useWebSocket();

  const fetchTables = useCallback(async ({ silent = false } = {}) => {
    if (!selectedShopId || !selectedBranchId) return;
    if (!silent) setLoading(true);
    try {
      const res = await getTables(selectedShopId, selectedBranchId, {
        size: 200,
        sort: "name,asc",
      });
      const data = res.data?.data;
      if (data && typeof data === "object" && "content" in data) {
        setTables(data.content ?? []);
      } else {
        setTables(Array.isArray(data) ? data : []);
      }
    } catch {
      if (!silent) toast.error(t("pages.tables.toast.fetchFail"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedShopId, selectedBranchId, t]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useRealtimePollFallback({
    enabled: !!selectedShopId && !!selectedBranchId,
    connected: wsConnected,
    onPoll: () => fetchTables({ silent: true }),
  });

  // ── Realtime: tables channel (đồng bộ trạng thái bàn giữa các tab) ───────
  const onRealtimeTable = useCallback((msg) => {
    if (!msg?.type || !msg.data) return;
    const payload = msg.data;
    if (msg.type === WebSocketMessageTypes.TABLE_DELETED) {
      setTables((prev) => prev.filter((t) => t.id !== payload.id));
      return;
    }
    if (msg.type === WebSocketMessageTypes.TABLE_CREATED) {
      setTables((prev) => {
        if (prev.some((t) => t.id === payload.id)) return prev;
        const next = [...prev, payload];
        next.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", sortLocale),
        );
        return next;
      });
      return;
    }
    if (
      msg.type === WebSocketMessageTypes.TABLE_UPDATED ||
      msg.type === WebSocketMessageTypes.TABLE_STATUS_CHANGED ||
      msg.type === WebSocketMessageTypes.TABLE_ASSIGNED
    ) {
      setTables((prev) =>
        prev.map((t) => (t.id === payload.id ? { ...t, ...payload } : t)),
      );
    }
  }, [sortLocale]);
  useBranchChannel("tables", onRealtimeTable);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupied = tables.filter((t) => t.status === "OCCUPIED").length;
    const closed = tables.filter((t) => t.status === "CLOSED").length;
    return { total, available, occupied, closed };
  }, [tables]);

  // ── Filtered ─────────────────────────────────────────────────────────────
  const filteredTables = useMemo(() => {
    let result = tables;
    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      result = result.filter((t) => t.name?.toLowerCase().includes(kw));
    }
    return result;
  }, [tables, statusFilter, keyword]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = (table) => {
    setEditingTable(table);
    setFormOpen(true);
  };

  const handleDelete = async (table) => {
    const ok = await confirm(
      t("pages.tables.confirm.deleteMessage", { name: table.name }),
      {
        title: t("pages.tables.confirm.deleteTitle"),
        confirmText: t("pages.tables.confirm.deleteConfirm"),
        cancelText: t("pages.tables.confirm.cancel"),
        variant: "destructive",
      },
    );
    if (!ok) return;
    try {
      await deleteTable(table.id, selectedShopId);
      toast.success(t("pages.tables.toast.deleteSuccess"));
      fetchTables();
    } catch (err) {
      toast.error(
        resolveApiError(t, err) || t("pages.tables.toast.deleteFail"),
      );
    }
  };

  const handleStatusChange = async (table, newStatus) => {
    try {
      await updateTableStatus(table.id, selectedShopId, newStatus);
      toast.success(
        t("pages.tables.toast.statusUpdated", {
          status: tableStatuses[newStatus]?.label || newStatus,
        }),
      );
      fetchTables();
    } catch (err) {
      toast.error(
        resolveApiError(t, err) || t("pages.tables.toast.statusFail"),
      );
    }
  };

  const noBranch = !selectedBranchId;

  return (
    <div className="h-full flex-1 flex-col gap-6 p-4 md:p-8 md:flex">
      <div className="flex flex-col gap-6">
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("pages.tables.title")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedBranch
                ? t("pages.tables.branchSubtitle", {
                    name: selectedBranch.name,
                  })
                : t("pages.tables.branchSubtitleEmpty")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {branches.length > 1 && (
              <Select
                value={selectedBranchId ?? ""}
                onValueChange={setSelectedBranchId}
              >
                <SelectTrigger className="w-[220px]">
                  <Warehouse className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder={t("pages.tables.selectBranch")} />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {canCreate && !noBranch && (
              <Button
                onClick={() => {
                  setEditingTable(null);
                  setFormOpen(true);
                }}
                size="sm"
                variant="success"
              >
                <Plus className="h-4 w-4 mr-1" /> {t("pages.tables.addTable")}
              </Button>
            )}
          </div>
        </div>

        {/* ── No branch ───────────────────────────────────────────── */}
        {noBranch ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Warehouse className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">
              {t("pages.tables.noBranch.title")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {t("pages.tables.noBranch.hint")}
            </p>
          </div>
        ) : (
          <>
            {/* ── Stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                    <Armchair className="h-5 w-5" />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <p className="text-2xl font-bold leading-none">
                        {stats.total}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pages.tables.stats.total")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <p className="text-2xl font-bold leading-none">
                        {stats.available}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pages.tables.stats.available")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <p className="text-2xl font-bold leading-none">
                        {stats.occupied}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pages.tables.stats.occupied")}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-gray-100 text-gray-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    {loading ? (
                      <Skeleton className="h-6 w-10" />
                    ) : (
                      <p className="text-2xl font-bold leading-none">
                        {stats.closed}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("pages.tables.stats.closed")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t("pages.tables.searchPlaceholder")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="ALL">{t("pages.tables.filterAll")}</SelectItem>
                  {Object.entries(tableStatuses).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ── Grid ──────────────────────────────────────────────── */}
            {loading && tables.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="py-0 gap-0">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredTables.map((table) => (
                  <TableCard
                    key={table.id}
                    table={table}
                    tableStatuses={tableStatuses}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onOpenPos={(t) => {
                      // Go straight to POS to take orders for this table.
                      navigate(`/pos?tableId=${encodeURIComponent(t.id)}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Armchair className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">
                  {keyword || statusFilter !== "ALL"
                    ? t("pages.tables.empty.filtered")
                    : t("pages.tables.empty.none")}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Form Dialog ───────────────────────────────────────────── */}
      <TableFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        table={editingTable}
        shopId={selectedShopId}
        branchId={selectedBranchId}
        canCreate={canCreate}
        canUpdate={canUpdate}
        onSuccess={fetchTables}
      />
    </div>
  );
};

export default TableListPage;
