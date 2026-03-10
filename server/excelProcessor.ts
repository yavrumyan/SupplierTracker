import XLSX from "xlsx";

export interface ProcessResult {
  success: boolean;
  csvContent?: string;
  outputFilename?: string;
  rowCount?: number;
  columnCount?: number;
  columns?: string[];
  previewHtml?: string;
  error?: string;
}

type ColumnMapping = Record<string, string>; // sourceCol → targetCol

/**
 * SUPHUB_CONFIG: a JSON directive embedded as a comment at the top of a Python
 * conversion script. Enables "raw-row" mode for price lists that don't have
 * proper column headers (e.g. contact info in row 0, section headers mixed in).
 *
 * Example (paste at line 1 of the .py file):
 *   # SUPHUB_CONFIG: {"header":null,"skip_rows":2,"section_col":4,"section_marker":"price","category_col":0,"col_mapping":{"0":"Product Name","1":"Model","3":"Notes","4":"Price","6":"Warranty"},"defaults":{"Supplier":"SPTECH","Currency":"USD","Stock":"1","MOQ":"NO"}}
 *
 * Fields:
 *   header        – null  → read all rows as plain arrays (no header row)
 *   skip_rows     – how many leading rows to discard (contact info etc.)
 *   section_col   – column index whose value marks a section-header row
 *   section_marker– if section_col value contains this string (case-insensitive)
 *                   the row is treated as a section/category header, not a product
 *   category_col  – column index that holds the category name in section rows
 *   col_mapping   – { "colIndex": "Target Field Name", ... }
 *   defaults      – fixed values added to every output row
 */
interface SupHubConfig {
  header: null | number;
  skip_rows?: number;
  section_col?: number;
  section_marker?: string;
  category_col?: number;
  col_mapping?: Record<string, string>;  // col index (as string) → target field (1-to-1)
  combine_cols?: Record<string, number[]>; // target field → [col indices to join with space]
  defaults?: Record<string, string>;
}

function extractSupHubConfig(pythonCode: string): SupHubConfig | null {
  const match = pythonCode.match(/^#\s*SUPHUB_CONFIG:\s*(.+)$/m);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as SupHubConfig;
  } catch {
    return null;
  }
}

/**
 * Parse a Python conversion script to extract column mappings.
 * Supports two common patterns used in the codebase:
 *  1. pd.DataFrame({'TargetCol': df['SourceCol'], ...})
 *  2. column_mapping = {'OldName': 'NewName', ...}
 */
function extractMappingFromPython(pythonCode: string): ColumnMapping {
  const mapping: ColumnMapping = {};

  // Pattern 1: pd.DataFrame({'TargetCol': df['SourceCol'], ...})
  const dfPattern = /["']([^"']+)["']\s*:\s*df\[["']([^"']+)["']\]/g;
  let m: RegExpExecArray | null;
  while ((m = dfPattern.exec(pythonCode)) !== null) {
    mapping[m[2]] = m[1]; // source → target
  }

  // Pattern 2: column_mapping = {'OldName': 'NewName', ...}
  const dictMatch = pythonCode.match(/column_mapping\s*=\s*\{([^}]+)\}/s);
  if (dictMatch) {
    const pairPattern = /["']([^"']+)["']\s*:\s*["']([^"']+)["']/g;
    while ((m = pairPattern.exec(dictMatch[1])) !== null) {
      mapping[m[1]] = m[2]; // old → new
    }
  }

  return mapping;
}

