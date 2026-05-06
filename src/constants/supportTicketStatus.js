import { cn } from "@/lib/utils";

/**
 * Màu badge riêng cho từng trạng thái ticket (đồng bộ shop + admin + modal).
 */
export const TICKET_STATUS_MAP = {
  OPEN: {
    label: "Mở",
    badgeClass:
      "border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-50 dark:border-amber-800",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    badgeClass:
      "border-sky-300 bg-sky-100 text-sky-950 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-50 dark:border-sky-800",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    badgeClass:
      "border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-50 dark:border-emerald-800",
  },
  CLOSED: {
    label: "Đã đóng",
    badgeClass:
      "border-slate-400 bg-slate-200 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600",
  },
};

/** WS NotificationType — đổi status / reply ảnh hưởng danh sách */
export const TICKET_LIST_WS_TYPES = new Set([
  "TICKET_CREATED",
  "TICKET_REPLIED",
  "TICKET_STATUS_CHANGED",
]);

export function ticketStatusBadgeClass(status) {
  const cfg = TICKET_STATUS_MAP[status] || TICKET_STATUS_MAP.OPEN;
  return cn("font-medium border shadow-none", cfg.badgeClass);
}
