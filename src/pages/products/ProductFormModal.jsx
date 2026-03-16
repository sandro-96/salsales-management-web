import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Camera, CameraOff, RefreshCw, Keyboard, Loader2 } from "lucide-react";
import ProductForm from "./ProductForm.jsx";
import { createProduct, updateProduct } from "../../api/productApi.js";
import { lookupBarcode } from "@/utils/barcodeUtils.js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Modal tạo / chỉnh sửa sản phẩm.
 * Khi tạo mới: bước 1 = quét mã vạch (camera inline), bước 2 = form điền thông tin.
 * Khi sửa: mở thẳng form.
 */
export default function ProductFormModal({
  open,
  onClose,
  product,
  shopId,
  onSuccess,
  startStep, // "scan" | "form" — overrides default for create mode
}) {
  const isEdit = !!product;

  // step: "scan" | "form"
  const [step, setStep] = useState(
    () => startStep ?? (isEdit ? "form" : "scan"),
  );
  const [prefill, setPrefill] = useState({});
  const [mode, setMode] = useState(() => (product ? "view" : "create"));
  const [loading, setLoading] = useState(false);

  // Camera state
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [cameraIdx, setCameraIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);

  // Reset on open/product change
  useEffect(() => {
    if (open) {
      setMode(product ? "view" : "create");
      setStep(startStep ?? (isEdit ? "form" : "scan"));
      setPrefill({});
      setScannedCode(null);
      setScanError(null);
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product]);

  // Start/stop camera when step changes
  useEffect(() => {
    if (step === "scan" && open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, open, cameraIdx]);

  const startCamera = async () => {
    setScanning(false);
    setScanError(null);
    setScannedCode(null);
    try {
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);

      const deviceId = devices[cameraIdx]?.deviceId ?? undefined;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            handleScanned(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scan error:", err);
          }
        },
      );
      setScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      if (err?.name === "NotAllowedError") {
        setScanError(
          "Trình duyệt bị từ chối quyền camera. Vui lòng cấp quyền và thử lại.",
        );
      } else if (err?.name === "NotFoundError") {
        setScanError("Không tìm thấy camera trên thiết bị này.");
      } else {
        setScanError("Không thể khởi động camera.");
      }
    }
  };

  const stopCamera = () => {
    try {
      readerRef.current?.reset();
    } catch {
      /* ignore */
    }
    readerRef.current = null;
    setScanning(false);
  };

  const handleScanned = async (barcode) => {
    stopCamera();
    setScannedCode(barcode);
    setLookingUp(true);
    try {
      const info = await lookupBarcode(barcode);
      setPrefill({
        barcode,
        name: info?.name ?? "",
        category: info?.category ?? "",
        description: info?.description ?? "",
      });
      if (info?.name) {
        toast.success(`Tìm thấy: "${info.name}"`);
      } else {
        toast.success(`Quét được: ${barcode}`);
      }
    } finally {
      setLookingUp(false);
      setStep("form");
    }
  };

  const handleSkip = () => {
    stopCamera();
    setPrefill({});
    setStep("form");
  };

  const handleSubmit = async (data, files = []) => {
    try {
      setLoading(true);
      if (isEdit) {
        const res = await updateProduct(shopId, product.productId, data, files);
        if (res.data?.success) {
          toast.success("Cập nhật sản phẩm thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Cập nhật thất bại.");
        }
      } else {
        const res = await createProduct(shopId, data, files);
        if (res.data?.success) {
          toast.success("Thêm sản phẩm thành công.");
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(res.data?.message || "Thêm sản phẩm thất bại.");
        }
      }
    } catch (err) {
      console.error("ProductFormModal error:", err);
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent
        className={cn(
          "flex flex-col",
          step === "scan" ? "sm:max-w-[480px]" : "sm:max-w-[720px] h-[90vh]",
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {step === "scan"
              ? "Quét mã vạch sản phẩm"
              : !isEdit
                ? "Thêm sản phẩm mới"
                : mode === "view"
                  ? "Chi tiết sản phẩm"
                  : "Chỉnh sửa sản phẩm"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {step === "scan"
              ? "Đưa mã vạch sản phẩm vào khung camera để quét tự động."
              : isEdit
                ? "Chỉnh sửa thông tin sản phẩm."
                : "Điền thông tin để thêm sản phẩm mới."}
          </DialogDescription>
        </DialogHeader>

        {/* ─── SCAN STEP ──────────────────────────────────────────────── */}
        {step === "scan" && (
          <div className="flex flex-col gap-4">
            {/* Camera viewport */}
            <div className="relative bg-black rounded-lg overflow-hidden w-full aspect-[4/3]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Scan frame */}
              {scanning && !scanError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-56 h-36">
                    <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                    <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                    <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                    <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                    <div className="absolute left-1 right-1 h-0.5 bg-primary/80 animate-scan-line" />
                  </div>
                </div>
              )}

              {/* Error */}
              {scanError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 px-6 text-center">
                  <CameraOff className="h-10 w-10 text-red-400" />
                  <p className="text-sm text-red-300">{scanError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setScanError(null);
                      startCamera();
                    }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Thử lại
                  </Button>
                </div>
              )}

              {/* Looking up overlay */}
              {lookingUp && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white">
                    Đang tra cứu thông tin...
                  </p>
                  <p className="text-xs text-white/60 font-mono">
                    {scannedCode}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <p
                className={cn(
                  "text-sm text-muted-foreground",
                  scanning && "animate-pulse",
                )}
              >
                {scanning
                  ? "Đưa mã vạch vào khung để quét..."
                  : scanError
                    ? "Không thể khởi động camera"
                    : "Đang khởi động camera..."}
              </p>
              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setCameraIdx((i) => (i + 1) % cameras.length)
                    }
                    title="Đổi camera"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleSkip}>
                  <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                  Nhập thủ công
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FORM STEP ──────────────────────────────────────────────── */}
        {step === "form" && (
          <div className="flex-1 overflow-y-auto pr-1">
            <ProductForm
              mode={mode}
              product={product}
              prefill={prefill}
              onSubmit={handleSubmit}
              isLoading={loading}
              onModeChange={setMode}
              onCancel={handleClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
