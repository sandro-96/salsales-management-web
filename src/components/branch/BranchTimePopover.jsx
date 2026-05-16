"use client";

import { useEffect, useState, useRef, forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function parseTimeParts(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return { hour: m[1].padStart(2, "0"), minute: m[2].padStart(2, "0") };
}

function formatDisplay(value) {
  const p = parseTimeParts(value);
  if (!p) return null;
  return `${p.hour}:${p.minute}`;
}

const timeCellClass =
  "flex w-full min-h-[44px] items-center justify-center rounded-md px-2 py-2 text-base tabular-nums transition-colors touch-manipulation select-none active:bg-accent/90 sm:min-h-0 sm:py-1.5 sm:text-sm";

/** Vùng cuộn native (không dùng Radix ScrollArea) — cuốn được bằng cảm ứng trên toàn bộ danh sách. */
const timeListScrollClass = cn(
  "rounded-md border border-input bg-muted/15 touch-pan-y",
  "overflow-y-auto overscroll-y-contain",
  /* Chiều cao đủ lớn; min-h-0 nếu nằm trong flex */
  "h-[min(320px,48svh)] max-sm:h-[min(400px,56dvh)]",
);

/**
 * Chọn giờ 24h trong Popover — tối ưu mobile: vùng chạm ≥44px, chiều cao theo dvh/svh, full width nhỏ.
 */
const BranchTimePopover = forwardRef(function BranchTimePopover(
  { value, onChange, disabled, className, ...props },
  ref,
) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [draftH, setDraftH] = useState("00");
  const [draftM, setDraftM] = useState("00");
  const draftHRef = useRef("00");
  const draftMRef = useRef("00");

  useEffect(() => {
    draftHRef.current = draftH;
    draftMRef.current = draftM;
  }, [draftH, draftM]);

  useEffect(() => {
    if (!open) return;
    const p = parseTimeParts(value);
    const h = p?.hour ?? "00";
    const m = p?.minute ?? "00";
    setDraftH(h);
    setDraftM(m);
    draftHRef.current = h;
    draftMRef.current = m;
  }, [open, value]);

  const display = formatDisplay(value);

  const commit = (h, m) => {
    onChange?.(`${h}:${m}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full min-h-[44px] justify-start gap-2 px-3.5 font-normal tabular-nums sm:h-10 sm:min-h-0",
            !display && "text-muted-foreground",
            className,
          )}
          {...props}
        >
          <Clock className="h-4 w-4 shrink-0 opacity-70 sm:h-4" />
          <span className="min-w-0 truncate font-mono text-base sm:text-sm">
            {display ?? t("pages.branches.timePopover.pickTime")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "z-[100] gap-0 border bg-popover p-3 shadow-lg",
          /* Mobile: gần full width, an toàn notch / home indicator */
          "max-sm:w-[min(100%,calc(100vw-1.25rem))] max-sm:max-w-none max-sm:p-4",
          "sm:w-auto sm:max-w-[min(100vw-1rem,20rem)] sm:p-3",
          "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]",
        )}
        align={isMobile ? "center" : "start"}
        side="bottom"
        sideOffset={isMobile ? 10 : 6}
        collisionPadding={14}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
          {t("pages.branches.timePopover.format24h")}
        </p>
        <div className="flex min-h-0 gap-2 sm:gap-3">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 sm:gap-1.5">
            <span className="shrink-0 text-center text-xs font-medium text-muted-foreground sm:text-[11px]">
              {t("pages.branches.timePopover.hour")}
            </span>
            <div
              role="listbox"
              aria-label={t("pages.branches.timePopover.pickHour")}
              className={cn(timeListScrollClass, "min-h-0")}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex flex-col gap-1 p-2 sm:gap-0.5 sm:p-1.5">
                {HOURS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={cn(
                      timeCellClass,
                      "hover:bg-accent",
                      draftH === h &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                    onClick={() => {
                      setDraftH(h);
                      draftHRef.current = h;
                      commit(h, draftMRef.current);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 sm:gap-1.5">
            <span className="shrink-0 text-center text-xs font-medium text-muted-foreground sm:text-[11px]">
              {t("pages.branches.timePopover.minute")}
            </span>
            <div
              role="listbox"
              aria-label={t("pages.branches.timePopover.pickMinute")}
              className={cn(timeListScrollClass, "min-h-0")}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              <div className="flex flex-col gap-1 p-2 sm:gap-0.5 sm:p-1.5">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      timeCellClass,
                      "hover:bg-accent",
                      draftM === m &&
                        "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                    onClick={() => {
                      setDraftM(m);
                      draftMRef.current = m;
                      commit(draftHRef.current, m);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-stretch justify-between gap-2 border-t border-border/80 pt-3 sm:items-center sm:pt-2">
          <Button
            type="button"
            variant="ghost"
            className="h-11 min-h-[44px] flex-1 text-sm sm:h-8 sm:min-h-0 sm:flex-initial sm:text-xs"
            onClick={() => {
              onChange?.("");
              setOpen(false);
            }}
          >
            {t("pages.branches.timePopover.clear")}
          </Button>
          <Button
            type="button"
            className="h-11 min-h-[44px] flex-1 text-sm sm:h-8 sm:min-h-0 sm:flex-initial sm:text-xs"
            onClick={() => setOpen(false)}
          >
            {t("pages.branches.timePopover.done")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
});

BranchTimePopover.displayName = "BranchTimePopover";

export default BranchTimePopover;
