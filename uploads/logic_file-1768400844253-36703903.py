"""
conversion_logic_dg.py
Standardizes DG's price-lists (DG.xlsx).
Fixes: 'TypeError: Object of type datetime is not JSON serializable'
"""

import pandas as pd

def convert_dg_sheet(df: pd.DataFrame, category: str) -> pd.DataFrame:
    # SAFETY CHECK: Skip sheets with fewer than 3 columns
    if df.shape[1] < 3:
        return pd.DataFrame()

    # 1. Select and Rename Columns (Name, Stock, Price)
    df = df.iloc[:, :3]
    df.columns = ["TempName", "TempStock", "TempPrice"]

    # 2. Strict Filtering: Drop rows where Price OR Stock is empty
    df = df.dropna(subset=["TempStock", "TempPrice"])

    # 3. Clean Numeric Data (Price & Stock)
    price_col = pd.to_numeric(df["TempPrice"], errors='coerce')
    stock_col = pd.to_numeric(df["TempStock"], errors='coerce')

    # Drop rows that failed numeric conversion
    valid_mask = price_col.notna() & stock_col.notna()
    df = df[valid_mask]
    
    # 4. Build Output DataFrame
    # Note: We wrap category in str() just in case the sheet name is a date
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

    # === CRITICAL FIX FOR JSON ERROR ===
    # Convert all text-based columns to Strings.
    # This ensures no "datetime" objects remain to crash the app.
    text_columns = ["Supplier", "Category", "Brand", "Model", "Name", "Currency", "MOQ", "Notes"]
    for col in text_columns:
        df_out[col] = df_out[col].astype(str)

    return df_out

def standardize(input_path: str, output_path: str):
    try:
        # Use openpyxl engine
        xls_dict = pd.read_excel(input_path, sheet_name=None, header=1, engine='openpyxl')
    except ImportError:
        print("CRITICAL ERROR: 'openpyxl' is missing. Run 'pip install openpyxl'")
        return
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    all_products = []

    for sheet_name, df in xls_dict.items():
        if df.empty:
            continue
            
        try:
            df_conv = convert_dg_sheet(df, sheet_name)
            if not df_conv.empty:
                all_products.append(df_conv)
        except Exception as e:
            print(f"Warning: Could not process sheet '{sheet_name}'. Reason: {e}")

    if all_products:
        final_df = pd.concat(all_products, ignore_index=True)
        final_df.to_csv(output_path, index=False, encoding="utf-8-sig")
        print(f"Success! Converted {len(final_df)} items from DG.")
    else:
        print("DG Conversion Warning: No valid items found.")