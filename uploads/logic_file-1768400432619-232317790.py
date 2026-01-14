"""
conversion_logic_dg.py

This script standardizes DG's price-lists (DG.xlsx) into the
following schema:
Supplier,Category,Brand,Model,Name,Price,Currency,Stock,MOQ,Notes
"""

import pandas as pd

def convert_dg_sheet(df: pd.DataFrame, category: str) -> pd.DataFrame:
    # 1. Select and Rename Columns
    # DG Structure: Col 0 = Name, Col 1 = Stock, Col 2 = Price (USD)
    # We take only the first 3 columns, ignoring any 4th column
    df = df.iloc[:, :3]
    df.columns = ["TempName", "TempStock", "TempPrice"]

    # 2. Strict Filtering
    # Drop rows where Price OR Stock is empty/NaN
    df = df.dropna(subset=["TempStock", "TempPrice"])

    # 3. Clean Data
    # Convert Price and Stock to numeric, coercing errors to NaN
    price_col = pd.to_numeric(df["TempPrice"], errors='coerce')
    stock_col = pd.to_numeric(df["TempStock"], errors='coerce')

    # Remove rows that failed numeric conversion
    valid_mask = price_col.notna() & stock_col.notna()
    df = df[valid_mask]
    
    # 4. Build Output DataFrame
    df_out = pd.DataFrame({
        "Supplier": "DG",
        "Category": category,    # Uses Sheet Name as Category
        "Brand": "",             # Mixed in Name column
        "Model": "",             # Mixed in Name column
        "Name": df["TempName"],
        "Price": price_col[valid_mask],
        "Currency": "USD",
        "Stock": stock_col[valid_mask].astype(int),
        "MOQ": "NO",
        "Notes": "",
    })
    
    return df_out

def standardize(input_path: str, output_path: str):
    # Read original file (Excel)
    # sheet_name=None reads ALL sheets
    # header=1 skips the first row and uses the second row as headers
    try:
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=1)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    all_products = []

    # Process each sheet
    for sheet_name, df in xls_dict.items():
        if df.empty:
            continue
            
        # Convert individual sheet using the logic above
        df_conv = convert_dg_sheet(df, sheet_name)
        
        if not df_conv.empty:
            all_products.append(df_conv)

    # Combine all sheets into one DataFrame
    if all_products:
        final_df = pd.concat(all_products, ignore_index=True)
        # Export to standardized UTF-8 CSV
        final_df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"Converted {len(final_df)} items.")
    else:
        print("No valid items found.")