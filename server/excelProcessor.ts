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
 *   # SUPHUB_CONFIG: { ... }
 *
 * Fields:
 *   header           – null → read all rows as plain arrays (no header row)
 *   skip_rows        – how many leading rows to discard
 *   multi_sheet      – true → process ALL sheets in the workbook (not just the first)
 *   category_from_sheet – true → use the sheet name as the Category field value
 *   section_col      – column index whose value marks a section-header row
 *   section_marker   – if section_col value contains this string (case-insensitive)
 *                      the row is a section/category header, not a product
 *   category_col     – column index that holds the category name in section rows
 *   default_category – category to use before the first section header is seen
 *   col_mapping      – { "colIndex": "Target Field", ... }  (1-to-1)
 *   combine_cols     – { "Target Field": CombineColConfig, ... }
 *                      CombineColConfig: { cols, sep?, filter? }
 *                        cols   – array of column indices to join
 *                        sep    – join separator (default " ")
 *                        filter – lowercase values to skip when joining
 *   price_clean      – array of field names to clean: strip "$", strip trailing ".0"
 *   defaults         – fixed values added to every output row
 *   output_columns   – enforce exact column order in the output CSV
 */
interface CombineColConfig {
  cols: number[];
  sep?: string;      // default " "
  filter?: string[]; // lowercase values to exclude when joining
}

