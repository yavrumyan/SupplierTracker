"""
conversion_logic_elcore.py
Standardizes ELCORE's price-lists.
FIX: Solves "Empty First Sheet" error.
Logic:
1. Loads ALL sheets into memory first (sheet_name=None).
2. STRICTLY processes only sheets in the 'Allowlist'.
3. Ignores 'Лист1', 'Sheet1', 'Main', and all hidden/junk sheets.
"""

import pandas as pd
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

def clean_text(text):
    if not text or pd.isna(text):
        return ""
    return " ".join(str(text).split())

def find_header_row(df):
    """
    Scans the first 20 rows to find the true header row.
    Looks for keywords like 'Model', 'SKU', 'Наименование'.
    """
    for i in range(min(20, len(df))):
        row_str = df.iloc[i].astype(str).str.lower().tolist()
        full_row = " ".join(row_str)
        if "model" in full_row or "sku" in full_row or "наименование" in full_row:
            return i
    return None

def get_sheet_mapping(sheet_name):
    """
    ALLOWLIST: Only returns configuration for valid product sheets.
    Returns None for 'Лист1', 'Main', etc., causing them to be skipped.
    """
    s_name = sheet_name.strip()
    
    # --- ALLOWLIST CONFIGURATION ---
    
    # 1. Ноутбуки
    if s_name == "Ноутбуки":
        return {"model": 0, "brand": 1, "name": list(range(2, 13)), "price": 14, "notes": [15], "stock": 16}

    # 2. Моноблоки (AIO)
    elif s_name == "Моноблоки и Копьютеры":
        return {"model": 0, "brand": 1, "name": list(range(2, 15)), "price": 16, "notes": [17], "stock": 18}

    # 3. Печатная техника (Printers)
    elif s_name == "Печатная техника":
        return {"model": 0, "brand": None, "name": list(range(1, 10)), "price": 11, "notes": [13], "stock": 12}

    # 4. Мониторы (Monitors)
    elif s_name == "Мониторы":
        return {"model": 0, "brand": None, "name": [1, 2, 3, 4, 5, 6, 7, 13, 14, 17, 18], "price": 20, "notes": [21], "stock": 22}

    # 5. Планшеты (Tablets)
    elif s_name == "Планшеты":
        return {"model": 0, "brand": 1, "name": list(range(2, 9)), "price": 10, "notes": [11], "stock": 12}

    # 6. Интерактивные дисплеи
    elif s_name == "Интерактивные дисплеи":
        return {"model": 1, "brand": None, "name": [0, 2], "price": 5, "notes": [6], "stock": 3}

    # 7. UPS
    elif "UPS" in s_name:
        return {"model": 0, "brand": None, "name": [1, 2, 3, 6, 7, 8], "price": 12, "notes": [14, 15], "stock": 13}

    # 8. Xiaomi_ECO
    elif s_name == "Xiaomi_ECO":
        return {"model": 2, "brand": 0, "name": [1, 3], "price": 5, "notes": [6], "stock": 7}

    # 9. Смартфоны (Smartphones)
    elif s_name == "Смартфоны":
        return {"model": 0, "brand": 1, "name": list(range(2, 7)), "price": 8, "notes": [9], "stock": 10}

    # 10. OEM
    elif s_name == "OEM":
        return {"model": 0, "brand": None, "name": [1], "price": 3, "notes": None, "stock": 4}

    # === IMPLICIT BLOCK ===
    # 'Лист1', 'Sheet1', 'Main', 'Contacts' will return None here and be ignored.
    return None

def standardize(input_path: str, output_path: str):
    all_products = []
    
    try:
        # CRITICAL FIX: sheet_name=None reads ALL sheets into a dictionary first.
        # This prevents crashing if the *first* sheet (default) is empty.
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=None)
    except Exception as e:
        print(f"Critical Error reading Excel file: {e}")
        return

    for sheet_name, df in xls_dict.items():
        # 1. CHECK ALLOWLIST
        # If mapping is None (e.g. for "Лист1"), we SKIP immediately.
        mapping = get_sheet_mapping(sheet_name)
        if not mapping:
            continue

        # 2. FIND HEADER (Dynamic Scan)
        header_idx = find_header_row(df)
        if header_idx is None:
            # If we expected data but found no header, skip safely
            continue
            
        # 3. SLICE DATA (Start after header)
        df_data = df.iloc[header_idx+1:]
        
        # 4. EXTRACT ROW-BY-ROW
        for _, row in df_data.iterrows():
            def get_val(idx):
                if idx is None: return ""
                if idx >= len(row): return ""
                val = row.iloc[idx]
                return str(val).strip() if pd.notna(val) else ""

            # Check Price
            raw_price = get_val(mapping['price'])
            if not raw_price: continue

            # Clean Price
            clean_price = "0"
            try:
                numeric_str = "".join(c for c in raw_price if c.isdigit())
                if numeric_str: 
                    clean_price = str(int(numeric_str))
            except: 
                clean_price = "0"

            if clean_price == "0" and "call" not in raw_price.lower():
                pass 

            # Name
            name_idx = mapping['name']
            if isinstance(name_idx, list):
                name_parts = [clean_text(get_val(i)) for i in name_idx if get_val(i)]
                final_name = " ".join(name_parts)
            else:
                final_name = clean_text(get_val(name_idx))
            
            if not final_name: continue

            # Notes
            notes_idx = mapping.get('notes')
            final_notes = ""
            if notes_idx:
                if isinstance(notes_idx, list):
                    final_notes = ", ".join([clean_text(get_val(i)) for i in notes_idx if get_val(i)])
                else:
                    final_notes = clean_text(get_val(notes_idx))

            # Stock
            raw_stock = get_val(mapping.get('stock'))
            clean_stock = "0"
            if raw_stock:
                try:
                    clean_stock = str(int(float(raw_stock)))
                except:
                    if raw_stock != "0": clean_stock = "1"

            all_products.append({
                "Supplier": "ELCORE",
                "Category": clean_text(sheet_name),
                "Brand": clean_text(get_val(mapping.get('brand'))),
                "Model": clean_text(get_val(mapping['model'])),
                "Name": final_name,
                "Price": clean_price,
                "Currency": "AMD",
                "Stock": clean_stock,
                "MOQ": "NO",
                "Notes": final_notes
            })

    # Output
    df_out = pd.DataFrame(all_products)
    
    if df_out.empty:
        # Fallback to prevent system crash if file is totally empty
        print("Warning: No products found. Saving empty template.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success. Converted {len(df_out)} items from ELCORE.")