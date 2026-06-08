import { EntryStatus } from "@/app/generated/prisma/enums";
import { enDictionary, type Dictionary } from "@/lib/i18n/en";
import { zhDictionary } from "@/lib/i18n/zh";

export type LanguagePreference = "en" | "zh";

export const languagePreferenceKey = "watch-tracker-language";
export const preferenceChangeEvent = "watch-tracker-preference-change";

export function isLanguagePreference(
  value: string | null | undefined,
): value is LanguagePreference {
  return value === "en" || value === "zh";
}

export function getLanguageLabel(language: LanguagePreference) {
  return language === "zh" ? "ZH-CN" : "EN-US";
}

export const dictionaries = {
  en: enDictionary,
  zh: zhDictionary,
} as const;

export function getDictionary(language: LanguagePreference): Dictionary {
  return dictionaries[language];
}

export function formatEntryStatus(status: EntryStatus, dictionary: Dictionary) {
  if (status === EntryStatus.PLAN_TO_WATCH) {
    return dictionary.collectionContent.wantToWatch;
  }

  if (status === EntryStatus.WATCHING) {
    return dictionary.collectionContent.watching;
  }

  return dictionary.collectionContent.completed;
}
