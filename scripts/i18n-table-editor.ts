import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

type DictionaryValue = string;
type DictionaryNode = { [key: string]: DictionaryValue | DictionaryNode };
type FlatDictionary = { [key: string]: string };

const I18N_DIR = path.join(process.cwd(), 'lib', 'i18n');
const EN_FILE = path.join(I18N_DIR, 'en.ts');
const ZH_FILE = path.join(I18N_DIR, 'zh.ts');
const CSV_FILE = path.join(process.cwd(), 'docs', 'i18n-table.csv');

function parseDictionaryFile(filePath: string): DictionaryNode {
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    path.basename(filePath),
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  let dictionaryNode: ts.ObjectLiteralExpression | null = null;

  function visit(node: ts.Node) {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          const varName = declaration.name.text;
          if (varName === 'enDictionary' || varName === 'zhDictionary') {
            let initializer = declaration.initializer;
            // Handle 'as const' assertion
            if (initializer && ts.isAsExpression(initializer)) {
              initializer = initializer.expression;
            }
            // Handle 'as const satisfies Dictionary'
            if (initializer && ts.isSatisfiesExpression(initializer)) {
              initializer = initializer.expression;
              if (ts.isAsExpression(initializer)) {
                initializer = initializer.expression;
              }
            }
            if (initializer && ts.isObjectLiteralExpression(initializer)) {
              dictionaryNode = initializer;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!dictionaryNode) {
    throw new Error(`Could not find dictionary export in ${filePath}`);
  }

  return extractObject(dictionaryNode);
}

function extractObject(node: ts.ObjectLiteralExpression): DictionaryNode {
  const result: DictionaryNode = {};

  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const key = prop.name.text;
      const value = prop.initializer;

      if (ts.isStringLiteral(value)) {
        result[key] = value.text;
      } else if (ts.isArrowFunction(value) || ts.isFunctionExpression(value)) {
        // Store function as string representation
        const funcText = value.getText();
        result[key] = funcText;
      } else if (ts.isObjectLiteralExpression(value)) {
        result[key] = extractObject(value);
      }
    }
  }

  return result;
}

function flattenDictionary(dict: DictionaryNode, prefix = ''): FlatDictionary {
  const result: FlatDictionary = {};

  for (const [key, value] of Object.entries(dict)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      // Check if it's a function string (starts with '(' or 'function')
      if (value.startsWith('(') || value.startsWith('function')) {
        // Replace newlines with a placeholder for CSV storage
        const funcStr = value.replace(/\n/g, '\\n');
        result[fullKey] = `[FUNCTION] ${funcStr}`;
      } else {
        result[fullKey] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenDictionary(value as DictionaryNode, fullKey));
    }
  }

  return result;
}

