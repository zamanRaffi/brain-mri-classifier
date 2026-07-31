"use client";

import { useMemo } from "react";
import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const icon = useMemo(() => (isDark ? "light_mode" : "dark_mode"), [isDark]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-10 w-10 rounded-full flex items-center justify-center border border-outline-variant/30 text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors shrink-0"
    >
      <span className="material-symbols-outlined text-[20px]">
        {icon}
      </span>
    </button>
  );
}
