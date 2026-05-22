import { Receipt } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Logo mark trên landing / home — ô vuông gradient + icon Receipt.
 * Favicon tĩnh: public/favicon.svg (cùng thiết kế).
 */
export function BrandLogoMark({
  className = "h-9 w-9",
  iconClassName = "h-5 w-5",
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-primary-foreground shadow-lg shadow-primary/30",
        className,
      )}
      aria-hidden
    >
      <Receipt className={cn(iconClassName)} strokeWidth={2} />
    </span>
  );
}
