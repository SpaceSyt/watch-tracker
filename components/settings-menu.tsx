"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  emitPreferenceChange,
  setLanguagePreference,
  useI18n,
  useLanguagePreference,
} from "@/components/language-preference";
import { getLanguageLabel, type LanguagePreference } from "@/lib/i18n";

type ThemePreference = "light" | "dark" | "system";

const themeStorageKey = "watch-tracker-theme";
const themeOrder: ThemePreference[] = ["light", "dark", "system"];

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: ThemePreference) {
  const shouldUseDark =
    theme === "dark" || (theme === "system" && systemPrefersDark());
  const root = document.documentElement;

  root.classList.toggle("dark", shouldUseDark);
  root.dataset.themePreference = theme;
  root.dataset.theme = shouldUseDark ? "dark" : "light";
}

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = localStorage.getItem(themeStorageKey);

  return isThemePreference(storedTheme) ? storedTheme : "system";
}

function subscribePreferences(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("watch-tracker-preference-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("watch-tracker-preference-change", onStoreChange);
  };
}

function getThemeSymbol(theme: ThemePreference) {
  if (theme === "light") {
    return "☀";
  }

  if (theme === "dark") {
    return "🌙";
  }

  return "A";
}

function getNextTheme(theme: ThemePreference) {
  const currentIndex = themeOrder.indexOf(theme);

  return themeOrder[(currentIndex + 1) % themeOrder.length];
}

type SettingsMenuProps = {
  initialLanguage?: LanguagePreference;
};

export function SettingsMenu({ initialLanguage = "en" }: SettingsMenuProps) {
  const router = useRouter();
  const dictionary = useI18n(initialLanguage);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const theme = useSyncExternalStore<ThemePreference>(
    subscribePreferences,
    getStoredTheme,
    () => "system",
  );
  const language = useLanguagePreference(initialLanguage);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme("system");

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme]);

  useEffect(() => {
    if (!isLanguageMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!languageMenuRef.current?.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLanguageMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLanguageMenuOpen]);

  function cycleTheme() {
    localStorage.setItem(themeStorageKey, getNextTheme(theme));
    emitPreferenceChange();
  }

  function selectLanguage(nextLanguage: LanguagePreference) {
    setLanguagePreference(nextLanguage);
    setIsLanguageMenuOpen(false);
    router.refresh();
  }

  return (
    <div
      className="flex items-center gap-2"
      aria-label={dictionary.settingsMenu.globalPreferences}
    >
      <button
        type="button"
        onClick={cycleTheme}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        aria-label={dictionary.settingsMenu.themeAria(theme)}
        title={dictionary.settingsMenu.themeTitle(theme)}
      >
        {getThemeSymbol(theme)}
      </button>
      <div ref={languageMenuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsLanguageMenuOpen((current) => !current)}
          className="min-h-10 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          aria-haspopup="menu"
          aria-expanded={isLanguageMenuOpen}
          aria-label={dictionary.settingsMenu.languageAria}
          title={dictionary.settingsMenu.languageTitle}
        >
          {getLanguageLabel(language)}
        </button>
        {isLanguageMenuOpen ? (
          <div
            className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white text-sm shadow-lg"
            role="menu"
            aria-label={dictionary.settingsMenu.languagePreference}
          >
            <div className="grid py-1">
              {(["en", "zh"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectLanguage(option)}
                  className="flex items-center justify-between px-3 py-2 text-left text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  role="menuitem"
                >
                  <span>{getLanguageLabel(option)}</span>
                  {language === option ? (
                    <span aria-hidden="true" className="text-xs text-zinc-500">
                      {dictionary.common.selected}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
