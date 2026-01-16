"""
conversion_logic_sptech.py
Standardizes SPTECH's price-lists.
Logic:
- Detects 'Blocks' of products under headers like 'Ultrabooks', 'Gaming'.
- Combines first 4 columns for Name.
- Combines columns 6,7,8 for Notes.
- Cleans Price (removes '$').
- Default Stock is now 1 (instead of 0).
"""

import pandas as pd

def standardize(input_path: str, output_path: str):
    try:
        # Load file. header=None to handle irregular grid.
        # engine='openpyxl' is required for .xlsx files.
        df = pd.read_csv(input_path, header=None) if input_path.endswith('.csv') else pd.read_excel(input_path, header=None, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    products = []
    
    # Default category if products appear before the first header
    current_category = "General"
    
    # Start scanning. 
    for i, row in df.iterrows():
        # Safety: Ensure row has enough columns
        if len(row) < 5:
            continue

        # Extract Raw Values
        raw_col0 = str(row[0]).strip() if pd.notna(row[0]) else ""
        raw_price = str(row[4]).strip() if pd.notna(row[4]) else ""
        
        # --- LOGIC: DETECT CATEGORY HEADER ---
        if "price" in raw_price.lower():
            if raw_col0:
                current_category = raw_col0
            continue # Skip this row, it's just a header

        # --- LOGIC: SKIP GARBAGE ROWS ---
        if not raw_price or raw_price == "":
            continue
            
        if ":" in raw_price or "@" in raw_price:
            continue

        # --- LOGIC: PARSE PRODUCT ---
        
        # 1. Construct Name: Join first 4 columns (0,1,2,3)
        name_parts = []
        for idx in [0, 1, 2, 3]:
            if idx < len(row) and pd.notna(row[idx]):
                val = str(row[idx]).strip()
                if val: name_parts.append(val)
        
        full_name = " ".join(name_parts)
        
        # If name is empty, skip
        if not full_name:
            continue

        # 2. Clean Price: Remove '$'
        clean_price = raw_price.replace("$", "").strip()
        if clean_price.endswith(".0"):
            clean_price = clean_price[:-2]

        # 3. Construct Notes: Join columns 5, 6, 7
        note_parts = []
        for idx in [5, 6, 7]:
            if idx < len(row) and pd.notna(row[idx]):
                val = str(row[idx]).strip()
                if val and val.lower() not in ["warr.", "sale", "keyb.", "l"]: 
                    note_parts.append(val)
        
        full_notes = ", ".join(note_parts)

        products.append({
            "Supplier": "SPTECH",
            "Category": current_category,
            "Brand": "", 
            "Model": "",
            "Name": full_name,
            "Price": clean_price,
            "Currency": "USD",
            "Stock": "1", # CHANGED: Default stock is now 1
            "MOQ": "NO",
            "Notes": full_notes
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for SPTECH.")
        return

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from SPTECH.")