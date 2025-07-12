import pandas as pd

def convert_ittrading(df: pd.DataFrame) -> pd.DataFrame:
    df_out = pd.DataFrame({
        "Supplier": ["IT-TRADING"] * len(df),
        "Category": "",
        "Brand": "",
        "Model": "",
        "Product Name": df.iloc[:, 0],
        "Price": df.iloc[:, 2],
        "Currency": ["USD"] * len(df),
        "Stock": "",
        "Warranty": df.iloc[:, 3],
        "Notes": df.iloc[:, 1],
    })
    return df_out

def standardize(input_path: str, output_path: str):
    df_raw = pd.read_excel(input_path, header=None)

    # Locate header row (where column 0 contains 'Ապրանք')
    header_row = next(
        (i for i, val in enumerate(df_raw.iloc[:, 0]) if isinstance(val, str) and "Ապրանք" in val),
        None
    )
    if header_row is None:
        raise ValueError("Header row with 'Ապրանք' not found")

    # Read actual data below header row
    df = pd.read_excel(input_path, skiprows=header_row + 1)
    df = df.dropna(how="all").reset_index(drop=True)

    df_conv = convert_ittrading(df)
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")