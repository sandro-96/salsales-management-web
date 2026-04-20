import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Banner nhắc trạng thái billing:
 * - EXPIRED/CANCELLED: đỏ, chặn thao tác, CTA "Thanh toán ngay".
 * - TRIAL còn ≤ 7 ngày: cam, cảnh báo hạn.
 * - ACTIVE còn ≤ 3 ngày: xanh dương nhẹ nhắc gia hạn.
 * - Các trường hợp còn lại ẩn banner.
 */
export default function SubscriptionBanner() {
  const { data } = useSubscription();
  const navigate = useNavigate();

  if (!data) return null;
  const { status, trialDaysRemaining = 0, periodDaysRemaining = 0 } = data;

  const goBilling = () => navigate("/billing");

  if (status === "EXPIRED" || status === "CANCELLED") {
    return (
      <Bar tone="danger" icon={<AlertTriangle className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          Gói dịch vụ đã hết hạn. Các thao tác ghi (thêm/sửa/xoá) tạm khoá cho tới khi
          bạn thanh toán <b>99.000đ</b> để gia hạn.
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-red-700 hover:bg-white shrink-0"
          onClick={goBilling}
        >
          Thanh toán ngay
        </Button>
      </Bar>
    );
  }

  if (status === "TRIAL" && trialDaysRemaining <= 7) {
    return (
      <Bar tone="warn" icon={<Clock className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          Bạn còn <b>{trialDaysRemaining} ngày</b> dùng thử. Sau đó cần thanh toán
          99.000đ/tháng để tiếp tục sử dụng.
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-amber-800 hover:bg-white shrink-0"
          onClick={goBilling}
        >
          Xem chi tiết
        </Button>
      </Bar>
    );
  }

  if (status === "ACTIVE" && periodDaysRemaining > 0 && periodDaysRemaining <= 3) {
    return (
      <Bar tone="info" icon={<Info className="h-4 w-4" />}>
        <span className="flex-1 min-w-0">
          Gói của bạn sẽ hết hạn trong <b>{periodDaysRemaining} ngày</b>. Gia hạn sớm
          để không bị gián đoạn.
        </span>
        <Button size="sm" variant="secondary"
          className="h-7 bg-white/95 text-sky-800 hover:bg-white shrink-0"
          onClick={goBilling}
        >
          Gia hạn
        </Button>
      </Bar>
    );
  }

  return null;
}

function Bar({ tone, icon, children }) {
  const toneClass =
    tone === "danger" ? "bg-red-600 text-white"
    : tone === "warn" ? "bg-amber-500 text-white"
    : "bg-sky-600 text-white";
  return (
    <div className={`sticky top-0 z-40 text-sm flex items-center gap-3 px-4 py-2 shadow-md ${toneClass}`}>
      <span className="shrink-0">{icon}</span>
      {children}
    </div>
  );
}
