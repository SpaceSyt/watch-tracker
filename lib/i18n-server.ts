import { cookies } from "next/headers";
import {
  getDictionary,
  isLanguagePreference,
  languagePreferenceKey,
} from "@/lib/i18n";

export async function getLanguagePreference() {
  const cookieStore = await cookies();
  const storedLanguage = cookieStore.get(languagePreferenceKey)?.value;

  return isLanguagePreference(storedLanguage) ? storedLanguage : "en";
}

export async function getServerDictionary() {
  return getDictionary(await getLanguagePreference());
}
