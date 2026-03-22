"use client";

import { useThemeStore } from "@/lib/stores/theme";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="w-14 h-8 rounded-full bg-[var(--bg-input)] p-1"
        aria-label="Toggle theme"
      >
        <div className="w-6 h-6 rounded-full bg-[var(--bg-card)]" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full bg-[var(--bg-input)] p-1 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Icons */}
      <span className="absolute left-1.5 top-1.5 text-amber-400">
        <Sun size={18} />
      </span>
      <span className="absolute right-1.5 top-1.5 text-violet-400">
        <Moon size={18} />
      </span>

      {/* Toggle knob */}
      <div
        className={`w-6 h-6 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform duration-200 ${
          isDark ? "translate-x-6" : "translate-x-0"
        }`}
      />
    </button>
  );
}
