// src/components/common/ImpersonationBanner.jsx
// Hiển thị banner vàng ở top mỗi khi admin đang giả danh user khác. Cho phép
// dừng giả danh bằng cách restore token admin gốc.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentImpersonation, stopImpersonation } from "@/utils/impersonation";

export default function ImpersonationBanner() {
  const [info, setInfo] = useState(() => getCurrentImpersonation());
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setInfo(getCurrentImpersonation());
    window.addEventListener("storage", handler);
    window.addEventListener("impersonation-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("impersonation-change", handler);
    };
  }, []);

  if (!info) return null;

  const onStop = () => {
    stopImpersonation();
    window.dispatchEvent(new Event("impersonation-change"));
    setInfo(null);
    navigate("/admin", { replace: true });
    window.location.reload();
  };

  return (
    <div className="sticky top-0 z-50 bg-amber-500 text-white text-sm flex items-center gap-3 px-4 py-2 shadow-md dark:bg-amber-600">
      <ShieldAlert className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0 truncate">
        Đang giả danh{" "}
        <span className="font-semibold">{info.targetEmail}</span>
        {info.impersonatorEmail ? (
          <span className="opacity-80"> (admin: {info.impersonatorEmail})</span>
        ) : null}
        . Mọi hành động được ghi vào audit log.
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 bg-white/90 text-amber-700 hover:bg-white dark:bg-amber-100 dark:text-amber-900 dark:hover:bg-amber-50"
        onClick={onStop}
      >
        <LogOut className="h-3.5 w-3.5 mr-1" />
        Thoát giả danh
      </Button>
    </div>
  );
}
