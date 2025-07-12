"""
conversion_logic_ittrading.py

This script standardizes IT-TRADING's Excel price-lists into:
Supplier,Category,Brand,Model / PN,Product Name,Price,Currency,Stock,Warranty,Notes
"""

import pandas as pd

def convert_it_trading(df: pd.DataFrame) -> pd.DataFrame:
    records = []
    current_category = ""

    for _, row in df.iterrows():
        try:
            name     = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
            notes    = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ""
            price    = row.iloc[2] if pd.notna(row.iloc[2]) else None
            warranty = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ""

            if name and price is None:
                current_category = name
            elif name and price is not None:
                brand = name.split()[0]
                model = name[len(brand):].strip()
                records.append({
                    "Supplier":    "IT-TRADING",
                    "Category":    current_category,
                    "Brand":       brand,
                    "Model / PN":  model,
                    "Product Name": name,
                    "Price":       price,
                    "Currency":    "USD",
                    "Stock":       "",
                    "Warranty":    warranty,
                    "Notes":       notes,
                })
        except Exception:
            continue

    return pd.DataFrame(records)


def standardize(input_path: str, output_path: str):
    # Read original file (Excel or CSV)
    if input_path.lower().endswith((".xls", ".xlsx")):
        df = pd.read_excel(input_path, skiprows=6)
    else:
        df = pd.read_csv(input_path, encoding="utf-8")

    df_conv = convert_it_trading(df)
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")