interface SupHubConfig {
  header: null | number;
  skip_rows?: number;
  multi_sheet?: boolean;         // process every sheet, not just the first
  category_from_sheet?: boolean; // use sheet name as the Category field
  section_col?: number;
  section_marker?: string;
  category_col?: number;
  default_category?: string;
  col_mapping?: Record<string, string>;
  combine_cols?: Record<string, number[] | CombineColConfig>;
  price_clean?: string[];
  defaults?: Record<string, string>;
  output_columns?: string[];
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
 * Build a ProcessResult from a processed data array.
 */
function buildProcessResult(
  processedData: Record<string, string>[],
  outputCols?: string[]
): ProcessResult {
  if (processedData.length === 0) {
    return { success: false, error: "No valid product rows found after applying SUPHUB_CONFIG" };
  }

  const outputColumns = Object.keys(processedData[0]);
  const outputSheetObj = XLSX.utils.json_to_sheet(processedData);
  const csvContent = XLSX.utils.sheet_to_csv(outputSheetObj);

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
 * Core row-processing logic for a single sheet.
 * Returns a plain data array so it can be called per-sheet for multi-sheet workbooks.
 *
 * @param sheet            XLSX worksheet to process
 * @param config           Parsed SUPHUB_CONFIG
 * @param supplierName     Optional supplier name override
 * @param categoryOverride When set (e.g. sheet name), seeds currentCategory before
 *                         processing begins. Overrides default_category but can still
 *                         be replaced by in-sheet section headers if section_col is set.
 */
function processSheetRows(
  sheet: XLSX.WorkSheet,
  config: SupHubConfig,
  supplierName?: string,
  categoryOverride?: string
): Record<string, string>[] {
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

  const skipRows      = config.skip_rows ?? 0;
  const sectionCol    = config.section_col;
  const sectionMarker = config.section_marker?.toLowerCase();
  const categoryCol   = config.category_col ?? 0;
  const colMapping    = config.col_mapping ?? {};
  const defaults      = config.defaults ?? {};
  const priceCleaner  = new Set(config.price_clean ?? []);
  const outputCols    = config.output_columns;

  // categoryOverride (sheet name) takes precedence over default_category
  let currentCategory = categoryOverride ?? config.default_category ?? "";
  const processedData: Record<string, string>[] = [];
  const rowMeta = (sheet["!rows"] ?? []) as Array<{ hidden?: boolean } | undefined>;

  for (let i = skipRows; i < allRows.length; i++) {
    // Skip rows hidden in the original Excel workbook
    if (rowMeta[i]?.hidden) continue;

    const row = (allRows[i] as unknown[]).map((v) =>
      typeof v === "string" ? v.replace(/\s+/g, " ").trim() : v
    );

    // Skip completely empty rows
    if (row.every((v) => v === "" || v === null || v === undefined)) continue;

    // Detect section-header row
    if (sectionCol !== undefined && sectionMarker !== undefined) {
      const sectionVal = String(row[sectionCol] ?? "").toLowerCase().trim();
      if (sectionVal.includes(sectionMarker)) {
        const catVal = String(row[categoryCol] ?? "").trim();
        if (catVal) currentCategory = catVal;
        continue;
      }
    }

    const outRow: Record<string, string> = { ...defaults };
    if (currentCategory) outRow["Category"] = currentCategory;

    // combine_cols: join multiple columns into one field
    for (const [targetField, colCfg] of Object.entries(config.combine_cols ?? {})) {
      const cfg: CombineColConfig = Array.isArray(colCfg)
        ? { cols: colCfg as number[], sep: " " }
        : (colCfg as CombineColConfig);
      const sep        = cfg.sep ?? " ";
      const filterSet  = new Set((cfg.filter ?? []).map((f) => f.toLowerCase()));

      const parts = cfg.cols
        .filter((idx) => idx < row.length)
        .map((idx) => String(row[idx] ?? "").trim())
        .filter((v) => v !== "" && !filterSet.has(v.toLowerCase()));

      if (parts.length > 0) outRow[targetField] = parts.join(sep);
    }

    // col_mapping: single column → target field
    for (const [colIdxStr, targetField] of Object.entries(colMapping)) {
      const idx = parseInt(colIdxStr, 10);
      if (idx < row.length) {
        const val = String(row[idx] ?? "").trim();
        if (val) outRow[targetField] = val;
      }
    }

    // price_clean: strip "$", strip trailing ".0"
    for (const field of priceCleaner) {
      if (outRow[field] !== undefined) {
        let p = outRow[field].replace(/\$/g, "").trim();
        if (p.endsWith(".0")) p = p.slice(0, -2);
        outRow[field] = p;
      }
    }

    if (supplierName && !outRow["Supplier"]) outRow["Supplier"] = supplierName;

    // Skip rows without a valid numeric price
    const priceVal = outRow["Price"];
    if (!priceVal || isNaN(parseFloat(priceVal.replace(/[, ]/g, "")))) continue;

    // Skip rows without a product name
    const nameVal = outRow["Name"] || outRow["Product Name"];
    if (!nameVal) continue;

    // Enforce output column order
    if (outputCols) {
      const ordered: Record<string, string> = {};
      for (const col of outputCols) {
        ordered[col] = outRow[col] ?? "";
      }
      // Append any extra columns not listed in output_columns
      for (const [k, v] of Object.entries(outRow)) {
        if (!outputCols.includes(k)) ordered[k] = v;
      }
      processedData.push(ordered);
    } else {
      processedData.push(outRow);
    }
  }

  return processedData;
}

/**
 * Process a price list that has no proper header row — single sheet variant.
 * Uses SUPHUB_CONFIG to handle: skipping leading rows, detecting section
 * headers for category extraction, positional column mapping, combine_cols,
 * price cleaning, and enforced output column order.
 */
function processWithConfig(
  sheet: XLSX.WorkSheet,
  config: SupHubConfig,
  supplierName?: string
): ProcessResult {
  const data = processSheetRows(sheet, config, supplierName);
  return buildProcessResult(data, config.output_columns);
}

/**
 * Process a price list that has no proper header row — multi-sheet variant.
 * Iterates ALL sheets in the workbook, optionally using the sheet name as
 * the Category field, and concatenates all results into a single output.
 */
function processWithConfigMultiSheet(
  workbook: XLSX.WorkBook,
  config: SupHubConfig,
  supplierName?: string
): ProcessResult {
  const allData: Record<string, string>[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    const categoryOverride = config.category_from_sheet ? sheetName : undefined;
    const rows = processSheetRows(ws, config, supplierName, categoryOverride);
    allData.push(...rows);
  }

  return buildProcessResult(allData, config.output_columns);
}

/**
 * Process a price list file (Excel or CSV buffer) using an optional Python
 * conversion script for column mapping hints.
 *
 * Supports three modes, tried in order:
 *  1. SUPHUB_CONFIG directive  – for non-standard layouts
 *     1a. multi_sheet: true    – iterates every sheet, uses sheet name as Category
 *     1b. (default)            – processes first non-empty sheet only
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
      workbook = XLSX.read(fileBuffer, { type: "buffer", cellStyles: true });
    }

    // ── Mode 1: SUPHUB_CONFIG ─────────────────────────────────────────────────
    if (logicContent) {
      const config = extractSupHubConfig(logicContent);
      if (config && config.header === null) {
        // 1a: multi-sheet — iterate ALL sheets and concatenate results
        if (config.multi_sheet) {
          return processWithConfigMultiSheet(workbook, config, supplierName);
        }
        // 1b: single-sheet — pick first non-empty sheet
        let sheet: XLSX.WorkSheet | undefined;
        for (const name of workbook.SheetNames) {
          const s = workbook.Sheets[name];
          if (XLSX.utils.sheet_to_json(s).length > 0) {
            sheet = s;
            break;
          }
        }
        if (!sheet) sheet = workbook.Sheets[workbook.SheetNames[0]];
        return processWithConfig(sheet, config, supplierName);
      }
    }

    // ── Mode 2 & 3: header-row based processing ───────────────────────────────
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

    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rawData.length === 0) {
      return { success: false, error: "File is empty or contains no data" };
    }

    const headers = Object.keys(rawData[0]);

    let mapping = extractMappingFromPython(logicContent);
    if (Object.keys(mapping).length === 0) {
      mapping = autoDetectMapping(headers);
    }

    const processedData: Record<string, string>[] = rawData.map((row) => {
      const out: Record<string, string> = {};
      for (const [src, tgt] of Object.entries(mapping)) {
        if (row[src] !== undefined) out[tgt] = String(row[src] ?? "");
      }
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
