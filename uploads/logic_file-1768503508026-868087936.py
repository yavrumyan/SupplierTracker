"""
conversion_logic_biline.py
Standardizes BI-LINE's price-lists.
Logic:
- Header is Row 2 (index 1).
- Col 0 -> Model
- Col 1 -> Name
- Col 2 -> Price (AMD)
- Col 5 -> Notes
- Stock defaults to 1.
"""

import pandas as pd

def standardize(input_path: str, output_path: str):
    try:
        # Load file. header=1 means Row 2 is the header.
        # engine='openpyxl' required for .xlsx
        if input_path.endswith('.csv'):
            df = pd.read_csv(input_path, header=1)
        else:
            df = pd.read_excel(input_path, header=1, engine='openpyxl')
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    products = []
    
    # Iterate through rows
    for i, row in df.iterrows():
        # Safety: Ensure row has enough columns (at least up to Col 5 for Notes)
        if len(row) < 3:
            continue

        # Extract Raw Values (using numeric indices to be safe)
        raw_model = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
        raw_name = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
        raw_price_val = row.iloc[2]
        raw_notes = str(row.iloc[5]).strip() if (len(row) > 5 and pd.notna(row.iloc[5])) else ""

        # SKIP EMPTY ROWS
        # If both Model and Name are empty, skip
        if not raw_model and not raw_name:
            continue

        # SKIP HEADERS REPEATED IN DATA
        # Sometimes header rows get repeated. If Price is "Price", skip.
        if "price" in str(raw_price_val).lower() or "amd" in str(raw_price_val).lower():
            continue

        # CLEAN PRICE
        clean_price = "0"
        try:
            # Remove any non-numeric chars except digits (if needed) and convert
            # Usually strict conversion is safer:
            clean_price = str(int(float(raw_price_val)))
        except:
            # If price is text (e.g. "Call"), keep it as 0 or handle accordingly
            clean_price = "0"

        products.append({
            "Supplier": "BI-LINE",
            "Category": "General", # No category logic specified, defaulting to General
            "Brand": "", 
            "Model": raw_model,
            "Name": raw_name,
            "Price": clean_price,
            "Currency": "AMD",
            "Stock": "1", # Default stock is 1
            "MOQ": "NO",
            "Notes": raw_notes
        })

    # Create DataFrame
    df_out = pd.DataFrame(products)

    if df_out.empty:
        print("Warning: No products found for BI-LINE.")
        return

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    # Save
    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from BI-LINE.")