// src/pages/admin/catalog/AdminCatalogPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Globe, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import Loading from "@/components/loading/Loading";

import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { ADMIN_PERM } from "@/constants/adminPermissions";
import {
  deleteAdminCatalog,
  listAdminCatalog,
  upsertAdminCatalog,
} from "@/api/adminApi";
import AdminCatalogOffModal from "./AdminCatalogOffModal";

const fmt = (d) => {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return d;
  }
};

const emptyForm = {
  barcode: "",
  name: "",
  category: "",
  description: "",
  images: "",
};

export default function AdminCatalogPage() {
  const { hasAdminPermission, loading: permLoading } = useAdminPermissions();
  const canManage = hasAdminPermission(ADMIN_PERM.CATALOG_MANAGE);

  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") || 0);
  const size = 20;
  const [keyword, setKeyword] = useState(sp.get("keyword") || "");
  const [category, setCategory] = useState(sp.get("category") || "");

  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editMode, setEditMode] = useState("create");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [offOpen, setOffOpen] = useState(false);

  const load = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    try {
      const params = { page, size, sort: "updatedAt,desc" };
      const kw = sp.get("keyword");
      const cat = sp.get("category");
      if (kw) params.keyword = kw;
      if (cat) params.category = cat;
      const res = await listAdminCatalog(params);
      if (res.data?.success) setData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được catalog");
    } finally {
      setLoading(false);
    }
  }, [canManage, page, sp]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearch = () => {
    const n = new URLSearchParams(sp);
    if (keyword.trim()) n.set("keyword", keyword.trim());
    else n.delete("keyword");
    if (category.trim()) n.set("category", category.trim());
    else n.delete("category");
    n.set("page", "0");
    setSp(n);
  };

  const openCreate = () => {
    setEditMode("create");
    setEditForm(emptyForm);
    setEditOpen(true);
  };

  const openEdit = (row) => {
    setEditMode("edit");
    setEditForm({
      barcode: row.barcode || "",
      name: row.name || "",
      category: row.category || "",
      description: row.description || "",
      images: (row.images || []).join("\n"),
    });
    setEditOpen(true);
  };

  const handleSubmit = async () => {
    if (!editForm.barcode.trim() || !editForm.name.trim()) {
      toast.error("Barcode và tên không được trống");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        barcode: editForm.barcode.trim(),
        name: editForm.name.trim(),
        category: editForm.category.trim() || null,
        description: editForm.description || null,
        images: editForm.images
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await upsertAdminCatalog(payload);
      toast.success(
        editMode === "create" ? "Đã tạo catalog" : "Đã cập nhật catalog",
      );
      setEditOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lưu catalog thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminCatalog(deleteTarget.id);
      toast.success("Đã xoá catalog");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Xoá thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil((data.totalElements || 0) / size));

  if (permLoading) return <Loading />;
  if (!canManage) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Catalog</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Bạn không có quyền CATALOG_MANAGE.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Product catalog</h1>
          <p className="text-sm text-muted-foreground">
            Danh mục barcode dùng chung hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setOffOpen(true)}>
            <Globe className="h-4 w-4 mr-1" />
            Lấy từ Open Food Facts (VN)
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Thêm mới
          </Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <Label>Từ khoá (tên / barcode)</Label>
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Ví dụ: Coca Cola hoặc 89300..."
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
        </div>
        <div className="w-full md:w-64">
          <Label>Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Đồ uống, Thực phẩm, ..."
          />
        </div>
        <Button onClick={onSearch}>Tìm</Button>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Barcode</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cập nhật</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                </TableCell>
              </TableRow>
            )}
            {!loading && data.content?.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Không có catalog phù hợp.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              data.content?.map((row, idx) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center text-muted-foreground tabular-nums">
                    {page * size + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{row.name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.barcode}
                  </TableCell>
                  <TableCell>
                    {row.category ? (
                      <Badge variant="secondary">{row.category}</Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmt(row.updatedAt || row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(row)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">
          Trang {page + 1} / {totalPages} · Tổng {data.totalElements || 0}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 0}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page - 1));
            setSp(n);
          }}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => {
            const n = new URLSearchParams(sp);
            n.set("page", String(page + 1));
            setSp(n);
          }}
        >
          Sau
        </Button>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editMode === "create" ? "Thêm catalog" : "Sửa catalog"}
            </DialogTitle>
            <DialogDescription>
              Upsert theo barcode. Nếu barcode đã tồn tại, các trường sẽ được ghi đè.
            </DialogDescription>
          </DialogHeader>
          <CardContent className="space-y-3 px-0">
            <div className="space-y-1">
              <Label>Barcode *</Label>
              <Input
                value={editForm.barcode}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, barcode: e.target.value }))
                }
                disabled={editMode === "edit"}
                placeholder="8934001..."
              />
            </div>
            <div className="space-y-1">
              <Label>Tên *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Category</Label>
              <Input
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, category: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Ảnh (mỗi dòng 1 URL)</Label>
              <Textarea
                rows={3}
                value={editForm.images}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, images: e.target.value }))
                }
              />
            </div>
          </CardContent>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminCatalogOffModal
        open={offOpen}
        onOpenChange={setOffOpen}
        onImported={load}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá catalog</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xoá{" "}
              <span className="font-semibold">{deleteTarget?.name}</span> (
              {deleteTarget?.barcode})?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              Xoá
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
