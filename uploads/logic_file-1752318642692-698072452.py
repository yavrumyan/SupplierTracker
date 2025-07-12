
import pandas as pd

def convert_biline(df: pd.DataFrame) -> pd.DataFrame:
    df_out = pd.DataFrame({
        "Supplier": ["BI-LINE"] * len(df),
        "Category": ["" for _ in range(len(df))],
        "Brand": ["APC"] * len(df),
        "Model": df.iloc[:, 0],
        "Product Name": df.iloc[:, 1],
        "Price": df.iloc[:, 2],
        "Currency": ["AMD"] * len(df),
        "Stock": df.iloc[:, 5],
        "Warranty": ["" for _ in range(len(df))],
        "Notes": ["" for _ in range(len(df))]
    })
    return df_out

def standardize(input_path: str, output_path: str):
    # Read Excel file and skip the header row (row 0)
    df = pd.read_excel(input_path, skiprows=1)
    df = df.dropna(how="all").reset_index(drop=True)

    df_conv = convert_biline(df)

    column_order = [
        "Supplier", "Category", "Brand", "Model",
        "Product Name", "Price", "Currency",
        "Stock", "Warranty", "Notes"
    ]
    df_conv = df_conv[column_order]
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")
