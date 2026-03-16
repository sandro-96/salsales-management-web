import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";
import { Camera, CameraOff, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Modal quét mã vạch bằng camera.
 *
 * @param {boolean}  open        - Hiển thị dialog
 * @param {Function} onClose     - Đóng dialog
 * @param {Function} onDetected  - Callback(barcode: string) khi quét được
 */
export default function BarcodeScanner({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIdx, setActiveCameraIdx] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Start scanning when dialog opens
  useEffect(() => {
    if (!open) return;
    setLastResult(null);
    setError(null);
    startScanning();

    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeCameraIdx]);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // List available cameras on first run
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameras(devices);

      const deviceId = devices[activeCameraIdx]?.deviceId ?? undefined;

      await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            setLastResult(text);
            onDetected(text);
            stopScanning();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error("Barcode scan error:", err);
          }
        },
      );
    } catch (err) {
      console.error("Camera start error:", err);
      if (err?.name === "NotAllowedError") {
        setError(
          "Trình duyệt bị từ chối quyền camera. Vui lòng cấp quyền và thử lại.",
        );
      } else if (err?.name === "NotFoundError") {
        setError("Không tìm thấy camera trên thiết bị này.");
      } else {
        setError("Không thể khởi động camera. Vui lòng thử lại.");
      }
      setScanning(false);
    }
  };

  const stopScanning = () => {
    try {
      readerRef.current?.reset();
    } catch {
      // ignore cleanup errors
    }
    readerRef.current = null;
    setScanning(false);
  };

  const handleSwitchCamera = () => {
    stopScanning();
    setActiveCameraIdx((i) => (i + 1) % Math.max(cameras.length, 1));
  };

  const handleClose = () => {
    stopScanning();
    setLastResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Quét mã vạch
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Camera viewport */}
        <div className="relative bg-black w-full aspect-[4/3] overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Scan frame overlay */}
          {scanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-52 h-36">
                {/* Corner markers */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                {/* Scan line animation */}
                <div className="absolute left-1 right-1 h-0.5 bg-primary/70 animate-scan-line" />
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center">
              <CameraOff className="h-10 w-10 text-red-400" />
              <p className="text-sm text-red-300">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-1"
                onClick={() => {
                  setError(null);
                  startScanning();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Thử lại
              </Button>
            </div>
          )}

          {/* Success flash */}
          {lastResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
              <div className="text-green-400 text-3xl">✓</div>
              <p className="text-white text-sm font-mono">{lastResult}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <p
            className={cn(
              "text-xs text-muted-foreground",
              scanning && "animate-pulse",
            )}
          >
            {scanning
              ? "Đưa mã vạch vào khung để quét..."
              : lastResult
                ? "Đã quét thành công"
                : error
                  ? "Đã xảy ra lỗi"
                  : "Đang khởi động camera..."}
          </p>
          <div className="flex items-center gap-2">
            {cameras.length > 1 && !lastResult && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSwitchCamera}
                title="Đổi camera"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleClose}>
              <X className="h-3.5 w-3.5 mr-1" />
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
