"""
conversion_logic_proks.py
Standardizes PROKS's price-lists.
Logic:
- Single Sheet processing.
- IGNORES Hidden Rows.
- Fixes line breaks.
- Header = Row 1.
- Columns: 
    - Name = Col B
    - Model = Col C
    - Price = Col E (USD)
    - Stock = Sum of Col H + Col I
    - Notes = "Price DAP EU"
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

def parse_number(val):
    """
    Parses a string or number into a float.
    Returns 0.0 if invalid.
    """
    if not val:
        return 0.0
    try:
        if isinstance(val, (int, float)):
            return float(val)
        
        # Remove non-numeric chars except dot
        numeric_str = "".join(c for c in str(val) if c.isdigit() or c == '.')
        if numeric_str:
            return float(numeric_str)
    except:
        pass
    return 0.0

def get_sheet_config(sheet_name):
    # PROKS has one sheet.
    return {
        "header_row": 1,  # Data starts at row 2
        "indices": {
            "name": [1],  # Col B
            "model": 2,   # Col C
            "price": 4,   # Col E
            "stock1": 7,  # Col H
            "stock2": 8,  # Col I
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

        # 4. STOCK (Sum of Col H + Col I)
        val_h = parse_number(get_val(indices['stock1']))
        val_i = parse_number(get_val(indices['stock2']))
        
        total_stock = int(val_h + val_i)
        clean_stock = str(total_stock)

        # 5. MODEL
        final_model = clean_text(get_val(indices['model']))

        # 6. NOTES (Hardcoded)
        final_notes = "Price DAP EU"

        products.append({
            "Supplier": "PROKS",
            "Category": "General", # Generic category
            "Brand": "", # Not specified in instructions
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
        print("Warning: No products found for PROKS.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from PROKS.")
    print(f"  - Skipped hidden rows: {stats['skipped_hidden']}")