"""
conversion_logic_sven.py
Standardizes SVEN's price-lists.
Logic:
- Single Sheet processing.
- IGNORES Hidden Rows.
- Fixes line breaks.
- Header = Row 1.
- Columns: 
    - Brand = Hardcoded "SVEN"
    - Model = Col A
    - Name = Col B
    - Price = Col C (USD)
    - Stock = Col D (Handles "500+" -> 500)
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
    # SVEN has one sheet.
    return {
        "header_row": 1,  # Data starts at row 2
        "indices": {
            "model": 0,   # Col A
            "name": [1],  # Col B
            "price": 2,   # Col C
            "stock": 3,   # Col D
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

        # 2. NAME (Required)
        name_parts = [clean_text(get_val(i)) for i in indices['name'] if get_val(i)]
        final_name = " ".join(name_parts)
        if not final_name:
            continue

        # 3. PRICE (Round to 2 decimals)
        raw_price = get_val(indices['price'])
        clean_price = "0"
        
        if raw_price:
            try:
                # Remove '$' and ',' then convert
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

        # 4. STOCK (Handle "500+" -> 500)
        raw_stock = get_val(indices['stock'])
        clean_stock = "0"
        
        if raw_stock:
            try:
                # Remove "+" and other non-numeric chars except digits and dots
                # "500+" becomes "500"
                numeric_stock = "".join(c for c in raw_stock if c.isdigit() or c == '.')
                
                if numeric_stock:
                    val = float(numeric_stock)
                    clean_stock = str(int(val))
                else:
                    # Fallback for text words
                    if raw_stock.lower() not in ["0", "-", "no", "absent"]:
                        clean_stock = "1"
            except:
                clean_stock = "1"
        else:
            clean_stock = "1" # Default if empty

        # 5. MODEL
        final_model = clean_text(get_val(indices['model']))

        # 6. BRAND (Hardcoded)
        final_brand = "SVEN"

        # 7. NOTES
        final_notes = ""
        if clean_price == "0":
            final_notes = "Price Not Specified"

        products.append({
            "Supplier": "SVEN",
            "Category": "Electronics", # General category
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

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for SVEN.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from SVEN.")
    print(f"  - Skipped hidden rows: {stats['skipped_hidden']}")