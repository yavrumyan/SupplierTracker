"""
conversion_logic_kosatec.py
Standardizes KOSATEC's price-lists.
Logic:
- CSV with Semicolon delimiter.
- Fetches real-time EUR->USD rate from Frankfurter API.
- Converts Price (EUR) to USD.
- Rounds Price to 2 decimal places.
- Fixes line breaks.
- Maps columns: mfrnr->Model, artname->Name, cost->Price, quantity->Stock, eta->Notes.
- ROBUST CSV READING (Handles bad lines/delimiters).
"""

import pandas as pd
import requests
import warnings
import time
import io

# Suppress warnings
warnings.filterwarnings("ignore")

def get_eur_to_usd_rate():
    """
    Fetches the current EUR to USD exchange rate from Frankfurter API.
    Returns a float (e.g., 1.08).
    Returns a default fallback if API fails.
    """
    api_url = "https://api.frankfurter.dev/v1/latest?from=EUR&to=USD"
    fallback_rate = 1.18 # Approximate rate for 2026 fallback
    
    try:
        response = requests.get(api_url, timeout=5)
        response.raise_for_status()
        data = response.json()
        rate = data['rates']['USD']
        print(f"Fetched Exchange Rate (EUR->USD): {rate}")
        return float(rate)
    except Exception as e:
        print(f"Warning: Could not fetch exchange rate ({e}). Using fallback: {fallback_rate}")
        return fallback_rate

def clean_text(text):
    if not text or pd.isna(text):
        return ""
    return " ".join(str(text).split())

def standardize(input_path: str, output_path: str):
    # 1. Fetch Exchange Rate
    exchange_rate = get_eur_to_usd_rate()
    
    try:
        # 2. Read CSV (Robust Mode)
        # Uses 'python' engine for better tolerance, ignores bad lines
        try:
            df = pd.read_csv(input_path, sep=';', encoding='utf-8', on_bad_lines='skip', engine='python')
        except:
            # Fallback: try latin-1 encoding if utf-8 fails
            df = pd.read_csv(input_path, sep=';', encoding='latin-1', on_bad_lines='skip', engine='python')
            
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return

    products = []
    
    # 3. Process Rows
    for _, row in df.iterrows():
        # -- Name --
        raw_name = row.get('artname', '')
        final_name = clean_text(raw_name)
        if not final_name:
            continue

        # -- Model --
        raw_model = row.get('mfrnr', '')
        final_model = clean_text(raw_model)

        # -- Brand --
        # Optional: Extract from manufacturer column if exists
        raw_brand = row.get('manufacturer', '')
        final_brand = clean_text(raw_brand)

        # -- Price (EUR -> USD) --
        # Input format example: "111,16" (European decimal comma)
        raw_cost = str(row.get('cost', '0'))
        clean_price = "0"
        
        try:
            # Replace comma with dot
            cost_str = raw_cost.replace(',', '.').strip()
            # Remove any other non-numeric chars except dot
            cost_str = "".join(c for c in cost_str if c.isdigit() or c == '.')
            
            if cost_str:
                val_eur = float(cost_str)
                val_usd = val_eur * exchange_rate
                
                # Round to 2 decimals
                val_usd = round(val_usd, 2)
                
                if val_usd.is_integer():
                    clean_price = str(int(val_usd))
                else:
                    clean_price = str(val_usd)
        except:
            clean_price = "0"

        # -- Stock --
        raw_stock = str(row.get('quantity', '0'))
        clean_stock = "0"
        try:
            # Simple integer conversion
            clean_stock = str(int(float(raw_stock)))
        except:
            clean_stock = "0"

        # -- Notes --
        raw_eta = row.get('eta', '')
        final_notes = clean_text(raw_eta)
        if final_notes == "nan": final_notes = ""

        products.append({
            "Supplier": "KOSATEC",
            "Category": "General", # Could use 'cat1' column if more detail needed
            "Brand": final_brand,
            "Model": final_model,
            "Name": final_name,
            "Price": clean_price,
            "Currency": "USD", # Converted
            "Stock": clean_stock,
            "MOQ": "NO",
            "Notes": final_notes
        })

    # 4. Output
    df_out = pd.DataFrame(products)
    
    if df_out.empty:
        print("Warning: No products found for KOSATEC.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from KOSATEC using Rate {exchange_rate}.")