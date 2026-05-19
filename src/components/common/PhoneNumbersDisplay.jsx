import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hiển thị danh sách SĐT (chế độ xem) — đồng bộ với ô FieldValue trong cài đặt.
 */
export function PhoneNumbersDisplay({
  phones = [],
  dialCode = "",
  emptyLabel = "—",
  className,
  /** "boxed" = một khung như FieldValue; "inline" = danh sách gọn trong header */
  variant = "boxed",
}) {
  const list = (phones || []).map((p) => String(p ?? "").trim()).filter(Boolean);

  if (list.length === 0) {
    if (variant === "inline") return null;
    return (
      <p className="text-sm font-medium py-2 px-3 rounded-md bg-muted/50 min-h-9 flex items-center text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("flex flex-col gap-1.5 min-w-0", className)}>
        {list.map((p) => (
          <a
            key={p}
            href={`tel:${p}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/90 hover:text-primary tabular-nums"
          >
            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            {p}
          </a>
        ))}
      </span>
    );
  }

  const Box = "div";
  return (
    <Box
      className={cn(
        "rounded-md border border-border/60 bg-muted/50 overflow-hidden divide-y divide-border/50",
        className,
      )}
    >
      {list.map((p) => (
        <Box
          key={p}
          className="flex items-center gap-2.5 px-3 py-2.5 min-h-9 text-sm"
        >
          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="font-medium tabular-nums text-foreground min-w-0">
            {dialCode ? (
              <>
                <span className="text-muted-foreground font-normal mr-1.5">
                  {dialCode}
                </span>
                {p}
              </>
            ) : (
              p
            )}
          </span>
        </Box>
      ))}
    </Box>
  );
}
