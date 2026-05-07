import React from "react";
import { Mail, Phone, Info } from "lucide-react";
import { cn } from "@/lib/utils";

function envStr(key) {
  const v = import.meta.env?.[key];
  return typeof v === "string" ? v.trim() : "";
}

function normalizeSingleLine(text) {
  if (!text) return "";
  // Support both actual newlines and literal "\n" from .env
  return String(text)
    .replace(/\\n/g, " • ")
    .replace(/\r?\n/g, " • ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeMultiline(text) {
  if (!text) return "";
  // Turn literal "\n" into real newlines for display
  return String(text).replace(/\\n/g, "\n").trim();
}

/**
 * Thông tin liên hệ hệ thống (toàn app).
 * Cấu hình qua Vite env:
 * - VITE_SUPPORT_NAME (optional)
 * - VITE_SUPPORT_PHONE (optional)
 * - VITE_SUPPORT_EMAIL (optional)
 * - VITE_SUPPORT_NOTE (optional)
 */
export default function SystemSupportContact({
  className,
  compact = false,
  variant = "card", // 'card' | 'inline'
}) {
  const name = envStr("VITE_SUPPORT_NAME");
  const phone = envStr("VITE_SUPPORT_PHONE");
  const email = envStr("VITE_SUPPORT_EMAIL");
  const note = envStr("VITE_SUPPORT_NOTE");
  const noteInline = normalizeSingleLine(note);
  const noteMultiline = normalizeMultiline(note);

  if (!name && !phone && !email && !note) return null;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "min-w-0 flex items-center gap-2 text-xs text-muted-foreground",
          className,
        )}
      >
        <span className="inline-flex items-center gap-1.5 text-foreground/90">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span className="font-medium truncate">
            {name ? `Liên hệ — ${name}` : "Liên hệ"}
          </span>
        </span>
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex shrink-0 items-center gap-1 hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            <span className="tabular-nums">{phone}</span>
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex min-w-0 items-center gap-1 hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{email}</span>
          </a>
        ) : null}
        {noteInline ? (
          <span className="min-w-0 flex-1 truncate whitespace-nowrap">
            {noteInline}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-foreground/90">
        <Info className="h-3.5 w-3.5" />
        <span className="font-medium">
          {name ? `Liên hệ hệ thống — ${name}` : "Liên hệ hệ thống"}
        </span>
      </div>

      <div
        className={cn(
          "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1",
          compact && "mt-1",
        )}
      >
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>{phone}</span>
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" />
            <span className="break-all">{email}</span>
          </a>
        ) : null}
      </div>

      {note ? (
        <div className={cn("mt-2 whitespace-break-spaces", compact && "mt-1")}>
          {noteMultiline}
        </div>
      ) : null}
    </div>
  );
}

