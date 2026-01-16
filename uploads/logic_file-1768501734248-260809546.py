"""
conversion_logic_inotech.py
Standardizes INOTECH's price-lists.
Updated Logic:
- Category = Row where 2nd AND 3rd columns are BOTH empty.
- Handles text prices (e.g. "SOON") as Price 0.
- Default Stock is now 1 (instead of 0).
"""

import pandas as pd

def standardize(input_path: str, output_path: str):
    try:
        if input_path.endswith('.csv'):
            df = pd.read_csv(input_path, header=None)
        else:
            df = pd.read_excel(input_path, header=None, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    products = []
    current_category = "General"

    # Iterate through all rows
    for i, row in df.iterrows():
        # Safety: Ensure row has enough columns
        if len(row) < 2:
            continue

        raw_name = str(row[0]).strip() if pd.notna(row[0]) else ""
        
        # Get Price (Col 1) and Next Col (Col 2)
        raw_price_val = row[1] if len(row) > 1 else None
        raw_col2_val = row[2] if len(row) > 2 else None

        # 1. SKIP EMPTY NAMES
        if not raw_name:
            continue

        # 2. SKIP CONTACT INFO
        name_lower = raw_name.lower()
        if any(x in name_lower for x in ["tel:", "mob:", "email:", "web:", "ino-technology", "yerevan"]):
            continue

        # 3. ANALYZE COLUMNS FOR CATEGORY DETECTION
        is_price_empty = pd.isna(raw_price_val) or str(raw_price_val).strip() == ""
        is_col2_empty = pd.isna(raw_col2_val) or str(raw_col2_val).strip() == ""

        # LOGIC: It is a Category if BOTH are empty
        if (is_price_empty and is_col2_empty) or ("Price AMD" in str(raw_price_val)):
            current_category = raw_name
            continue

        # --- PRODUCT PROCESSING ---
        clean_price = "0"
        note_suffix = ""

        try:
            # If it's a number, use it
            clean_price = str(int(float(raw_price_val)))
        except:
            # If it's text (e.g. "SOON"), set price to 0 and add to Notes
            clean_price = "0"
            if pd.notna(raw_price_val):
                note_suffix = f" {str(raw_price_val)}"

        products.append({
            "Supplier": "INOTECH",
            "Category": current_category,
            "Brand": "", 
            "Model": "",
            "Name": raw_name,
            "Price": clean_price,
            "Currency": "AMD",
            "Stock": "1", # CHANGED: Default stock is now 1
            "MOQ": "NO",
            "Notes": note_suffix.strip()
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for INOTECH.")
        return

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from INOTECH.")