import { useState, useEffect, useRef, useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const EMPTY_PREFILL_DEFAULTS = {};

/**
 * Modal tạo / chỉnh sửa sản phẩm.
 * Khi tạo mới: bước 1 = quét mã vạch (camera inline), bước 2 = form điền thông tin.
 * Khi sửa: mở thẳng form.
 *
 * @param {Object} [prefillDefaults] - Gộp vào prefill form tạo mới (VD: { trackInventory: true });
 *                                   giá trị từ quét mã vạch ghi đè cùng key.
 * @param {"view"|"edit"} [initialMode] - Chế độ form khi mở sản phẩm có sẵn (mặc định view).
 */
export default function ProductFormModal({
  open,
  onClose,
  product,
  shopId,
  onSuccess,
  startStep, // "scan" | "form" — overrides default for create mode
  prefillDefaults,
  initialMode = "view",
}) {
  const { t } = useTranslation();
  const isEdit = !!product;

  const effectivePrefillDefaults =
    prefillDefaults &&
    typeof prefillDefaults === "object" &&
    Object.keys(prefillDefaults).length > 0
      ? prefillDefaults
      : EMPTY_PREFILL_DEFAULTS;

  // step: "scan" | "form"
  const [step, setStep] = useState(
    () => startStep ?? (isEdit ? "form" : "scan"),
  );
  const [prefill, setPrefill] = useState({});
  const [mode, setMode] = useState(() => {
    if (!product) return "create";
    return initialMode === "edit" ? "edit" : "view";
  });
  const [loading, setLoading] = useState(false);

  // Camera state
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const scanSessionRef = useRef(0);
  const [cameras, setCameras] = useState([]);
  const [cameraIdx, setCameraIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [scannedCode, setScannedCode] = useState(null);

  const formPrefill = useMemo(
    () =>
      effectivePrefillDefaults === EMPTY_PREFILL_DEFAULTS
        ? prefill
        : { ...effectivePrefillDefaults, ...prefill },
    [effectivePrefillDefaults, prefill],
  );

  // Reset on open/product / create options change
  useEffect(() => {
    if (open) {
      setMode(
        product ? (initialMode === "edit" ? "edit" : "view") : "create",
      );
      setStep(startStep ?? (isEdit ? "form" : "scan"));
      setPrefill({});
      setScannedCode(null);
      setScanError(null);
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, startStep, prefillDefaults, initialMode]);

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
    scanSessionRef.current += 1;
    const mySession = scanSessionRef.current;
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
          if (result && scanSessionRef.current === mySession) {
            handleScanned(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Scan error:", err);
          }
        },
      );
      if (scanSessionRef.current === mySession) setScanning(true);
    } catch (err) {
      console.error("Camera error:", err);
      if (err?.name === "NotAllowedError") {
        setScanError(t("pages.products.formModal.cameraDenied"));
      } else if (err?.name === "NotFoundError") {
        setScanError(t("pages.products.formModal.cameraNotFound"));
      } else {
        setScanError(t("pages.products.formModal.cameraStartFail"));
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
        images: Array.isArray(info?.images) ? info.images : [],
      });
      if (info?.name) {
        toast.success(
          t("pages.products.formModal.foundProduct", { name: info.name }),
        );
      } else {
        toast.success(
          t("pages.products.formModal.scannedBarcode", { barcode }),
        );
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
          toast.success(t("pages.products.formModal.updateSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(
            res.data?.message || t("pages.products.formModal.updateFail"),
          );
        }
      } else {
        const res = await createProduct(shopId, data, files);
        if (res.data?.success) {
          toast.success(t("pages.products.formModal.createSuccess"));
          onSuccess?.();
          onClose?.();
        } else {
          toast.error(
            res.data?.message || t("pages.products.formModal.createFail"),
          );
        }
      }
    } catch (err) {
      console.error("ProductFormModal error:", err);
      toast.error(t("pages.products.formModal.genericError"));
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
          step === "scan"
            ? "flex max-h-[min(90dvh,720px)] flex-col gap-4 overflow-y-auto p-4 sm:max-w-[480px] sm:p-6"
            : "flex h-[min(92dvh,900px)] max-h-[min(92dvh,900px)] w-[min(100%,calc(100vw-1rem))] max-w-[880px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[880px]",
        )}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader
          className={cn(
            "shrink-0 text-left",
            step === "form" && "border-b border-border bg-background px-4 pb-3 pt-4 sm:px-6 sm:pt-5",
          )}
        >
          <DialogTitle>
            {step === "scan"
              ? t("pages.products.formModal.scanTitle")
              : !isEdit
                ? t("pages.products.formModal.createTitle")
                : mode === "view"
                  ? t("pages.products.formModal.viewTitle")
                  : t("pages.products.formModal.editTitle")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {step === "scan"
              ? t("pages.products.formModal.scanDesc")
              : isEdit
                ? t("pages.products.formModal.editDesc")
                : t("pages.products.formModal.createDesc")}
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
                    {t("pages.products.formModal.retry")}
                  </Button>
                </div>
              )}

              {/* Looking up overlay */}
              {lookingUp && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                  <p className="text-sm text-white">
                    {t("pages.products.formModal.lookingUp")}
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
                  ? t("pages.products.formModal.scanHint")
                  : scanError
                    ? t("pages.products.formModal.cameraFailed")
                    : t("pages.products.formModal.cameraStarting")}
              </p>
              <div className="flex items-center gap-2">
                {cameras.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setCameraIdx((i) => (i + 1) % cameras.length)
                    }
                    title={t("pages.products.formModal.switchCamera")}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleSkip}>
                  <Keyboard className="h-3.5 w-3.5 mr-1.5" />
                  {t("pages.products.formModal.manualEntry")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── FORM STEP ──────────────────────────────────────────────── */}
        {step === "form" && (
          <div
            data-product-form-scroll
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain bg-background px-4 pt-4 pb-4 sm:px-6 sm:pt-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <ProductForm
              mode={mode}
              product={product}
              prefill={formPrefill}
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
