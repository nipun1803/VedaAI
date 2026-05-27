"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";

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
      <Button variant="ghost" size="icon" disabled>
        <Moon className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" title="Toggle theme" aria-label="Toggle theme" onClick={toggle}>
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

