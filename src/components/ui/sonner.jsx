import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      richColors
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",

          "--success-bg":
            "color-mix(in oklab, var(--success) 18%, var(--popover))",
          "--success-text": "var(--success)",
          "--success-border":
            "color-mix(in oklab, var(--success) 35%, var(--border))",

          "--error-bg":
            "color-mix(in oklab, var(--destructive) 16%, var(--popover))",
          "--error-text": "var(--destructive)",
          "--error-border":
            "color-mix(in oklab, var(--destructive) 35%, var(--border))",

          "--warning-bg":
            "color-mix(in oklab, var(--warning) 16%, var(--popover))",
          "--warning-text": "var(--warning)",
          "--warning-border":
            "color-mix(in oklab, var(--warning) 35%, var(--border))",

          "--info-bg": "color-mix(in oklab, var(--info) 16%, var(--popover))",
          "--info-text": "var(--info)",
          "--info-border":
            "color-mix(in oklab, var(--info) 35%, var(--border))",
        }
      }
      {...props} />
  );
};

export { Toaster };
