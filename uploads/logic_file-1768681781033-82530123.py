"""
conversion_logic_crown.py
Standardizes CROWN's price-lists.
Logic:
- Single Sheet processing.
- IGNORES Hidden Rows.
- Fixes line breaks.
- Header = Row 4.
- Columns: A=Brand, C=Model, G=Name, O=Price(USD), Q=Stock, H=Notes.
- PRESERVES DECIMALS (e.g. 9.38).
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
    return {
        "header_row": 4,  
        "indices": {
            "brand": 0,   # Col A
            "model": 2,   # Col C
            "name": [6],  # Col G
            "price": 14,  # Col O
            "stock": 16,  # Col Q
            "notes": [7]  # Col H
        }
    }

def standardize(input_path: str, output_path: str, include_no_price: bool = True):
    try:
        wb = openpyxl.load_workbook(input_path, data_only=True)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    products = []
    stats = {
        'processed': 0,
        'skipped_hidden': 0
    }

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

        # 2. NAME (Required)
        name_parts = [clean_text(get_val(i)) for i in indices['name'] if get_val(i)]
        final_name = " ".join(name_parts)
        if not final_name:
            continue

        # 3. PRICE (Preserve Decimals)
        raw_price = get_val(indices['price'])
        clean_price = "0"
        
        if raw_price:
            try:
                # Remove '$' and ',' then convert to float
                numeric_str = "".join(c for c in raw_price if c.isdigit() or c == '.')
                if numeric_str:
                    val = float(numeric_str)
                    # If it's a whole number (e.g. 9.0), save as "9". Else save as "9.38"
                    if val.is_integer():
                        clean_price = str(int(val))
                    else:
                        clean_price = str(val)
            except:
                if "call" in raw_price.lower():
                    clean_price = "CALL"
                else:
                    clean_price = "0"

        # 4. STOCK
        raw_stock = get_val(indices['stock'])
        clean_stock = "0"
        if raw_stock:
            try:
                val = float(raw_stock)
                clean_stock = str(int(val))
            except:
                if raw_stock.lower() not in ["0", "-", "no", "net", "absent"]:
                    clean_stock = "1"

        # 5. BRAND, MODEL & NOTES
        final_brand = clean_text(get_val(indices['brand']))
        final_model = clean_text(get_val(indices['model']))
        
        notes_parts = [clean_text(get_val(i)) for i in indices['notes'] if get_val(i)]
        if clean_price == "0":
            notes_parts.append("Price Not Specified")
        final_notes = ", ".join(notes_parts)

        products.append({
            "Supplier": "CROWN",
            "Category": "General", 
            "Brand": final_brand, 
            "Model": final_model,
            "Name": final_name,
            "Price": clean_price,
            "Currency": "USD", 
            "Stock": clean_stock,
            "MOQ": "NO",
            "Notes": final_notes
        })
        stats['processed'] += 1

    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for CROWN.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from CROWN.")
    print(f"  - Skipped hidden rows: {stats['skipped_hidden']}")