function unflattenDictionary(flat: FlatDictionary): DictionaryNode {
  const result: DictionaryNode = {};

  for (const [fullKey, value] of Object.entries(flat)) {
    const keys = fullKey.split('.');
    let current: DictionaryNode = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key] as DictionaryNode;
    }

    const lastKey = keys[keys.length - 1];
    if (value.startsWith('[FUNCTION] ')) {
      // Restore newlines from placeholder
      const funcStr = value.substring(11).replace(/\\n/g, '\n');
      current[lastKey] = funcStr;
    } else {
      current[lastKey] = value;
    }
  }

  return result;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
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
      } else if (char === ',') {
        result.push(current);
        current = '';
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

function exportToCSV() {
  console.log('Exporting i18n dictionaries to CSV...');

  const enDict = parseDictionaryFile(EN_FILE);
  const zhDict = parseDictionaryFile(ZH_FILE);

  const enFlat = flattenDictionary(enDict);
  const zhFlat = flattenDictionary(zhDict);

  const allKeys = Array.from(new Set([...Object.keys(enFlat), ...Object.keys(zhFlat)])).sort();

  const lines = ['key,en,zh,status'];

  for (const key of allKeys) {
    const enValue = enFlat[key] || '';
    const zhValue = zhFlat[key] || '';
    const status = !enValue ? 'missing-en' : !zhValue ? 'missing-zh' : 'ok';

    lines.push([
      escapeCSV(key),
      escapeCSV(enValue),
      escapeCSV(zhValue),
      status
    ].join(','));
  }

  fs.writeFileSync(CSV_FILE, lines.join('\n'), 'utf-8');
  console.log(`✓ Exported ${allKeys.length} keys to ${CSV_FILE}`);
}

function importFromCSV() {
  console.log('Importing i18n dictionaries from CSV...');

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(`CSV file not found: ${CSV_FILE}`);
  }

  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const enFlat: FlatDictionary = {};
  const zhFlat: FlatDictionary = {};

  for (let i = 1; i < lines.length; i++) {
    const columns = parseCSVLine(lines[i]);
    if (columns.length < 3) continue;

    const [key, enValue, zhValue] = columns;

    if (key && enValue) enFlat[key] = enValue;
    if (key && zhValue) zhFlat[key] = zhValue;
  }

  const enDict = unflattenDictionary(enFlat);
  const zhDict = unflattenDictionary(zhFlat);

  writeDictionaryFile(EN_FILE, 'enDictionary', enDict, false);
  writeDictionaryFile(ZH_FILE, 'zhDictionary', zhDict, true);

  console.log(`✓ Imported ${Object.keys(enFlat).length} keys`);
  console.log(`✓ Updated ${EN_FILE}`);
  console.log(`✓ Updated ${ZH_FILE}`);
}

function writeDictionaryFile(filePath: string, varName: string, dict: DictionaryNode, isZh: boolean) {
  const content = generateDictionaryContent(varName, dict, isZh);
  fs.writeFileSync(filePath, content, 'utf-8');
}

function generateDictionaryContent(varName: string, dict: DictionaryNode, isZh: boolean): string {
  const indent = '  ';
  
  function generateObject(obj: DictionaryNode, level: number): string {
    const currentIndent = indent.repeat(level);
    const nextIndent = indent.repeat(level + 1);
    const entries: string[] = [];

    const keys = Object.keys(obj);

    for (const key of keys) {
      const value = obj[key];
      let valueStr: string;
      
      if (typeof value === 'string') {
        // Check if it's a function string
        if (value.startsWith('(') || value.startsWith('function')) {
          valueStr = value;
        } else {
          valueStr = JSON.stringify(value);
        }
      } else {
        valueStr = generateObject(value as DictionaryNode, level + 1);
      }

      entries.push(`${nextIndent}${key}: ${valueStr}`);
    }

    return `{\n${entries.join(',\n')}\n${currentIndent}}`;
  }

  const importLine = isZh
    ? `import type { Dictionary } from "@/lib/i18n/en";\n\n`
    : `type WidenDictionary<T> = T extends string\n  ? string\n  : T extends (...args: infer Args) => infer Return\n    ? (...args: Args) => Return\n    : { [Key in keyof T]: WidenDictionary<T[Key]> };\n\n`;

  const exportLine = `export const ${varName} = `;
  const typeAnnotation = isZh ? ' as const satisfies Dictionary' : ' as const';
  const objectContent = generateObject(dict, 0);
  const typeExport = isZh ? '' : `\nexport type Dictionary = WidenDictionary<typeof ${varName}>;\n`;

  return importLine + exportLine + objectContent + typeAnnotation + ';\n' + typeExport;
}

// Main
const command = process.argv[2];

if (command === 'export') {
  exportToCSV();
} else if (command === 'import') {
  importFromCSV();
} else {
  console.log('Usage:');
  console.log('  npx tsx scripts/i18n-table-editor.ts export  - Export dictionaries to CSV');
  console.log('  npx tsx scripts/i18n-table-editor.ts import  - Import dictionaries from CSV');
  process.exit(1);
}
