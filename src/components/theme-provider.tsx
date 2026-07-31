"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

// Inlined into <head> (see layout.tsx) so the correct class is applied
// before React hydrates — avoids a flash of the wrong theme on load.
export const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start from "light" so the FIRST client render matches the
  // server-rendered markup exactly (server never has access to
  // localStorage/matchMedia, so it can only ever guess "light"). Reading
  // `document` inside the initializer here would make the client's first
  // render disagree with the server's — that mismatch is what caused the
  // ThemeToggle hydration error, since the no-flash script had already
  // added the "dark" class to <html> before React hydrated.
  const [theme, setTheme] = useState<Theme>("light");

  // After mount (client-only, runs after hydration is done) sync React's
  // state with whatever the no-flash script actually set on <html>. This
  // can't cause a hydration mismatch because it happens in an effect, not
  // during render.
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("theme", next);
      } catch {
        // localStorage may be unavailable (private browsing etc.) — theme
        // toggle still works for the session, it just won't persist.
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
