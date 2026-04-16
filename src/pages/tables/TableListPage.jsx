import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Armchair,
  Plus,
  Loader2,
  MoreHorizontal,
  Users,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Lock,
  Search,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { useShop } from "../../hooks/useShop.js";
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

// ─── Constants ───────────────────────────────────────────────────────────────

const TABLE_STATUSES = {
  AVAILABLE: {
    label: "Trống",
    icon: CheckCircle2,
    cls: "bg-emerald-100 text-emerald-700 border-emerald-300",
    ring: "ring-emerald-300",
  },
  OCCUPIED: {
    label: "Đang phục vụ",
    icon: Users,
    cls: "bg-amber-100 text-amber-700 border-amber-300",
    ring: "ring-amber-300",
  },
  CLOSED: {
    label: "Đã đóng",
    icon: Lock,
    cls: "bg-gray-100 text-gray-600 border-gray-300",
    ring: "ring-gray-300",
  },
};

// ─── Table Status Badge ──────────────────────────────────────────────────────

const TableStatusBadge = ({ status }) => {
  const cfg = TABLE_STATUSES[status] || TABLE_STATUSES.AVAILABLE;
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
}) => {
  const isEdit = !!editTable;
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
      toast.error("Tên bàn không được để trống.");
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
        toast.success("Cập nhật bàn thành công.");
      } else {
        data.status = "AVAILABLE";
        await createTable(shopId, data);
        toast.success("Tạo bàn thành công.");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đã xảy ra lỗi.");
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
            {isEdit ? "Chỉnh sửa bàn" : "Thêm bàn mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin bàn." : "Tạo bàn mới cho chi nhánh."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Tên bàn *</Label>
            <Input
              id="table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Bàn 01"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-capacity">Sức chứa (người)</Label>
            <NumericInput
              id="table-capacity"
              value={capacity}
              onChange={setCapacity}
              formatted={false}
              placeholder="VD: 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-note">Ghi chú</Label>
            <Textarea
              id="table-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Bàn VIP gần cửa sổ"
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
                Bàn luôn trống (không chuyển sang “Đang phục vụ”)
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                Dùng cho các “bàn ảo” như{" "}
                <span className="font-medium">Mang đi</span>: trạng thái bàn
                luôn hiển thị trống, không gắn một đơn lên bàn — có thể có nhiều
                đơn mở cùng lúc (POS quản lý theo tab/đơn).
              </p>
            </div>
          </label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {isEdit ? "Lưu thay đổi" : "Tạo bàn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Table Card ──────────────────────────────────────────────────────────────

const TableCard = ({
  table,
  canManage,
  isOwner,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenPos,
}) => {
  const cfg = TABLE_STATUSES[table.status] || TABLE_STATUSES.AVAILABLE;
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
                  <Users className="h-3 w-3" /> {table.capacity} người
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
                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onEdit(table)}
                  disabled={isOccupied}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Chỉnh sửa
                </DropdownMenuItem>
                {table.status !== "AVAILABLE" && !isOccupied && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(table, "AVAILABLE")}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" />{" "}
                    Mở bàn
                  </DropdownMenuItem>
                )}
                {table.status !== "CLOSED" && !isOccupied && (
                  <DropdownMenuItem
                    onClick={() => onStatusChange(table, "CLOSED")}
                  >
                    <Lock className="h-4 w-4 mr-2 text-gray-600" /> Đóng bàn
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 focus:bg-red-100 focus:text-red-700"
                      onClick={() => onDelete(table)}
                      disabled={isOccupied}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Xóa bàn
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <TableStatusBadge status={table.status} />
            {isAlwaysAvailable && (
              <Badge className="text-[10px] bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100">
                Luôn trống
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
  const navigate = useNavigate();
  const {
    selectedShopId,
    selectedBranchId,
    selectedBranch,
    branches,
    setSelectedBranchId,
    isOwner,
    isStaff,
  } = useShop();
  const { confirm } = useAlertDialog();
  const canManage = isOwner || isStaff;

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    if (!selectedShopId || !selectedBranchId) return;
    setLoading(true);
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
      toast.error("Không thể tải danh sách bàn.");
    } finally {
      setLoading(false);
    }
  }, [selectedShopId, selectedBranchId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

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
      `Bạn có chắc muốn xóa "${table.name}"? Hành động này không thể hoàn tác.`,
      {
        title: "Xóa bàn",
        confirmText: "Xóa",
        cancelText: "Hủy",
        variant: "destructive",
      },
    );
    if (!ok) return;
    try {
      await deleteTable(table.id, selectedShopId);
      toast.success("Đã xóa bàn.");
      fetchTables();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa bàn.");
    }
  };

  const handleStatusChange = async (table, newStatus) => {
    try {
      await updateTableStatus(table.id, selectedShopId, newStatus);
      toast.success(
        `Đã cập nhật trạng thái: ${TABLE_STATUSES[newStatus]?.label || newStatus}`,
      );
      fetchTables();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể cập nhật trạng thái.",
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
              Quản lý bàn
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedBranch
                ? `Chi nhánh: ${selectedBranch.name}`
                : "Chọn chi nhánh để xem danh sách bàn"}
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
                  <SelectValue placeholder="Chọn chi nhánh" />
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
            {isOwner && !noBranch && (
              <Button
                onClick={() => {
                  setEditingTable(null);
                  setFormOpen(true);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Thêm bàn
              </Button>
            )}
          </div>
        </div>

        {/* ── No branch ───────────────────────────────────────────── */}
        {noBranch ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Warehouse className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold">Chưa chọn chi nhánh</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Vui lòng chọn một chi nhánh để xem và quản lý bàn.
            </p>
          </div>
        ) : (
          <>
            {/* ── Stats ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-violet-100 text-violet-600">
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
                      Tổng bàn
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-emerald-100 text-emerald-600">
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
                    <p className="text-xs text-muted-foreground mt-1">Trống</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="py-4 gap-3">
                <CardContent className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-11 w-11 rounded-xl shrink-0 bg-amber-100 text-amber-600">
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
                      Đang phục vụ
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
                      Đã đóng
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
                  placeholder="Tìm bàn..."
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
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {Object.entries(TABLE_STATUSES).map(([key, cfg]) => (
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
                    canManage={canManage}
                    isOwner={isOwner}
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
                    ? "Không tìm thấy bàn phù hợp."
                    : "Chưa có bàn nào. Hãy thêm bàn mới."}
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
        onSuccess={fetchTables}
      />
    </div>
  );
};

export default TableListPage;
