import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { exportProductsExcel, importProductsExcel } from "@/api/productApi.js";
import { generateProductTemplate } from "@/utils/generateProductTemplate.js";

const NONE_VALUE = "__none__";

const ProductImportExportDialog = ({
  open,
  onClose,
  shopId,
  branches = [],
  onImportSuccess,
}) => {
  const { t } = useTranslation();
  const [exportBranchId, setExportBranchId] = useState(NONE_VALUE);
  const [isExporting, setIsExporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

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
      toast.success(t("pages.products.importExport.exportSuccess"));
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("pages.products.importExport.exportFail"));
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
      toast.success(t("pages.products.importExport.importSuccess", { count }));
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onImportSuccess?.();
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 400) {
        toast.error(t("pages.products.importExport.importInvalidFile"));
      } else if (status === 403) {
        toast.error(t("pages.products.importExport.importForbidden"));
      } else {
        toast.error(t("pages.products.importExport.importFail"));
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
            {t("pages.products.importExport.title")}
          </DialogTitle>
          <DialogDescription>
            {t("pages.products.importExport.description")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-1.5" />
              {t("pages.products.importExport.tabImport")}
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-1.5" />
              {t("pages.products.importExport.tabExport")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-branch">
                {t("pages.products.importExport.branchLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <span className="text-muted-foreground text-sm">
                {t("pages.products.importExport.branchHint")}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="import-file">
                {t("pages.products.importExport.fileLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div
                className="relative flex items-center gap-2 rounded-md border border-dashed p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">
                  {importFile
                    ? importFile.name
                    : t("pages.products.importExport.chooseFile")}
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
              {t("pages.products.importExport.templateHint")}{" "}
              <button
                type="button"
                className="underline hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGeneratingTemplate}
                onClick={async () => {
                  setIsGeneratingTemplate(true);
                  try {
                    await generateProductTemplate();
                  } catch {
                    toast.error(t("pages.products.importExport.templateFail"));
                  } finally {
                    setIsGeneratingTemplate(false);
                  }
                }}
              >
                {isGeneratingTemplate
                  ? t("pages.products.importExport.generatingTemplate")
                  : t("pages.products.importExport.downloadTemplate")}
              </button>
            </p>

            <p className="text-xs text-muted-foreground">
              {t("pages.products.importExport.importNote")}
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
              {isImporting
                ? t("pages.products.importExport.importing")
                : t("pages.products.importExport.importBtn")}
            </Button>
          </TabsContent>

          <TabsContent value="export" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="export-branch">
                {t("pages.products.importExport.exportBranch")}
              </Label>
              <Select value={exportBranchId} onValueChange={setExportBranchId}>
                <SelectTrigger id="export-branch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>
                    {t("pages.products.importExport.exportAllShop")}
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
                  ? t("pages.products.importExport.exportAllHint")
                  : t("pages.products.importExport.exportBranchHint")}
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
              {isExporting
                ? t("pages.products.importExport.exporting")
                : t("pages.products.importExport.exportBtn")}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportExportDialog;
