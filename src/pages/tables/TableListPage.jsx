import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  QrCode,
  RefreshCw,
  Download,
  Printer,
  Copy,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { ListPageHeader } from "@/components/table/ListPageHeader.jsx";
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
  regenerateTableQrToken,
} from "../../api/tableApi.js";
import { openTableQrPrintWindow } from "@/utils/tableQrPrint.js";

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
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editTable) {
        setName(editTable.name || "");
        setCapacity(editTable.capacity ? String(editTable.capacity) : "");
        setNote(editTable.note || "");
        setAlwaysAvailable(!!editTable.alwaysAvailable);
        setQrOrderingEnabled(editTable.qrOrderingEnabled !== false);
      } else {
        setName("");
        setCapacity("");
        setNote("");
        setAlwaysAvailable(false);
        setQrOrderingEnabled(true);
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
        qrOrderingEnabled,
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

          <label className="flex items-start gap-2 rounded-md border p-3 cursor-pointer hover:bg-muted/40">
            <input
              type="checkbox"
              className="mt-1"
              checked={qrOrderingEnabled}
              onChange={(e) => setQrOrderingEnabled(e.target.checked)}
            />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {t("pages.tables.form.qrOrderingTitle")}
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                {t("pages.tables.form.qrOrderingHint")}
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

// ─── QR Modal ────────────────────────────────────────────────────────────────

const TableQrDialog = ({
  open,
  onClose,
  table,
  shop,
  branch,
  shopId,
  onRegenerated,
}) => {
  const { t } = useTranslation();
  const qrRef = useRef(null);
  const [regenerating, setRegenerating] = useState(false);
  const { confirm } = useAlertDialog();

  const qrUrl = table?.qrUrl
    || (table?.qrToken
      ? `${window.location.origin}/t/${encodeURIComponent(table?.shopSlug || shop?.slug || "shop")}/${table.qrToken}`
      : "");

  const printLabels = useMemo(
    () => ({
      table: t("pages.tables.qr.printTable"),
      scanHint: t("pages.tables.qr.printScanHint"),
      wifi: t("pages.tables.qr.printWifi"),
      wifiPassword: t("pages.tables.qr.printWifiPassword"),
      transfer: t("pages.tables.qr.printTransfer"),
      accountNumber: t("pages.tables.qr.printAccountNumber"),
      accountHolder: t("pages.tables.qr.printAccountHolder"),
      transferNote: t("pages.tables.qr.printTransferNote"),
      payAtCounter: t("pages.tables.qr.printPayAtCounter"),
    }),
    [t],
  );

  const getQrDataUrl = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    return canvas?.toDataURL("image/png") || null;
  };

  const buildPrintParams = (dataUrl) => ({
    shopName: shop?.name,
    shopAddress: shop?.address,
    tableName: table?.name,
    qrDataUrl: dataUrl,
    wifiSsid: branch?.wifiSsid,
    wifiPassword: branch?.wifiPassword,
    paymentBankName: branch?.paymentBankName,
    paymentAccountNumber: branch?.paymentAccountNumber,
    paymentAccountHolder: branch?.paymentAccountHolder,
    paymentTransferNote: branch?.paymentTransferNote,
    labels: printLabels,
  });

  const handleDownload = () => {
    const dataUrl = getQrDataUrl();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-${table.name || table.id}.png`;
    link.click();
  };

  const handlePrint = () => {
    const dataUrl = getQrDataUrl();
    if (!dataUrl) return;
    if (!openTableQrPrintWindow(buildPrintParams(dataUrl))) {
      toast.error(t("pages.tables.qr.printBlocked"));
    }
  };

  const hasWifi = !!(branch?.wifiSsid?.trim());
  const hasPayment = !!(
    branch?.paymentBankName?.trim() || branch?.paymentAccountNumber?.trim()
  );
  const hasPosterInfo = hasWifi || hasPayment;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      toast.success(t("pages.tables.qr.copied"));
    } catch {
      toast.error(t("pages.tables.qr.copyFail"));
    }
  };

  const handleRegenerate = async () => {
    const ok = await confirm(t("pages.tables.qr.regenerateConfirmMsg"), {
      title: t("pages.tables.qr.regenerateConfirmTitle"),
      confirmText: t("pages.tables.qr.regenerateConfirmYes"),
      cancelText: t("pages.tables.form.cancel"),
      variant: "destructive",
    });
    if (!ok) return;
    setRegenerating(true);
    try {
      const res = await regenerateTableQrToken(table.id, shopId);
      const updated = res.data?.data;
      if (updated) onRegenerated?.(updated);
      toast.success(t("pages.tables.qr.regenerateSuccess"));
    } catch (err) {
      toast.error(
        resolveApiError(t, err) || t("pages.tables.qr.regenerateFail"),
      );
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {t("pages.tables.qr.title", { name: table?.name || "" })}
          </DialogTitle>
          <DialogDescription>{t("pages.tables.qr.desc")}</DialogDescription>
        </DialogHeader>

        {qrUrl ? (
          <div className="flex flex-col gap-4">
            <div className="mx-auto w-full max-w-[280px] rounded-lg border bg-muted/30 p-4 space-y-2.5">
              {shop?.name ? (
                <p className="text-center font-semibold text-base">{shop.name}</p>
              ) : null}
              <p className="text-center text-sm text-muted-foreground">
                {t("pages.tables.qr.printTable")}:{" "}
                <span className="font-medium text-foreground">{table?.name}</span>
              </p>
              <div
                ref={qrRef}
                className="flex justify-center rounded-md border bg-white p-3 mx-auto w-fit"
              >
                <QRCodeCanvas value={qrUrl} size={168} level="M" includeMargin />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {t("pages.tables.qr.printScanHint")}
              </p>
              {shop?.address?.trim() ? (
                <p className="text-[11px] text-center text-muted-foreground leading-snug">
                  {shop.address}
                </p>
              ) : null}
              {(hasWifi || hasPayment) && (
                <div className="text-xs space-y-1 pt-1">
                  {hasWifi ? (
                    <p>
                      <span className="text-muted-foreground">
                        {t("pages.tables.qr.printWifi")}:{" "}
                      </span>
                      <span className="font-medium">{branch.wifiSsid}</span>
                      {branch.wifiPassword?.trim() ? (
                        <span className="text-muted-foreground">
                          {" "}
                          · {t("pages.tables.qr.printWifiPassword")}:{" "}
                          <span className="font-medium text-foreground">
                            {branch.wifiPassword}
                          </span>
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                  {hasPayment ? (
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground">
                        {t("pages.tables.qr.printTransfer")}
                      </p>
                      {branch.paymentBankName?.trim() ? (
                        <p className="font-medium">{branch.paymentBankName}</p>
                      ) : null}
                      {branch.paymentAccountNumber?.trim() ? (
                        <p>
                          {t("pages.tables.qr.printAccountNumber")}:{" "}
                          <span className="font-mono font-medium">
                            {branch.paymentAccountNumber}
                          </span>
                        </p>
                      ) : null}
                      {branch.paymentAccountHolder?.trim() ? (
                        <p>
                          {t("pages.tables.qr.printAccountHolder")}:{" "}
                          {branch.paymentAccountHolder}
                        </p>
                      ) : null}
                      {branch.paymentTransferNote?.trim() ? (
                        <p className="italic text-muted-foreground">
                          {branch.paymentTransferNote}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
              <p className="text-[11px] text-center text-muted-foreground italic">
                {t("pages.tables.qr.printPayAtCounter")}
              </p>
            </div>

            {!hasPosterInfo ? (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                {t("pages.tables.qr.configureBranchHint")}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 justify-center w-full">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-1" />
                {t("pages.tables.qr.copy")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                {t("pages.tables.qr.download")}
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" />
                {t("pages.tables.qr.printPoster")}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-center py-4 text-muted-foreground">
            {t("pages.tables.qr.missing")}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            {t("pages.tables.form.close")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            {t("pages.tables.qr.regenerate")}
          </Button>
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
  onShowQr,
}) => {
  const { t } = useTranslation();
  const canManage = canUpdate || canDelete;
  const cfg = tableStatuses[table.status] || tableStatuses.AVAILABLE;
  const isOccupied = table.status === "OCCUPIED";
  const isAlwaysAvailable = !!table.alwaysAvailable;
  const isClosed = table.status === "CLOSED";

  const openPos = () => {
    if (isClosed) return;
    onOpenPos?.(table);
  };

  const stopCardNavigation = (e) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={`relative py-0 gap-0 transition-shadow hover:shadow-md ${
        isClosed ? "opacity-80" : ""
      } ${isOccupied ? "ring-2 " + cfg.ring : ""}`}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            disabled={isClosed}
            onClick={openPos}
            className={`flex items-center gap-2 min-w-0 flex-1 text-left rounded-md -m-1 p-1 transition-colors ${
              isClosed
                ? "cursor-not-allowed"
                : "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            }`}
          >
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
          </button>
          <div
            className="shrink-0"
            onClick={stopCardNavigation}
            onPointerDown={stopCardNavigation}
          >
          <DropdownMenu modal>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0"
                onClick={stopCardNavigation}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-background w-44"
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <DropdownMenuLabel>{t("pages.tables.card.actions")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onShowQr?.(table)}>
                <QrCode className="h-4 w-4 mr-2" /> {t("pages.tables.card.showQr")}
              </DropdownMenuItem>
              {canManage && !isOccupied && (
                <>
                {canUpdate && (
                  <DropdownMenuItem onSelect={() => onEdit(table)}>
                    <Pencil className="h-4 w-4 mr-2" /> {t("pages.tables.card.edit")}
                  </DropdownMenuItem>
                )}
                {canUpdate && table.status !== "AVAILABLE" && !isOccupied && (
                  <DropdownMenuItem
                    onSelect={() => onStatusChange(table, "AVAILABLE")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    {t("pages.tables.card.openTable")}
                  </DropdownMenuItem>
                )}
                {canUpdate && table.status !== "CLOSED" && !isOccupied && (
                  <DropdownMenuItem
                    onSelect={() => onStatusChange(table, "CLOSED")}
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
                      onSelect={() => onDelete(table)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> {t("pages.tables.card.delete")}
                    </DropdownMenuItem>
                  </>
                )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>

        <button
          type="button"
          disabled={isClosed}
          onClick={openPos}
          className={`flex items-center justify-between w-full text-left rounded-md -mx-1 px-1 py-0.5 ${
            isClosed
              ? "cursor-not-allowed"
              : "cursor-pointer hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          }`}
        >
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
        </button>

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
    selectedShop,
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
  const [qrTable, setQrTable] = useState(null);

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
        <ListPageHeader
          icon={Armchair}
          title={t("pages.tables.title")}
          subtitle={
            selectedBranch
              ? t("pages.tables.branchSubtitle", { name: selectedBranch.name })
              : t("pages.tables.branchSubtitleEmpty")
          }
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              {branches.length > 1 && (
                <Select
                  value={selectedBranchId ?? ""}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
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
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" /> {t("pages.tables.addTable")}
                </Button>
              )}
            </div>
          }
        />

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
                    onShowQr={(tbl) => setQrTable(tbl)}
                    onOpenPos={(t) => {
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

      <TableQrDialog
        open={!!qrTable}
        onClose={() => setQrTable(null)}
        table={
          qrTable
            ? { ...qrTable, shopSlug: qrTable.shopSlug || selectedShop?.slug }
            : null
        }
        shop={selectedShop}
        branch={selectedBranch}
        shopId={selectedShopId}
        onRegenerated={(updated) => {
          setQrTable(updated);
          setTables((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
          );
        }}
      />
    </div>
  );
};

export default TableListPage;
