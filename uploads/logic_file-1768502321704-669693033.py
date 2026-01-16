"""
conversion_logic_ittrading.py
Standardizes IT-TRADING's price-lists.
Logic:
- Starts scanning from Row 9.
- Keeps text prices ("Call", "Soon").
- Detects Categories dynamically (rows with Name but no Price).
- Default Stock is now 1 (instead of 0).
"""

import pandas as pd

def standardize(input_path: str, output_path: str):
    try:
        # Load the file. 
        # header=None because we need to scan manually to find categories
        # engine='openpyxl' is required for .xlsx files
        df_raw = pd.read_csv(input_path, header=None) if input_path.endswith('.csv') else pd.read_excel(input_path, header=None, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    products = []
    
    # "Products start from row 9" -> This is index 8.
    start_index = 7 
    current_category = "General"

    # Iterate through rows starting from the data area
    for i in range(start_index, len(df_raw)):
        row = df_raw.iloc[i]
        
        # Column mapping:
        # Col 0: Name
        # Col 2: Price
        # Col 4: Notes
        
        raw_name = row[0]
        raw_price = row[2]
        raw_notes = row[4] if len(row) > 4 else ""

        # Skip empty lines
        if pd.isna(raw_name) or str(raw_name).strip() == "":
            continue

        # LOGIC: Distinguish between a Category Header and a Product
        if pd.isna(raw_price) or str(raw_price).strip() == "":
            current_category = str(raw_name).strip()
            continue

        # Product Processing
        price_val = str(raw_price).strip()
        if price_val.endswith(".0"):
            price_val = price_val[:-2]

        products.append({
            "Supplier": "IT-TRADING",
            "Category": current_category,
            "Brand": "", 
            "Model": "",
            "Name": str(raw_name).strip(),
            "Price": price_val,
            "Currency": "USD", 
            "Stock": "1",      # CHANGED: Default stock is now 1
            "MOQ": "NO",
            "Notes": str(raw_notes).strip() if pd.notna(raw_notes) else ""
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found. Check start_index.")
        return

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save to CSV
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from IT-TRADING.")