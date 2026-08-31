"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const storageKey = "prtracker-theme";
const themeEvent = "prtracker-theme-change";
const darkMediaQuery = "(prefers-color-scheme: dark)";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
}

function subscribe(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(darkMediaQuery);
  const handleThemeChange = () => onStoreChange();
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    applyTheme(
      event.newValue === "dark" ||
        (event.newValue === null && mediaQuery.matches),
    );
    onStoreChange();
  };
  const handleSystemChange = (event: MediaQueryListEvent) => {
    try {
      if (window.localStorage.getItem(storageKey) !== null) return;
    } catch {
      // Theme still follows the operating system when storage is unavailable.
    }
    applyTheme(event.matches);
    onStoreChange();
  };

  window.addEventListener(themeEvent, handleThemeChange);
  window.addEventListener("storage", handleStorage);
  mediaQuery.addEventListener("change", handleSystemChange);

  return () => {
    window.removeEventListener(themeEvent, handleThemeChange);
    window.removeEventListener("storage", handleStorage);
    mediaQuery.removeEventListener("change", handleSystemChange);
  };
}

const getSnapshot = () => document.documentElement.classList.contains("dark");
const getServerSnapshot = () => false;

export function ThemeToggle({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverse";
}) {
  const isDark = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const label = isDark ? "Activar modo claro" : "Activar modo oscuro";

  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    applyTheme(nextIsDark);
    try {
      window.localStorage.setItem(storageKey, nextIsDark ? "dark" : "light");
    } catch {
      // The current page can still switch theme without persistent storage.
    }
    window.dispatchEvent(new Event(themeEvent));
  };

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variant === "inverse"
          ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
          : "border-border bg-card text-card-foreground hover:bg-muted",
        className,
      )}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-4" />
      ) : (
        <Moon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
