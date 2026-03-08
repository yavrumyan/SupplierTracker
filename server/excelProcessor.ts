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
 * Process a price list file (Excel or CSV buffer) using an optional Python
 * conversion script for column mapping hints.
 *
 * This is the TypeScript replacement for server/file_processor.py.
 * It cannot exec arbitrary Python, but it extracts column mappings from
 * the stored Python script using regex and falls back to heuristic detection.
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
