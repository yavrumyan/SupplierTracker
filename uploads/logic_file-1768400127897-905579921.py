"""
conversion_logic_dg.py

This script standardizes DG's price-lists (DG.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Name,Price,Currency,Stock,MOQ,Notes
"""

import pandas as pd

def convert_dg_sheet(df: pd.DataFrame, category_name: str) -> pd.DataFrame:
    # 1. Select only the first 3 columns (ignore 4th column if it exists)
    #    Col 0 = Name, Col 1 = Stock, Col 2 = Price
    df = df.iloc[:, :3]

    # 2. Rename columns temporarily for easier handling
    df.columns = ["TempName", "TempStock", "TempPrice"]

    # 3. FILTERING: Drop rows where Price OR Stock is empty (NaN)
    #    This strictly follows your rule to ignore such rows.
    df = df.dropna(subset=["TempStock", "TempPrice"])

    # 4. Clean Data
    #    Convert Price to numeric (coerce errors to NaN, then drop those too)
    price_col = pd.to_numeric(df["TempPrice"], errors='coerce')
    
    #    Convert Stock to numeric
    stock_col = pd.to_numeric(df["TempStock"], errors='coerce')

    #    Double check: drop if conversion failed (became NaN)
    valid_rows = price_col.notna() & stock_col.notna()
    df = df[valid_rows]
    price_col = price_col[valid_rows]
    stock_col = stock_col[valid_rows]

    # 5. Build Final DataFrame
    df_out = pd.DataFrame({
        "Supplier": "DG",
        "Category": category_name,  # Sheet Name = Category
        "Brand": "",
        "Model": "",
        "Name": df["TempName"],
        "Price": price_col,
        "Currency": "USD",
        "Stock": stock_col.astype(int), # Convert stock to clean integer
        "MOQ": "NO",
        "Notes": ""
    })

    return df_out

def standardize(input_path: str, output_path: str):
    try:
        # header=1: Skips row 0, uses row 1 as headers
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=1)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    all_products = []

    for sheet_name, df in xls_dict.items():
        if df.empty:
            continue
            
        try:
            # Check if sheet has at least 3 columns
            if df.shape[1] >= 3:
                df_conv = convert_dg_sheet(df, sheet_name)
                if not df_conv.empty:
                    all_products.append(df_conv)
        except Exception as e:
            print(f"Skipping sheet {sheet_name}: {e}")

    if all_products:
        final_df = pd.concat(all_products, ignore_index=True)
        final_df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print("DG Conversion Successful.")
    else:
        print("DG Conversion Failed: No valid data found.")