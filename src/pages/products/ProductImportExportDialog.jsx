import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
  X,
  FileDown,
} from "lucide-react";
import { exportProductsExcel, importProductsExcel } from "@/api/productApi.js";
import { generateProductTemplate } from "@/utils/generateProductTemplate.js";

const NONE_VALUE = "__none__";

/**
 * Dialog Import / Export sản phẩm qua Excel
 *
 * Props:
 *  open       – boolean
 *  onClose    – () => void
 *  shopId     – string
 *  branches   – Branch[]   ({ id, name })
 *  onImportSuccess – () => void  (gọi lại để refresh bảng)
 */
const ProductImportExportDialog = ({
  open,
  onClose,
  shopId,
  branches = [],
  onImportSuccess,
}) => {
  /* ── Export state ─────────────────────────────────────────────────────── */
  const [exportBranchId, setExportBranchId] = useState(NONE_VALUE);
  const [isExporting, setIsExporting] = useState(false);

  /* ── Import state ─────────────────────────────────────────────────────── */
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleExport = async () => {
    if (!shopId) return;
    setIsExporting(true);
    try {
      const branchId = exportBranchId === NONE_VALUE ? null : exportBranchId;
      const res = await exportProductsExcel(shopId, branchId);
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = branchId
        ? `products_branch_${branchId}.xlsx`
        : `products_shop_${shopId}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Xuất file Excel thành công.");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Xuất file thất bại. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    setImportFile(file);
  };

  const handleImport = async () => {
    if (!shopId || !importFile) return;
    setIsImporting(true);
    try {
      const res = await importProductsExcel(shopId, importFile);
      const count = res.data?.data ?? 0;
      toast.success(`Đã nhập ${count} sản phẩm thành công.`);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onImportSuccess?.();
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        toast.error(
          "File không hợp lệ hoặc dữ liệu sai định dạng. Kiểm tra lại file Excel.",
        );
      } else if (status === 403) {
        toast.error("Bạn không có quyền nhập sản phẩm.");
      } else {
        toast.error("Nhập sản phẩm thất bại. Vui lòng thử lại.");
      }
      console.error("Import error:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (isImporting || isExporting || isGeneratingTemplate) return;
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import / Export Excel
          </DialogTitle>
          <DialogDescription>
            Nhập hoặc xuất danh sách sản phẩm qua file Excel.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-1.5" />
              Nhập
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-1.5" />
              Xuất
            </TabsTrigger>
          </TabsList>

          {/* ── IMPORT TAB ──────────────────────────────────────────────── */}
          <TabsContent value="import" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-branch">
                Chi nhánh <span className="text-red-500">*</span>
              </Label>
              <span className="text-muted-foreground">
                Không cần chọn chi nhánh
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-file">
                File Excel (.xlsx / .xls){" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className="relative flex items-center gap-2 rounded-md border border-dashed p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {importFile ? importFile.name : "Nhấn để chọn file..."}
                </span>
                {importFile && (
                  <button
                    type="button"
                    className="ml-auto shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Chưa có file mẫu?{" "}
              <button
                type="button"
                className="underline hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGeneratingTemplate}
                onClick={async () => {
                  setIsGeneratingTemplate(true);
                  try {
                    await generateProductTemplate();
                  } catch {
                    toast.error("Không thể tạo file mẫu.");
                  } finally {
                    setIsGeneratingTemplate(false);
                  }
                }}
              >
                {isGeneratingTemplate ? "Đang tạo..." : "Tải file mẫu (.xlsx)"}
              </button>
            </p>

            <p className="text-xs text-muted-foreground">
              Các dòng lỗi sẽ bị bỏ qua, số sản phẩm nhập thành công sẽ hiển thị
              sau khi hoàn thành.
            </p>

            <Button
              onClick={handleImport}
              disabled={!importFile || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {isImporting ? "Đang nhập..." : "Nhập sản phẩm"}
            </Button>
          </TabsContent>

          {/* ── EXPORT TAB ──────────────────────────────────────────────── */}
          <TabsContent value="export" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="export-branch">Chi nhánh</Label>
              <Select value={exportBranchId} onValueChange={setExportBranchId}>
                <SelectTrigger id="export-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    Toàn cửa hàng (không chọn chi nhánh)
                  </SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {exportBranchId === NONE_VALUE
                  ? "Xuất toàn bộ sản phẩm cấp shop. Các cột tồn kho / giá chi nhánh sẽ để trống."
                  : "Xuất kèm giá bán, tồn kho và thông tin tại chi nhánh đã chọn."}
              </p>
            </div>

            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? "Đang xuất..." : "Tải file Excel"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportExportDialog;
