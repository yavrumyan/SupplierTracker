# CompStyle conversion logic - process raw price list to standardized format
import pandas as pd

# The input DataFrame 'df' is available automatically
# Process it and assign the result to 'converted_df'

# CompStyle specific conversion logic
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

# Apply the conversion
converted_df = convert_cs(df)

# Set output filename
output_filename = 'compstyle_standardized.csv'