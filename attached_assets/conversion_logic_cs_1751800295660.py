"""
conversion_logic_cs.py

This script standardizes CompStyle's price-lists (CS.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Product Name,Price,Currency,Stock,Warranty,Notes
"""

import pandas as pd

def convert_cs(df: pd.DataFrame) -> pd.DataFrame:
    # Rename and select required columns
    df_out = pd.DataFrame({
        "Supplier": "CS",
        "Category": df["Категория"],
        "Brand": df["Бренд"],
        "Model": df["PN"],
        "Product Name": df["Марка"],
        "Price": df["Диллерская цена1"],
        "Currency": "AMD",
        "Stock": df["Stock"],
        "Warranty": "",
        "Notes": df["КодТовара"],
    })
    return df_out

def standardize(input_path: str, output_path: str):
    # Read original file (Excel or CSV)
    if input_path.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path, encoding="utf-8")

    df_conv = convert_cs(df)

    # Export to standardized UTF-8 CSV
    df_conv.to_csv(output_path, index=False, encoding="utf-8")
