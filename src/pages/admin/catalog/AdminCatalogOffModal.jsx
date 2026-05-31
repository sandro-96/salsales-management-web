import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  browseAdminCatalogOpenFoodFactsVietnam,
  bulkUpsertAdminCatalog,
} from "@/api/adminApi";

const PAGE_SIZE = 24;

function mergeItems(prev, incoming) {
  const seen = new Set(prev.map((i) => i.barcode));
  const added = (incoming || []).filter((i) => i.barcode && !seen.has(i.barcode));
  return [...prev, ...added];
}

export default function AdminCatalogOffModal({ open, onOpenChange, onImported }) {
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [importing, setImporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasMore = nextPage <= totalPages;

  const loadFirst = useCallback(async () => {
    setLoading(true);
    setItems([]);
    setSelected(new Set());
    setNextPage(1);
    setTotalCount(0);
    try {
      const res = await browseAdminCatalogOpenFoodFactsVietnam({
        page: 1,
        page_size: PAGE_SIZE,
      });
      if (res.data?.success) {
        const d = res.data.data;
        setItems(d.items || []);
        setTotalCount(d.totalCount ?? 0);
        setNextPage(2);
      } else {
        toast.error(res.data?.message || "Không tải được danh sách OFF");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Không kết nối Open Food Facts. Thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await browseAdminCatalogOpenFoodFactsVietnam({
        page: nextPage,
        page_size: PAGE_SIZE,
      });
      if (res.data?.success) {
        const d = res.data.data;
        setItems((prev) => mergeItems(prev, d.items));
        if (d.totalCount != null) setTotalCount(d.totalCount);
        setNextPage((p) => p + 1);
      } else {
        toast.error(res.data?.message || "Không tải thêm được");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Không kết nối Open Food Facts. Thử lại sau.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, nextPage]);

  useEffect(() => {
    if (open) loadFirst();
  }, [open, loadFirst]);

  const selectableItems = useMemo(
    () => items.filter((i) => !i.alreadyInCatalog),
    [items],
  );

  const allSelectableChecked =
    selectableItems.length > 0 &&
    selectableItems.every((i) => selected.has(i.barcode));

  const toggleAll = (checked) => {
    if (!checked) {
      setSelected((prev) => {
        const next = new Set(prev);
        for (const i of selectableItems) {
          next.delete(i.barcode);
        }
        return next;
      });
      return;
    }
    setSelected((prev) => {
      const next = new Set(prev);
      for (const i of selectableItems) {
        next.add(i.barcode);
      }
      return next;
    });
  };

  const toggleOne = (barcode, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(barcode);
      else next.delete(barcode);
      return next;
    });
  };

  const handleImport = async () => {
    const picked = items.filter((i) => selected.has(i.barcode));
    if (picked.length === 0) {
      toast.error("Chọn ít nhất một sản phẩm chưa có trong catalog");
      return;
    }
    setImporting(true);
    try {
      const payload = picked.map((i) => ({
        barcode: i.barcode,
        name: i.name,
        category: i.category || null,
        description: i.description || null,
        images: i.images || [],
      }));
      const res = await bulkUpsertAdminCatalog(payload);
      const result = res.data?.data;
      const imported = result?.imported ?? 0;
      const failed = result?.failed ?? 0;
      if (imported > 0) {
        toast.success(`Đã thêm ${imported} mục vào catalog`);
        onImported?.();
        // Đánh dấu đã có; bỏ chọn (giữ danh sách đã tải)
        setItems((prev) =>
          prev.map((row) =>
            picked.some((p) => p.barcode === row.barcode)
              ? { ...row, alreadyInCatalog: true }
              : row,
          ),
        );
        setSelected((prev) => {
          const next = new Set(prev);
          for (const row of picked) {
            next.delete(row.barcode);
          }
          return next;
        });
      }
      if (failed > 0) {
        const detail = (result?.errors || []).slice(0, 3).join("; ");
        toast.warning(
          `${failed} mục thất bại${detail ? `: ${detail}` : ""}`,
        );
      }
      if (imported === 0 && failed === 0) {
        toast.info("Không có mục nào được nhập");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Nhập catalog thất bại");
    } finally {
      setImporting(false);
    }
  };

  const showInitialSpinner = loading && items.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Open Food Facts — Việt Nam</DialogTitle>
          <DialogDescription>
            Chọn sản phẩm cần thêm vào catalog. Dùng「Tải thêm」để nạp trang
            tiếp — các mục đã chọn vẫn giữ. Giới hạn ~10 lần gọi/phút từ OFF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto border rounded-md min-h-[240px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelectableChecked}
                    onCheckedChange={(v) => toggleAll(!!v)}
                    disabled={showInitialSpinner || selectableItems.length === 0}
                    aria-label="Chọn tất cả chưa có trong catalog"
                  />
                </TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showInitialSpinner && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin inline-block" />
                  </TableCell>
                </TableRow>
              )}
              {!showInitialSpinner && items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Không có sản phẩm.
                  </TableCell>
                </TableRow>
              )}
              {items.map((row, idx) => {
                const inCatalog = !!row.alreadyInCatalog;
                return (
                  <TableRow
                    key={row.barcode}
                    className={inCatalog ? "opacity-70" : undefined}
                  >
                    <TableCell className="text-center text-muted-foreground tabular-nums text-sm">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={inCatalog || selected.has(row.barcode)}
                        onCheckedChange={(v) => toggleOne(row.barcode, !!v)}
                        disabled={inCatalog}
                        aria-label={
                          inCatalog
                            ? `${row.name} — đã có trong catalog`
                            : `Chọn ${row.name}`
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{row.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.barcode}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.category || "—"}
                    </TableCell>
                    <TableCell>
                      {inCatalog ? (
                        <Badge variant="secondary">Đã có trong hệ thống</Badge>
                      ) : (
                        <Badge variant="outline">Mới</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Đang tải thêm…
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground">
          <span>
            Đã tải {items.length}
            {totalCount > 0 ? ` / ~${totalCount}` : ""} trên OFF
            {selected.size > 0 ? ` · Đã chọn ${selected.size}` : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore || loading || loadingMore}
            onClick={loadMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Đang tải…
              </>
            ) : (
              "Tải thêm"
            )}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            onClick={handleImport}
            disabled={importing || selected.size === 0}
          >
            {importing && (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            )}
            Thêm {selected.size} mục đã chọn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
