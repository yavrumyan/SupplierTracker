
import pandas as pd

def convert_ittrading(df: pd.DataFrame) -> pd.DataFrame:
    # Detect columns only by index:
    # Column 0 -> Product Name
    # Column 1 -> Notes
    # Column 2 -> Price
    # Column 3 -> Warranty

    df_out = pd.DataFrame({
        "Supplier": ["IT-TRADING"] * len(df),
        "Category": ["" for _ in range(len(df))],
        "Brand": ["" for _ in range(len(df))],
        "Model": ["" for _ in range(len(df))],
        "Product Name": df.iloc[:, 0],
        "Price": df.iloc[:, 2],
        "Currency": ["USD"] * len(df),
        "Stock": ["" for _ in range(len(df))],
        "Warranty": df.iloc[:, 3],
        "Notes": df.iloc[:, 1],
    })
    return df_out

def standardize(input_path: str, output_path: str):
    df_raw = pd.read_excel(input_path, header=None)

    # Skip top rows and locate where data starts by finding 'Ապրանք' row
    header_row = next(
        (i for i, val in enumerate(df_raw.iloc[:, 0]) if isinstance(val, str) and "Ապրանք" in val),
        None
    )
    if header_row is None:
        raise ValueError("Could not detect the product table header (missing 'Ապրանք').")

    # Read data strictly starting after that row
    df = pd.read_excel(input_path, skiprows=header_row + 1)
    df = df.dropna(how="all").reset_index(drop=True)

    # Convert based on column index
    df_conv = convert_ittrading(df)

    # Ensure proper column order
    column_order = [
        "Supplier", "Category", "Brand", "Model",
        "Product Name", "Price", "Currency",
        "Stock", "Warranty", "Notes"
    ]
    df_conv = df_conv[column_order]
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")
