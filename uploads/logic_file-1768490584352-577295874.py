"""
conversion_logic_inotech.py
Standardizes INOTECH's price-lists (CSV/Excel).
Logic:
- Column 0: Product Name (or Category Header).
- Column 1: Price (AMD).
- Rows where Price is numeric -> Product.
- Rows where Price is empty (or text like 'Price AMD') -> Category.
- Skips contact info rows automatically.
"""

import pandas as pd

def standardize(input_path: str, output_path: str):
    try:
        # Load file. header=None to scan raw rows.
        # engine='openpyxl' required if .xlsx
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
        # Safety: Ensure row has at least 2 columns
        if len(row) < 2:
            continue

        raw_name = str(row[0]).strip() if pd.notna(row[0]) else ""
        raw_price_val = row[1]
        
        # 1. SKIP EMPTY ROWS
        if not raw_name:
            continue

        # 2. DETECT CONTACT INFO / GARBAGE (Skip these rows)
        # If the name looks like address, phone, email, etc.
        name_lower = raw_name.lower()
        if any(x in name_lower for x in ["tel:", "mob:", "email:", "web:", "ino-technology", "yerevan"]):
            continue

        # 3. ANALYZE PRICE COLUMN
        # Try to convert price to a number
        price_numeric = pd.to_numeric(raw_price_val, errors='coerce')

        # --- CASE A: IT IS A CATEGORY HEADER ---
        # If price is NOT a number (NaN), it's likely a category
        if pd.isna(price_numeric):
            # Special check: If Col 1 contains "Price AMD", this row is definitely a header
            # Example: "Mainboard" | "Price AMD 20%..."
            # OR if Col 1 is just empty/NaN
            # We treat 'raw_name' as the new Category
            current_category = raw_name
            continue
        
        # --- CASE B: IT IS A PRODUCT ---
        # If we successfully got a number, it's a product
        
        products.append({
            "Supplier": "INOTECH",
            "Category": current_category,
            "Brand": "", 
            "Model": "",
            "Name": raw_name,
            "Price": int(price_numeric), # Convert float 28500.0 -> 28500
            "Currency": "AMD",
            "Stock": "0", # No stock info in this file
            "MOQ": "NO",
            "Notes": ""
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for INOTECH.")
        return

    # JSON Safety: Convert all columns to strings
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from INOTECH.")