"""
conversion_logic_dg.py

This script standardizes DG's price-lists (DG.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Name,Price,Currency,Stock,MOQ,Notes
"""

import pandas as pd

def convert_dg_sheet(df: pd.DataFrame, category_name: str) -> pd.DataFrame:
    # Ensure the dataframe has at least 3 columns (Name, Stock, Price)
    if df.shape[1] < 3:
        return pd.DataFrame()

    # Clean Price: Force numeric, turn errors (like "Call for price") into NaN
    price_col = pd.to_numeric(df.iloc[:, 2], errors='coerce')
    
    # Clean Stock: Force numeric, fill NaN with 0
    stock_col = pd.to_numeric(df.iloc[:, 1], errors='coerce').fillna(0).astype(int)

    df_out = pd.DataFrame({
        "Supplier": "DG",
        "Category": category_name,  # Using the Sheet Name as the Category
        "Brand": "",               # Mixed in Col 1, leaving blank for now
        "Model": "",               # Mixed in Col 1, leaving blank for now
        "Name": df.iloc[:, 0],     # Column 1: Product Name/Desc
        "Price": price_col,        # Column 3: Price
        "Currency": "USD",
        "Stock": stock_col,        # Column 2: Stock
        "MOQ": "NO",
        "Notes": ""
    })

    # Remove rows where Price is missing/invalid or Name is empty
    df_out = df_out.dropna(subset=["Price", "Name"])
    
    return df_out

def standardize(input_path: str, output_path: str):
    # Read Excel file
    # sheet_name=None reads ALL sheets into a dictionary {sheet_name: dataframe}
    # header=1 skips the first row (index 0) and uses the second row (index 1) as headers
    try:
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=1)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    all_products = []

    for sheet_name, df in xls_dict.items():
        # Skip empty sheets
        if df.empty:
            continue
            
        # Convert individual sheet
        df_conv = convert_dg_sheet(df, sheet_name)
        
        if not df_conv.empty:
            all_products.append(df_conv)

    # Combine all processed sheets into one DataFrame
    if all_products:
        final_df = pd.concat(all_products, ignore_index=True)
        final_df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"Successfully converted {len(final_df)} rows from DG.")
    else:
        print("No valid data found in DG.xlsx")