/** Heuristic column detection for common supplier price list formats. */
function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const patterns: Record<string, RegExp[]> = {
    "Product Name": [/product.?name/i, /^name$/i, /description/i, /марка/i, /наименование/i, /товар/i],
    Brand: [/brand/i, /manufacturer/i, /бренд/i, /производитель/i],
    Category: [/category/i, /тип/i, /категория/i, /группа/i],
    Model: [/^model$/i, /^sku$/i, /^pn$/i, /part.?num/i, /артикул/i, /^код/i],
    Price: [/price/i, /цена/i, /стоимость/i, /прайс/i],
    Currency: [/currency/i, /валюта/i, /^cur$/i],
    Stock: [/stock/i, /^qty$/i, /quantity/i, /остат/i, /склад/i, /наличие/i],
    Warranty: [/warranty/i, /гарантия/i],
    Notes: [/notes/i, /comment/i, /примечание/i, /описание/i],
  };

  for (const header of headers) {
    for (const [targetCol, regexps] of Object.entries(patterns)) {
      if (
        regexps.some((r) => r.test(header)) &&
        !Object.values(mapping).includes(targetCol)
      ) {
        mapping[header] = targetCol;
        break;
      }
    }
  }
  return mapping;
}

function buildPreviewHtml(rows: Record<string, string>[], columns: string[]): string {
  let html = '<table class="table table-striped" id="price-list-preview"><thead><tr>';
  columns.forEach((h) => { html += `<th>${h}</th>`; });
  html += "</tr></thead><tbody>";
  rows.slice(0, 10).forEach((row) => {
    html += "<tr>";
    columns.forEach((h) => { html += `<td>${row[h] ?? ""}</td>`; });
    html += "</tr>";
  });
  html += "</tbody></table>";
  return html;
}

/**
 * Process a price list that has no proper header row.
 * Uses SUPHUB_CONFIG to handle: skipping leading rows, detecting section
 * headers for category extraction, and positional column mapping.
 */
function processWithConfig(
  sheet: XLSX.WorkSheet,
  config: SupHubConfig,
  supplierName?: string
): ProcessResult {
  // Read all rows as raw arrays (no header interpretation)
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const skipRows = config.skip_rows ?? 0;
  const sectionCol = config.section_col;
  const sectionMarker = config.section_marker?.toLowerCase();
  const categoryCol = config.category_col ?? 0;
  const colMapping = config.col_mapping ?? {};
  const defaults = config.defaults ?? {};

  let currentCategory = "";
  const processedData: Record<string, string>[] = [];

  for (let i = skipRows; i < allRows.length; i++) {
    const row = allRows[i] as unknown[];

    // Skip completely empty rows
    if (row.every((v) => v === "" || v === null || v === undefined)) continue;

    // Detect section-header row (e.g. "VGA,,,,Price,,Warr.,,,,")
    if (sectionCol !== undefined && sectionMarker !== undefined) {
      const sectionVal = String(row[sectionCol] ?? "").toLowerCase().trim();
      if (sectionVal.includes(sectionMarker)) {
        const catVal = String(row[categoryCol] ?? "").trim();
        if (catVal) currentCategory = catVal;
        continue;
      }
    }

    // Build output row from positional col_mapping and combine_cols
    const outRow: Record<string, string> = { ...defaults };
    if (currentCategory) outRow["Category"] = currentCategory;

    // combine_cols: join multiple column values into one field (space-separated)
    for (const [targetField, indices] of Object.entries(config.combine_cols ?? {})) {
      const parts = indices
        .filter((idx) => idx < row.length)
        .map((idx) => String(row[idx] ?? "").trim())
        .filter((v) => v !== "");
      if (parts.length > 0) outRow[targetField] = parts.join(" ");
    }

    // col_mapping: single column → target field (1-to-1)
    for (const [colIdxStr, targetField] of Object.entries(colMapping)) {
      const idx = parseInt(colIdxStr, 10);
      if (idx < row.length) {
        const val = String(row[idx] ?? "").trim();
        if (val) outRow[targetField] = val;
      }
    }

    if (supplierName && !outRow["Supplier"]) outRow["Supplier"] = supplierName;

    // Skip rows without a valid numeric price
    const priceVal = outRow["Price"];
    if (!priceVal || isNaN(parseFloat(priceVal.replace(/[,$]/g, "")))) continue;

    // Skip rows without a product name
    const nameVal = outRow["Product Name"] || outRow["Name"];
    if (!nameVal) continue;

    processedData.push(outRow);
  }

  if (processedData.length === 0) {
    return { success: false, error: "No valid product rows found after applying SUPHUB_CONFIG" };
  }

  const outputColumns = Object.keys(processedData[0]);
  const outputSheet = XLSX.utils.json_to_sheet(processedData);
  const csvContent = XLSX.utils.sheet_to_csv(outputSheet);

  return {
    success: true,
    csvContent,
    outputFilename: "converted_price_list.csv",
    rowCount: processedData.length,
    columnCount: outputColumns.length,
    columns: outputColumns,
    previewHtml: buildPreviewHtml(processedData, outputColumns),
  };
}

