import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeft,
  Home,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/common/LanguageSwitcher.jsx";
import { useAuth } from "@/hooks/useAuth.js";
import { cn } from "@/lib/utils";

function resolveHomePath(user) {
  if (!user) return "/login";
  const role = user?.role;
  const isAdmin =
    typeof role === "string"
      ? role.includes("ROLE_ADMIN")
      : Array.isArray(role)
        ? role.some((r) => String(r).includes("ADMIN"))
        : false;
  return isAdmin ? "/admin" : "/overview";
}

function resolveErrorView(raw, t) {
  if (!raw) {
    return {
      code: null,
      title: t("error.generic.title"),
      message: t("error.generic.message"),
      stack: null,
    };
  }

  const code = raw.code ?? raw.status;
  const codeStr = code != null ? String(code).trim() : "";
  const numericCode = /^\d{3}$/.test(codeStr) ? codeStr : null;

  if (numericCode === "403") {
    return {
      code: "403",
      title: t("error.unauthorized.code"),
      message: t("error.unauthorized.message"),
      stack: raw.stack ?? null,
    };
  }

  if (numericCode === "404") {
    return {
      code: "404",
      title: t("error.notFound.code"),
      message: t("error.notFound.message"),
      stack: raw.stack ?? null,
    };
  }

  if (raw.kind === "boundary") {
    return {
      code: null,
      title: t("error.page.boundaryTitle"),
      message: raw.message || t("error.page.boundaryMessage"),
      stack: raw.stack ?? null,
    };
  }

  const title =
    raw.title && raw.title !== codeStr
      ? raw.title
      : numericCode || t("error.generic.title");

  return {
    code: numericCode,
    title,
    message: raw.message || t("error.generic.message"),
    stack: raw.stack ?? null,
  };
}

export default function ErrorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const homePath = useMemo(() => resolveHomePath(user), [user]);

  const view = useMemo(
    () => resolveErrorView(location.state?.error, t),
    [location.state?.error, t],
  );

  const technicalDetail =
    view.stack ||
    (import.meta.env.DEV && location.state?.error?.message
      ? location.state.error.message
      : null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homePath, { replace: true });
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardContent className="pt-8 pb-8 text-center space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("error.page.eyebrow")}
          </p>

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
            <AlertTriangle
              className="h-7 w-7 text-destructive"
              aria-hidden
            />
          </div>

          {view.code ? (
            <Badge
              variant="outline"
              className="font-mono text-sm px-2.5 py-0.5"
            >
              {view.code}
            </Badge>
          ) : null}

          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {view.title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {view.message}
            </p>
            <p className="text-xs text-muted-foreground/90 leading-relaxed max-w-sm mx-auto pt-1">
              {t("error.page.hint")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:flex-wrap pt-1">
            <Button
              type="button"
              className="gap-2"
              onClick={() => window.location.reload()}
            >
              <RotateCcw className="h-4 w-4" />
              {t("error.page.retry")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
              {t("error.page.goBack")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => navigate(homePath, { replace: true })}
            >
              <Home className="h-4 w-4" />
              {t("error.page.goHome")}
            </Button>
          </div>

          {technicalDetail ? (
            <div className="pt-2 text-left">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className="mx-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {detailsOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {t("error.page.technicalDetails")}
              </button>
              {detailsOpen ? (
                <pre
                  className={cn(
                    "mt-3 max-h-40 overflow-auto rounded-md border bg-muted/50 p-3",
                    "text-[10px] leading-relaxed text-left whitespace-pre-wrap break-words font-mono",
                  )}
                >
                  {technicalDetail}
                </pre>
              ) : null}
            </div>
          ) : null}

          <p className="text-[11px] text-muted-foreground/70 pt-2">
            {t("brand.appName")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
