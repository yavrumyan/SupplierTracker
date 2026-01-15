"""
conversion_logic_dg.py
Silent Version: No print statements to prevent server JSON errors.
"""

import pandas as pd

def convert_dg_sheet(df: pd.DataFrame, category: str) -> pd.DataFrame:
    if df.shape[1] < 3:
        return pd.DataFrame()

    df = df.iloc[:, :3]
    df.columns = ["TempName", "TempStock", "TempPrice"]

    df = df.dropna(subset=["TempStock", "TempPrice"])

    price_col = pd.to_numeric(df["TempPrice"], errors='coerce')
    stock_col = pd.to_numeric(df["TempStock"], errors='coerce')

    valid_mask = price_col.notna() & stock_col.notna()
    df = df[valid_mask]
    
    df_out = pd.DataFrame({
        "Supplier": "DG",
        "Category": str(category),
        "Brand": "",
        "Model": "",
        "Name": df["TempName"],
        "Price": price_col[valid_mask],
        "Currency": "USD",
        "Stock": stock_col[valid_mask].astype(int),
        "MOQ": "NO",
        "Notes": "",
    })

    # Force all text columns to string to avoid datetime errors
    text_columns = ["Supplier", "Category", "Brand", "Model", "Name", "Currency", "MOQ", "Notes"]
    for col in text_columns:
        df_out[col] = df_out[col].astype(str)

    return df_out

def standardize(input_path: str, output_path: str):
    try:
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=1, engine='openpyxl')
    except:
        return

    all_products = []

    for sheet_name, df in xls_dict.items():
        if df.empty:
            continue
        try:
            df_conv = convert_dg_sheet(df, sheet_name)
            if not df_conv.empty:
                all_products.append(df_conv)
        except:
            continue

    if all_products:
        final_df = pd.concat(all_products, ignore_index=True)
        final_df.to_csv(output_path, index=False, encoding="utf-8-sig")