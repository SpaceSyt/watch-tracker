import { I18nEditor } from "@/components/i18n-editor";
import { loadTranslations } from "@/app/i18n-editor/actions";

export default async function I18nEditorPage() {
  const rows = await loadTranslations();

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          i18n Translation Editor
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Edit translations and save changes to update both language files.
        </p>
      </div>
      <I18nEditor initialRows={rows} />
    </div>
  );
}