/**
 * Process a price list file (Excel or CSV buffer) using an optional Python
 * conversion script for column mapping hints.
 *
 * Supports three modes, tried in order:
 *  1. SUPHUB_CONFIG directive  – for non-standard layouts (no header row, section rows)
 *  2. Python regex extraction  – pd.DataFrame({'Target': df['Source']}) or column_mapping dict
 *  3. Heuristic auto-detection – regex-based column name matching
 */
export function processPriceList(
  fileBuffer: Buffer,
  fileExtension: string,
  logicContent: string,
  supplierName?: string
): ProcessResult {
  try {
    let workbook: XLSX.WorkBook;
    if (fileExtension === ".csv") {
      workbook = XLSX.read(fileBuffer.toString("utf8"), { type: "string" });
    } else {
      workbook = XLSX.read(fileBuffer, { type: "buffer" });
    }

    // Pick first non-empty sheet
    let sheet: XLSX.WorkSheet | undefined;
    for (const name of workbook.SheetNames) {
      const s = workbook.Sheets[name];
      if (XLSX.utils.sheet_to_json(s).length > 0) {
        sheet = s;
        break;
      }
    }
    if (!sheet) sheet = workbook.Sheets[workbook.SheetNames[0]];

    // ── Mode 1: SUPHUB_CONFIG (non-standard layouts) ──────────────────────────
    if (logicContent) {
      const config = extractSupHubConfig(logicContent);
      if (config && config.header === null) {
        return processWithConfig(sheet, config, supplierName);
      }
    }

    // ── Mode 2 & 3: header-row based processing ───────────────────────────────
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rawData.length === 0) {
      return { success: false, error: "File is empty or contains no data" };
    }

    const headers = Object.keys(rawData[0]);

    // Resolve column mapping: Python code first, then heuristic
    let mapping = extractMappingFromPython(logicContent);
    if (Object.keys(mapping).length === 0) {
      mapping = autoDetectMapping(headers);
    }

    // Build processed rows
    const processedData: Record<string, string>[] = rawData.map((row) => {
      const out: Record<string, string> = {};
      for (const [src, tgt] of Object.entries(mapping)) {
        if (row[src] !== undefined) out[tgt] = String(row[src] ?? "");
      }
      // Copy unmapped columns as-is
      for (const [col, val] of Object.entries(row)) {
        if (!mapping[col] && !Object.values(mapping).includes(col)) {
          out[col] = String(val ?? "");
        }
      }
      if (!out["Supplier"] && supplierName) out["Supplier"] = supplierName;
      return out;
    });

    const outputColumns = processedData.length > 0 ? Object.keys(processedData[0]) : [];
    const outputSheet = XLSX.utils.json_to_sheet(processedData);
    const csvContent = XLSX.utils.sheet_to_csv(outputSheet);

    return {
      success: true,
      csvContent,
      outputFilename: "converted_price_list.csv",
      rowCount: processedData.length,
      columnCount: outputColumns.length,
      columns: outputColumns,
      previewHtml: buildPreviewHtml(processedData, outputColumns),
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
