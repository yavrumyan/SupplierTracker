"""
conversion_logic_it_trading.py
Standardizes IT-TRADING's price-lists.
Logic:
- Starts scanning from Row 9.
- Keeps text prices ("Call", "Soon").
- Detects Categories dynamically (rows with Name but no Price).
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
    
    # "Products start from row 9" -> This is index 8 in 0-based counting.
    # We can start looking a bit earlier (index 7) just to catch the first Category title if it exists.
    start_index = 7 
    current_category = "General"

    # Iterate through rows starting from the data area
    for i in range(start_index, len(df_raw)):
        row = df_raw.iloc[i]
        
        # Column mapping based on your description:
        # Col 0: Name
        # Col 1: Ignore
        # Col 2: Price
        # Col 3: Warranty (Ignore)
        # Col 4: Notes (Optional)
        
        raw_name = row[0]
        raw_price = row[2]
        raw_notes = row[4] if len(row) > 4 else ""

        # Skip empty lines
        if pd.isna(raw_name) or str(raw_name).strip() == "":
            continue

        # LOGIC: Distinguish between a Category Header and a Product
        # If Name exists, but Price is NaN (empty), it's likely a Category Header (e.g. "Monitors")
        if pd.isna(raw_price) or str(raw_price).strip() == "":
            current_category = str(raw_name).strip()
            continue

        # If we are here, it's a Product
        
        # Clean Price: Keep it as a string to support "Call", "Soon"
        price_val = str(raw_price).strip()
        # If it happens to be a float like 105.0, make it "105"
        if price_val.endswith(".0"):
            price_val = price_val[:-2]

        products.append({
            "Supplier": "IT-TRADING",
            "Category": current_category,
            "Brand": "", # Brand extraction could be added here later
            "Model": "",
            "Name": str(raw_name).strip(),
            "Price": price_val,
            "Currency": "USD", # Assumed USD based on values like "105"
            "Stock": "0",      # No stock column provided, defaulting to 0
            "MOQ": "NO",
            "Notes": str(raw_notes).strip() if pd.notna(raw_notes) else ""
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found. Check start_index.")
        return

    # === JSON SAFETY FIX ===
    # Ensure all columns are strings to prevent backend errors
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save to CSV
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from IT-TRADING.")