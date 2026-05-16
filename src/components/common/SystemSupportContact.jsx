import React from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, Info, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function envStr(key) {
  const v = import.meta.env?.[key];
  return typeof v === "string" ? v.trim() : "";
}

function normalizeSingleLine(text) {
  if (!text) return "";
  return String(text)
    .replace(/\\n/g, " • ")
    .replace(/\r?\n/g, " • ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizeMultiline(text) {
  if (!text) return "";
  return String(text).replace(/\\n/g, "\n").trim();
}

function zaloHref(raw) {
  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  return `https://zalo.me/${digits}`;
}

/**
 * Thông tin liên hệ hệ thống (toàn app).
 * Env: VITE_SUPPORT_NAME, VITE_SUPPORT_PHONE, VITE_SUPPORT_EMAIL,
 * VITE_SUPPORT_ZALO (optional), VITE_SUPPORT_NOTE (optional extra lines).
 */
export default function SystemSupportContact({
  className,
  compact = false,
  variant = "card", // 'card' | 'inline'
}) {
  const { t } = useTranslation();
  const name = envStr("VITE_SUPPORT_NAME");
  const phone = envStr("VITE_SUPPORT_PHONE");
  const email = envStr("VITE_SUPPORT_EMAIL");
  const zalo = envStr("VITE_SUPPORT_ZALO");
  const note = envStr("VITE_SUPPORT_NOTE");
  const noteInline = normalizeSingleLine(note);
  const noteMultiline = normalizeMultiline(note);
  const zaloUrl = zaloHref(zalo);

  const title = name
    ? t("systemSupport.titleWithName", { name })
    : t("systemSupport.title");
  const titleShort = name
    ? t("systemSupport.contactShortWithName", { name })
    : t("systemSupport.contactShort");

  if (!name && !phone && !email && !zalo && !note) return null;

  const hoursLine = t("systemSupport.hours");

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
          <span className="font-medium truncate">{titleShort}</span>
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
        <span className="min-w-0 truncate whitespace-nowrap">{hoursLine}</span>
        {zalo && zaloUrl ? (
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 hover:text-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span>
              {t("systemSupport.zalo")}: {zalo}
            </span>
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
        <Info className="h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">{title}</span>
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
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="tabular-nums">{phone}</span>
          </a>
        ) : null}
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-1 hover:text-foreground min-w-0"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="break-all">{email}</span>
          </a>
        ) : null}
      </div>

      <div className={cn("mt-2 space-y-1", compact && "mt-1")}>
        <p>{hoursLine}</p>
        {zalo && zaloUrl ? (
          <p>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5 shrink-0" />
              <span>
                {t("systemSupport.zalo")}: {zalo}
              </span>
            </a>
          </p>
        ) : null}
        {noteMultiline ? (
          <p className="whitespace-break-spaces">{noteMultiline}</p>
        ) : null}
      </div>
    </div>
  );
}
