"""
conversion_logic_patriot.py
Standardizes PATRIOT's price-lists.
Logic:
- Single Sheet processing.
- IGNORES Hidden Rows.
- Fixes line breaks.
- Header = Row 1.
- Columns: 
    - Brand = Hardcoded "Patriot"
    - Model = Col A
    - Name = Cols B+C+D+E+F+G+H (Merged)
    - Price = Col I (USD)
- ROUNDS PRICES to 2 decimal places.
"""

import pandas as pd
import openpyxl
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

def clean_text(text):
    if not text or pd.isna(text):
        return ""
    return " ".join(str(text).split())

def get_sheet_config(sheet_name):
    # PATRIOT has one sheet.
    return {
        "header_row": 1,  # Data starts at row 2
        "indices": {
            "model": 0,   # Col A
            # Name maps to Cols B(1) through H(7)
            "name": [1, 2, 3, 4, 5, 6, 7], 
            "price": 8,   # Col I
            "stock": None, # Not specified, default to 1
            "notes": []
        }
    }

def standardize(input_path: str, output_path: str, include_no_price: bool = True):
    try:
        # Load workbook with openpyxl to access hidden rows
        wb = openpyxl.load_workbook(input_path, data_only=True)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    products = []
    stats = {
        'processed': 0,
        'skipped_hidden': 0
    }

    # Process the active sheet
    ws = wb.active
    sheet_name = ws.title
    config = get_sheet_config(sheet_name)
    
    start_row = config['header_row'] + 1 
    indices = config['indices']

    for row in ws.iter_rows(min_row=start_row, values_only=False):
        # 1. SKIP HIDDEN ROWS
        try:
            if ws.row_dimensions[row[0].row].hidden:
                stats['skipped_hidden'] += 1
                continue
        except:
            pass

        cells = [cell.value for cell in row]
        
        def get_val(idx):
            if idx is None: return ""
            if 0 <= idx < len(cells):
                val = cells[idx]
                return str(val).strip() if val is not None else ""
            return ""

        # 2. NAME (Merge B+C+D+E+F+G+H)
        name_parts = [clean_text(get_val(i)) for i in indices['name'] if get_val(i)]
        final_name = " ".join(name_parts)
        
        if not final_name:
            continue

        # 3. PRICE (Round to 2 decimals)
        raw_price = get_val(indices['price'])
        clean_price = "0"
        
        if raw_price:
            try:
                numeric_str = "".join(c for c in raw_price if c.isdigit() or c == '.')
                if numeric_str:
                    val = float(numeric_str)
                    val = round(val, 2)
                    
                    if val.is_integer():
                        clean_price = str(int(val))
                    else:
                        clean_price = str(val)
            except:
                if "call" in raw_price.lower():
                    clean_price = "CALL"
                else:
                    clean_price = "0"

        # 4. MODEL
        final_model = clean_text(get_val(indices['model']))

        # 5. BRAND (Hardcoded)
        final_brand = "Patriot"

        # 6. NOTES
        final_notes = ""
        if clean_price == "0":
            final_notes = "Price Not Specified"

        products.append({
            "Supplier": "PATRIOT",
            "Category": "Memory", # General category for Patriot
            "Brand": final_brand, 
            "Model": final_model,
            "Name": final_name,
            "Price": clean_price,
            "Currency": "USD", 
            "Stock": "1", # Default Stock
            "MOQ": "NO",
            "Notes": final_notes
        })
        stats['processed'] += 1

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for PATRIOT.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from PATRIOT.")
    print(f"  - Skipped hidden rows: {stats['skipped_hidden']}")