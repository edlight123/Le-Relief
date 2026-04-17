"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="border border-border-subtle p-2 transition-colors duration-200 hover:bg-surface-elevated"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4 text-muted" />
      ) : (
        <Moon className="h-4 w-4 text-muted" />
      )}
    </button>
  );
}
