"use server";

import * as fs from "fs";
import * as path from "path";

const CSV_PATH = path.join(process.cwd(), "docs", "i18n-table.csv");

export type TranslationRow = {
  key: string;
  en: string;
  zh: string;
  status: "ok" | "missing-en" | "missing-zh";
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === ",") {
        result.push(current);
        current = "";
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  result.push(current);
  return result;
}

export async function loadTranslations(): Promise<TranslationRow[]> {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error("CSV file not found. Run export first.");
  }

  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  if (lines.length < 2) {
    return [];
  }

  const rows: TranslationRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    if (columns.length < 4) continue;

    const [key, en, zh, status] = columns;

    rows.push({
      key,
      en: en.replace(/\\n/g, "\n"),
      zh: zh.replace(/\\n/g, "\n"),
      status: (status as TranslationRow["status"]) || "ok",
    });
  }

  return rows;
}

function escapeCSV(value: string): string {
  const escaped = value.replace(/\n/g, "\\n");
  if (escaped.includes(",") || escaped.includes('"') || escaped.includes("\n")) {
    return `"${escaped.replace(/"/g, '""')}"`;
  }
  return escaped;
}

export async function saveTranslations(rows: TranslationRow[]): Promise<{ success: boolean; message: string }> {
  const lines = ["key,en,zh,status"];

  for (const row of rows) {
    const status = !row.en ? "missing-en" : !row.zh ? "missing-zh" : "ok";
    lines.push([escapeCSV(row.key), escapeCSV(row.en), escapeCSV(row.zh), status].join(","));
  }

  fs.writeFileSync(CSV_PATH, lines.join("\n"), "utf-8");

  return {
    success: true,
    message: "CSV saved. Run 'npx tsx scripts/i18n-table-editor.ts import' to update TS files.",
  };
}
