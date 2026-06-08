"use client";

import { useSyncExternalStore } from "react";
import {
  getDictionary,
  type LanguagePreference,
  isLanguagePreference,
  languagePreferenceKey,
  preferenceChangeEvent,
} from "@/lib/i18n";

function applyLanguage(language: LanguagePreference) {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.languagePreference = language;
}

function getStoredLanguage(): LanguagePreference {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = localStorage.getItem(languagePreferenceKey);
  const languageCookie = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${languagePreferenceKey}=`));
  const cookieLanguage = languageCookie?.split("=")[1];

  if (isLanguagePreference(storedLanguage)) {
    return storedLanguage;
  }

  return isLanguagePreference(cookieLanguage) ? cookieLanguage : "en";
}

function subscribeLanguage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(preferenceChangeEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(preferenceChangeEvent, onStoreChange);
  };
}

export function emitPreferenceChange() {
  window.dispatchEvent(new Event(preferenceChangeEvent));
}

export function setLanguagePreference(language: LanguagePreference) {
  localStorage.setItem(languagePreferenceKey, language);
  document.cookie = `${languagePreferenceKey}=${language}; path=/; max-age=31536000; samesite=lax`;
  applyLanguage(language);
  emitPreferenceChange();
}

export function useLanguagePreference(initialLanguage: LanguagePreference = "en") {
  const language = useSyncExternalStore<LanguagePreference>(
    subscribeLanguage,
    getStoredLanguage,
    () => initialLanguage,
  );

  return language;
}

export function useI18n(initialLanguage: LanguagePreference = "en") {
  return getDictionary(useLanguagePreference(initialLanguage));
}
