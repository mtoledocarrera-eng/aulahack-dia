"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2.5 rounded-xl bg-slate-100 dark:bg-brand-900/30 text-slate-400 border border-transparent w-10 h-10 flex items-center justify-center animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-xl bg-slate-100 dark:bg-brand-900/30 text-slate-600 dark:text-brand-400 hover:bg-slate-200 dark:hover:bg-brand-900/50 transition-colors focus:outline-dua-focus flex items-center justify-center border border-transparent dark:border-brand-500/20"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
