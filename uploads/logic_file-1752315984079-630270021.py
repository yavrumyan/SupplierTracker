
import pandas as pd

def convert_it_trading(df: pd.DataFrame) -> pd.DataFrame:
    records = []
    current_category = ""

    for _, row in df.iterrows():
        name     = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ""
        price    = row.iloc[2] if pd.notna(row.iloc[2]) else None
        warranty = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ""
        notes    = ""

        if name and price is None:
            current_category = name
        elif name and price is not None:
            records.append({
                "Supplier":     "IT-TRADING",
                "Category":     current_category,
                "Brand":        "",
                "Model":        "",
                "Product Name": name,
                "Price":        price,
                "Currency":     "USD",
                "Stock":        "",
                "Warranty":     warranty,
                "Notes":        notes
            })

    return pd.DataFrame(records)

def standardize(input_path: str, output_path: str):
    df = pd.read_excel(input_path, skiprows=5)
    df = df.dropna(how="all").reset_index(drop=True)
    df_conv = convert_it_trading(df)
    df_conv.to_csv(output_path, index=False, encoding="utf-8-sig")
