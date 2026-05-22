import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * Nút đổi light/dark — chỉ đổi khi user bấm (không theo OS).
 * Dùng `theme` từ next-themes (enableSystem=false → luôn "light" | "dark").
 */
export default function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className,
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      aria-label={t("theme.toggle")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted && isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
