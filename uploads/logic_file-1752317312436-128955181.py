"""
conversion_logic_it.py

This script standardizes IT-Trading's price-lists (IT.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Product Name,Price,Currency,Stock,Warranty,Notes
"""

import pandas as pd

def convert_cs(df: pd.DataFrame) -> pd.DataFrame:
    # Rename and select required columns
    df_out = pd.DataFrame({
        "Supplier": "IT",
        "Category": "",
        "Brand": "",
        "Model": "",
        "Product Name": Column_0,
        "Price": Column_2,
        "Currency": "USD",
        "Stock": "",
        "Warranty": Column_3,
        "Notes": Column_1,
    })
    return df_out

def standardize(input_path: str, output_path: str):
    # Read original file (Excel or CSV)
    if input_path.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path, encoding="utf-8")

    df_conv = convert_it(df)

    # Export to standardized UTF-8 CSV
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")
