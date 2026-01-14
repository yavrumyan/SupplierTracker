"""
conversion_logic_dg.py

This script standardizes DG's price-lists (DG.XLSX) into the
following schema:
Supplier,Category,Brand,Model,Name,Price,Currency,Stock,MOQ,Notes

DG Price List Structure:
- Multiple sheets (one per category)
- First row: Date header (skip)
- Second row: Headers (Անվանում, Մնացորդ, USD)
- Column 1: Product name/description (contains everything about the product)
- Column 2: Stock quantity
- Column 3: Price in USD
"""

import pandas as pd
import re


def extract_brand_from_name(product_name: str) -> str:
    """
    Extract brand name from product description.
    Common brands: Lenovo, Dell, Asus, DeepCool, etc.
    """
    # Common brands to look for
    brands = [
        'Lenovo', 'Dell', 'Asus', 'ASUS', 'HP', 'Acer', 'MSI', 'Gigabyte',
        'DeepCool', 'Intel', 'AMD', 'Nvidia', 'Samsung', 'LG', 'BenQ',
        'ViewSonic', 'AOC', 'Philips', 'Canon', 'Epson', 'Brother',
        'APC', 'CyberPower', 'Eaton', 'Schneider', 'Logitech', 'Razer',
        'Corsair', 'Kingston', 'WD', 'Seagate', 'Transcend', 'SanDisk',
        'TP-Link', 'D-Link', 'Netgear', 'Cisco', 'Ubiquiti', 'MikroTik'
    ]
    
    product_upper = product_name.upper()
    for brand in brands:
        if brand.upper() in product_upper:
            return brand
    
    return "Unknown"


def extract_model_from_name(product_name: str) -> str:
    """
    Try to extract model number from product description.
    Models often contain numbers, dashes, slashes.
    """
    # Look for patterns like: V130, 7400, A620M-K, USB-N10, etc.
    # This is a simple extraction - can be improved based on actual patterns
    patterns = [
        r'\b([A-Z0-9]+-[A-Z0-9-]+)\b',  # e.g., USB-N10, A620M-K
        r'\b([A-Z]+\d+[A-Z]*)\b',        # e.g., V130, 7400
        r'\b(\d{4,}[A-Z]*)\b',            # e.g., 7400, 5400
    ]
    
    for pattern in patterns:
        match = re.search(pattern, product_name)
        if match:
            return match.group(1)
    
    return ""


def convert_dg(df: pd.DataFrame, category: str) -> pd.DataFrame:
    """
    Convert a single sheet from DG price list to standardized format.
    
    Args:
        df: DataFrame with columns [Անվանում, Մնացորդ, USD]
        category: The category name (from sheet name)
    
    Returns:
        DataFrame with standardized columns
    """
    # Clean column names (remove extra spaces)
    df.columns = df.columns.str.strip()
    
    # Ensure we have the expected columns
    # Handle both 'USD' and ' USD' variations
    price_col = 'USD' if 'USD' in df.columns else ' USD'
    
    # Extract brand and model from product name
    df['Brand_extracted'] = df['Անվանում'].apply(extract_brand_from_name)
    df['Model_extracted'] = df['Անվանում'].apply(extract_model_from_name)
    
    # Create standardized output
    df_out = pd.DataFrame({
        "Supplier": "DG",
        "Category": category,
        "Brand": df['Brand_extracted'],
        "Model": df['Model_extracted'],
        "Name": df['Անվանում'],
        "Price": df[price_col],
        "Currency": "USD",
        "Stock": df['Մնացորդ'],
        "MOQ": "NO",
        "Notes": "",
    })
    
    return df_out


def standardize(input_path: str, output_path: str):
    """
    Read DG Excel file with multiple sheets and convert all to standardized CSV.
    
    Args:
        input_path: Path to DG.xlsx file
        output_path: Path to output standardized CSV file
    """
    # Read all sheets from Excel file
    xls = pd.ExcelFile(input_path)
    
    all_data = []
    
    for sheet_name in xls.sheet_names:
        # Read sheet with header on row 2 (index 1)
        df = pd.read_excel(input_path, sheet_name=sheet_name, header=1)
        
        # Skip empty sheets
        if df.empty or len(df) == 0:
            continue
        
        # Remove any completely empty rows
        df = df.dropna(how='all')
        
        # Use sheet name as category (clean it up a bit)
        category = sheet_name.replace('Diller Price', '').strip()
        
        # Convert this sheet
        df_converted = convert_dg(df, category)
        all_data.append(df_converted)
    
    # Combine all sheets into one DataFrame
    df_final = pd.concat(all_data, ignore_index=True)
    
    # Export to standardized UTF-8 CSV
    df_final.to_csv(output_path, index=False, encoding="utf-8-sig")
    
    print(f"Converted {len(xls.sheet_names)} sheets with {len(df_final)} total products")
    print(f"Output saved to: {output_path}")


# Example usage (for testing)
if __name__ == "__main__":
    standardize("DG.xlsx", "DG_standardized.csv")