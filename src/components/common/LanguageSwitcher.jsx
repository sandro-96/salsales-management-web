import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SUPPORTED_LANGUAGES } from "@/i18n";
import Flag from "@/i18n/Flag.jsx";
import { updateProfile } from "@/api/userApi";

export default function LanguageSwitcher({
  className,
  align = "end",
  showLabel = false,
  size = "icon",
  variant = "ghost",
}) {
  const { t, i18n } = useTranslation();
  const current =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.resolvedLanguage) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES[0];

  const handleChange = (code) => {
    if (code !== i18n.language) {
      i18n.changeLanguage(code);
      if (localStorage.getItem("accessToken")) {
        updateProfile({ language: code }).catch(() => {
          /* best-effort sync for email/API locale */
        });
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={t("language.switch")}
          className={cn(
            size === "icon" ? "h-9 w-9" : "h-9 px-2 gap-2",
            className,
          )}
        >
          <Flag code={current.code} size={20} />
          {showLabel && (
            <span className="text-sm font-medium uppercase">
              {current.code}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={8} className="min-w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t("language.label")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = current.code === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onSelect={() => handleChange(lang.code)}
              className={cn(
                "gap-2",
                active && "bg-accent text-accent-foreground",
              )}
            >
              <Flag code={lang.code} size={20} />
              <span className="flex-1">{t(lang.labelKey)}</span>
              {active && <Check className="ml-2 h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
