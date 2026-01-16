"""
conversion_logic_elcore.py
Standardizes ELCORE's price-lists.
STRATEGY: Pure Pandas. Scans dynamically for headers. Ignores filters/hidden status.
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
    Returns the index of the header row, or None.
    """
    for i in range(min(20, len(df))):
        row_str = df.iloc[i].astype(str).str.lower().tolist()
        # Join row to search for keywords across cells
        full_row = " ".join(row_str)
        if "model" in full_row or "sku" in full_row or "наименование" in full_row:
            return i
    return None

def get_sheet_mapping(sheet_name):
    """
    Returns column INDICES (0-based) for data extraction.
    """
    s_name = sheet_name.strip()
    
    # 1. Ноутбуки (Notebooks)
    # User: 15=Price(AMD), 16=Notes, 17=Stock -> Indices 14, 15, 16
    if s_name == "Ноутбуки":
        return {"model": 0, "brand": 1, "name": list(range(2, 13)), "price": 14, "notes": [15], "stock": 16}

    # 2. Моноблоки (AIO)
    # User: 17=Price, 18=Notes, 19=Stock -> Indices 16, 17, 18
    elif s_name == "Моноблоки и Копьютеры":
        return {"model": 0, "brand": 1, "name": list(range(2, 15)), "price": 16, "notes": [17], "stock": 18}

    # 3. Печатная техника (Printers)
    # User: 12=Price, 13=Stock, 14=Notes -> Indices 11, 12, 13
    elif s_name == "Печатная техника":
        return {"model": 0, "brand": None, "name": list(range(1, 10)), "price": 11, "notes": [13], "stock": 12}

    # 4. Мониторы (Monitors)
    # User: 21=Price, 22=Notes, 23=Stock -> Indices 20, 21, 22
    elif s_name == "Мониторы":
        return {"model": 0, "brand": None, "name": [1, 2, 3, 4, 5, 6, 7, 13, 14, 17, 18], "price": 20, "notes": [21], "stock": 22}

    # 5. Планшеты (Tablets)
    # User: 11=Price, 12=Notes, 13=Stock -> Indices 10, 11, 12
    elif s_name == "Планшеты":
        return {"model": 0, "brand": 1, "name": list(range(2, 9)), "price": 10, "notes": [11], "stock": 12}

    # 6. Интерактивные дисплеи
    # User: 6=Price, 7=Notes, 4=Stock -> Indices 5, 6, 3
    # Model is Col 2 (Index 1)
    elif s_name == "Интерактивные дисплеи":
        return {"model": 1, "brand": None, "name": [0, 2], "price": 5, "notes": [6], "stock": 3}

    # 7. UPS
    # User: 13=Price, 14=Stock, 15+16=Notes -> Indices 12, 13, [14,15]
    elif "UPS" in s_name:
        return {"model": 0, "brand": None, "name": [1, 2, 3, 6, 7, 8], "price": 12, "notes": [14, 15], "stock": 13}

    # 8. Xiaomi_ECO
    # User: 6=Price, 7=Notes, 8=Stock -> Indices 5, 6, 7
    # Model Col 3 (Index 2), Brand Col 1 (Index 0)
    elif s_name == "Xiaomi_ECO":
        return {"model": 2, "brand": 0, "name": [1, 3], "price": 5, "notes": [6], "stock": 7}

    # 9. Смартфоны (Smartphones)
    # User: 9=Price, 10=Notes, 11=Stock -> Indices 8, 9, 10
    elif s_name == "Смартфоны":
        return {"model": 0, "brand": 1, "name": list(range(2, 7)), "price": 8, "notes": [9], "stock": 10}

    # 10. OEM
    # User: 4=Price, 5=Stock -> Indices 3, 4
    elif s_name == "OEM":
        return {"model": 0, "brand": None, "name": [1], "price": 3, "notes": None, "stock": 4}

    return None

def standardize(input_path: str, output_path: str):
    all_products = []
    
    try:
        # Read ALL sheets, no header assumption
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=None)
    except Exception as e:
        print(f"Critical Error reading Excel: {e}")
        return

    ignored_sheets = ["Main", "Contacts", "Сервисные центры", "Полезные ссылки", "Solar Systems"]

    for sheet_name, df in xls_dict.items():
        if any(x in sheet_name for x in ignored_sheets):
            continue

        mapping = get_sheet_mapping(sheet_name)
        if not mapping:
            continue

        # 1. FIND HEADER
        header_idx = find_header_row(df)
        if header_idx is None:
            # Fallback: if no header found, assume row 0 or 1 depending on common layouts
            # But usually find_header_row works. If failed, skip sheet.
            continue
            
        # 2. SLICE DATA (Start after header)
        df_data = df.iloc[header_idx+1:]
        
        # 3. EXTRACT
        for _, row in df_data.iterrows():
            # Helper to get val safely by integer index
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
                # Keep digits only
                numeric_str = "".join(c for c in raw_price if c.isdigit())
                if numeric_str: 
                    clean_price = str(int(numeric_str))
            except: 
                clean_price = "0"

            # Skip invalid prices unless "Call"
            if clean_price == "0" and "call" not in raw_price.lower():
                pass # You can continue or keep it. Let's keep consistent.

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
        # Create empty template to satisfy system requirements
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])
        print("Warning: No products found. Saving empty template.")

    # Force string type for JSON compatibility
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success. Converted {len(df_out)} items.")