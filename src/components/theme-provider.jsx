import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const STORAGE_KEY = "theme";

/**
 * Trước khi React mount: guest/user mới hoặc preference cũ "system"
 * → luôn bắt đầu light, tránh flash theo prefers-color-scheme.
 */
function ensureLightThemeDefault() {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || stored === "system") {
      localStorage.setItem(STORAGE_KEY, "light");
    }
  } catch {
    // private mode / blocked storage
  }
}

ensureLightThemeDefault();

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey={STORAGE_KEY}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
