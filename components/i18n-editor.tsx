"use client";

import { useActionState, useState } from "react";
import { saveTranslations, type TranslationRow } from "@/app/i18n-editor/actions";

type I18nEditorProps = {
  initialRows: TranslationRow[];
};

type SaveState = {
  status: "idle" | "success" | "error";
  message: string | null;
};

async function saveAction(_prevState: SaveState, formData: FormData): Promise<SaveState> {
  const data = formData.get("rows");
  if (!data || typeof data !== "string") {
    return { status: "error", message: "Invalid data" };
  }

  try {
    const rows = JSON.parse(data) as TranslationRow[];
    const result = await saveTranslations(rows);
    return { status: "success", message: result.message };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to save",
    };
  }
}

export function I18nEditor({ initialRows }: I18nEditorProps) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "missing">("all");
  const [saveState, saveFormAction] = useActionState(saveAction, {
    status: "idle",
    message: null,
  });

  const filteredRows = rows.filter((row) => {
    const matchesText =
      filter === "" ||
      row.key.toLowerCase().includes(filter.toLowerCase()) ||
      row.en.toLowerCase().includes(filter.toLowerCase()) ||
      row.zh.toLowerCase().includes(filter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "ok" && row.status === "ok") ||
      (statusFilter === "missing" && row.status !== "ok");

    return matchesText && matchesStatus;
  });

  function updateRow(index: number, field: "en" | "zh", value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function getStatusColor(status: TranslationRow["status"]) {
    switch (status) {
      case "missing-en":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "missing-zh":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
  }

  function getStatusLabel(status: TranslationRow["status"]) {
    switch (status) {
      case "missing-en":
        return "Missing EN";
      case "missing-zh":
        return "Missing ZH";
      default:
        return "OK";
    }
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search keys or translations..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "ok" | "missing")}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="all">All</option>
          <option value="ok">OK</option>
          <option value="missing">Missing</option>
        </select>
      </div>

      <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        Showing {filteredRows.length} of {rows.length} keys
      </div>

      <div className="overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full">
          <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                Key
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                English
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                中文
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {filteredRows.map((row) => {
              const originalIndex = rows.findIndex((r) => r.key === row.key);
              const isFunction = row.en.startsWith("[FUNCTION]") || row.zh.startsWith("[FUNCTION]");

              return (
                <tr key={row.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-2 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    {row.key}
                  </td>
                  <td className="px-4 py-2">
                    {isFunction ? (
                      <div className="rounded bg-zinc-100 px-2 py-1 text-xs font-mono text-zinc-500 dark:bg-zinc-800">
                        {row.en.replace("[FUNCTION] ", "")}
                      </div>
                    ) : (
                      <textarea
                        value={row.en}
                        onChange={(e) => updateRow(originalIndex, "en", e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-600"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {isFunction ? (
                      <div className="rounded bg-zinc-100 px-2 py-1 text-xs font-mono text-zinc-500 dark:bg-zinc-800">
                        {row.zh.replace("[FUNCTION] ", "")}
                      </div>
                    ) : (
                      <textarea
                        value={row.zh}
                        onChange={(e) => updateRow(originalIndex, "zh", e.target.value)}
                        rows={2}
                        className="w-full resize-none rounded border border-zinc-200 bg-transparent px-2 py-1 text-sm dark:border-zinc-600"
                      />
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${getStatusColor(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form action={saveFormAction} className="mt-4 flex items-center gap-3">
        <input type="hidden" name="rows" value={JSON.stringify(rows)} />
        <button
          type="submit"
          disabled={saveState.status === "success"}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:bg-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saveState.status === "success" ? "Saved!" : "Save Changes"}
        </button>
        {saveState.message && (
          <span
            className={`text-sm ${
              saveState.status === "error" ? "text-red-600" : "text-green-600"
            }`}
          >
            {saveState.message}
          </span>
        )}
      </form>
    </div>
  );
}
