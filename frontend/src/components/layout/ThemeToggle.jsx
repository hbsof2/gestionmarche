"use client";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200 ${
        isDark
          ? "bg-slate-700 text-yellow-400 hover:bg-slate-600"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {isDark ? <Moon size={17} /> : <Sun size={17} />}
    </button>
  );
}
