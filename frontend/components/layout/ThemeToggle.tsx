"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <button
        disabled
        className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 opacity-50 cursor-not-allowed"
        title="Toggle theme"
        aria-label="Toggle theme"
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

