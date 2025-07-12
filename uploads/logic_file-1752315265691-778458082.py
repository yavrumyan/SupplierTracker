"""
conversion_logic_ittrading.py

This script standardizes IT-TRADING's price-lists (IT-TRADING.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Product Name,Price,Currency,Stock,Warranty,Notes
"""

import pandas as pd

def convert_it_trading(df: pd.DataFrame) -> pd.DataFrame:
    # Rename and select required columns by index
    df_out = pd.DataFrame({
        "Supplier": "IT-TRADING",
        "Category": "",
        "Brand": "",
        "Model": "",
        "Product Name": df.iloc[:, 0],
        "Price": df.iloc[:, 2],
        "Currency": "USD",
        "Stock": "",
        "Warranty": df.iloc[:, 3],
        "Notes": df.iloc[:, 1],
    })
    return df_out

def standardize(input_path: str, output_path: str):
    # Read original file (Excel or CSV)
    if input_path.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path, encoding="utf-8")

    df_conv = convert_it_trading(df)

    # Export to standardized UTF-8 CSV
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")