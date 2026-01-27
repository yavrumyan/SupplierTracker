"""
conversion_logic_elcore.py
Standardizes ELCORE's price-lists.
STRICT MODE: Ignores ALL sheets except those explicitly defined in the Allowlist.
FIXED: Added "парт-номер" keyword for Мониторы sheet header detection.
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
    Looks for various header keywords in Latin and Cyrillic.
    """
    for i in range(min(20, len(df))):
        row_str = df.iloc[i].astype(str).str.lower().tolist()
        full_row = " ".join(row_str)
        # Check for various header keywords
        keywords = [
            "model", "sku", "наименование", "парт-номер", "парт номер",
            "product type", "product code", "product title",
            "артикул", "модель", "ctn", "description"
        ]
        if any(keyword in full_row for keyword in keywords):
            return i
    return None

def get_sheet_mapping(sheet_name):
    """
    Returns column INDICES (0-based) ONLY for known sheets.
    Returns None for everything else (effectively ignoring it).
    """
    s_name = sheet_name.strip()
    
    # --- ALLOWLIST ---
    # We only return config for these exact names. Everything else gets None.

    # 1. Ноутбуки (Notebooks)
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

    # 7. UPS (Partial match allowed for safety, but typically just "UPS ")
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

    # === IMPLICIT DENY ===
    # Any sheet not listed above returns None and will be skipped.
    return None

def standardize(input_path: str, output_path: str):
    all_products = []
    
    try:
        # Read ALL sheets without assumption
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=None)
    except Exception as e:
        print(f"Critical Error reading Excel: {e}")
        return

    for sheet_name, df in xls_dict.items():
        # Get mapping. If None, it means we skip this sheet.
        mapping = get_sheet_mapping(sheet_name)
        if not mapping:
            # This silently ignores Main, Contacts, Hidden Sheets, Empty Sheets, etc.
            continue

        # 1. FIND HEADER
        header_idx = find_header_row(df)
        if header_idx is None:
            print(f"Warning: Could not find header in sheet '{sheet_name}', skipping...")
            continue
            
        # 2. SLICE DATA
        df_data = df.iloc[header_idx+1:]
        
        # 3. EXTRACT
        items_count = 0
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
            items_count += 1
        
        if items_count > 0:
            print(f"  ✓ {sheet_name}: {items_count} items")

    # Output
    df_out = pd.DataFrame(all_products)
    
    if df_out.empty:
        print("Warning: No products found. Saving empty template.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\nSuccess! Converted {len(df_out)} total items.")
