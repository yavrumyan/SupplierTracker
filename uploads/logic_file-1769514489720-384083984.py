"""
conversion_logic_kosatec.py
Standardizes KOSATEC's price-lists.
Logic:
- AUTO-DETECTS Separator (semicolon vs comma).
- Fetches real-time EUR->USD rate from Frankfurter API.
- Converts Price (EUR) to USD.
- Rounds Price to 2 decimal places.
- Fixes line breaks.
- Maps columns: mfrnr->Model, artname->Name, cost->Price, quantity->Stock, eta->Notes.
- Uses Python engine for robust parsing.
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
    print("Starting KOSATEC conversion (Robust Version)...")
    
    # 1. Fetch Exchange Rate
    exchange_rate = get_eur_to_usd_rate()
    
    # 2. Detect Separator
    detected_sep = ';' # Default
    try:
        with open(input_path, 'r', encoding='utf-8', errors='replace') as f:
            header = f.readline()
            if header.count(';') > header.count(','):
                detected_sep = ';'
            else:
                detected_sep = ','
        print(f"Detected separator: '{detected_sep}'")
    except Exception as e:
        print(f"Warning: Could not detect separator ({e}), defaulting to ';'")

    try:
        # 3. Read CSV
        # We use engine='python' which is slower but handles quoted fields and bad lines 
        # much better than the default C engine.
        try:
            df = pd.read_csv(input_path, sep=detected_sep, encoding='utf-8', on_bad_lines='skip', engine='python')
        except:
            # Fallback to latin-1 if utf-8 fails
            print("UTF-8 read failed, trying latin-1...")
            df = pd.read_csv(input_path, sep=detected_sep, encoding='latin-1', on_bad_lines='skip', engine='python')
            
    except Exception as e:
        print(f"CRITICAL ERROR reading CSV file: {e}")
        return

    products = []
    
    # 4. Process Rows
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
        raw_brand = row.get('manufacturer', '')
        final_brand = clean_text(raw_brand)

        # -- Price (EUR -> USD) --
        raw_cost = str(row.get('cost', '0'))
        clean_price = "0"
        
        try:
            # Handle European format: "1.234,56" or "123,45"
            # 1. Replace dots (thousands sep) with nothing IF they exist alongside commas
            # 2. Replace comma with dot
            
            clean_str = raw_cost.strip()
            if ',' in clean_str and '.' in clean_str:
                clean_str = clean_str.replace('.', '') # remove thousands separator
            
            clean_str = clean_str.replace(',', '.')
            
            # Remove any other non-numeric chars except dot
            clean_str = "".join(c for c in clean_str if c.isdigit() or c == '.')
            
            if clean_str:
                val_eur = float(clean_str)
                val_usd = val_eur * exchange_rate
                
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
            clean_stock = str(int(float(raw_stock)))
        except:
            clean_stock = "0"

        # -- Notes --
        raw_eta = row.get('eta', '')
        final_notes = clean_text(raw_eta)
        if final_notes == "nan": final_notes = ""

        products.append({
            "Supplier": "KOSATEC",
            "Category": "General", 
            "Brand": final_brand,
            "Model": final_model,
            "Name": final_name,
            "Price": clean_price,
            "Currency": "USD", 
            "Stock": clean_stock,
            "MOQ": "NO",
            "Notes": final_notes
        })

    # 5. Output
    df_out = pd.DataFrame(products)
    
    if df_out.empty:
        print("Warning: No products found for KOSATEC.")
        df_out = pd.DataFrame(columns=["Supplier","Category","Brand","Model","Name","Price","Currency","Stock","MOQ","Notes"])

    # JSON Safety
    for col in df_out.columns:
        df_out[col] = df_out[col].astype(str)

    df_out.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"Success! Converted {len(df_out)} items from KOSATEC using Rate {exchange_rate}.")