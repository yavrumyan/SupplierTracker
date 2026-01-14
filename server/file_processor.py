#!/usr/bin/env python3
"""
File processing module for price list conversion.
Handles Excel/CSV uploads and applies conversion logic.
"""
import pandas as pd
import os
import sys
import json
import tempfile
from typing import Dict, Any, Optional, Tuple
import traceback
from datetime import datetime, date


def convert_datetime_columns(df: pd.DataFrame) -> pd.DataFrame:
    """
    Convert all datetime columns to string to avoid JSON serialization issues.
    """
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]):
            df[col] = df[col].astype(str)
        elif df[col].dtype == 'object':
            # Check if column contains datetime objects
            try:
                sample = df[col].dropna().head(5)
                if len(sample) > 0 and isinstance(sample.iloc[0], (datetime, date)):
                    df[col] = df[col].astype(str)
            except:
                pass
    return df

def read_price_list_file(file_path: str) -> pd.DataFrame:
    """
    Read a price list file (Excel or CSV) and return a DataFrame.
    
    Args:
        file_path: Path to the uploaded file
        
    Returns:
        DataFrame containing the price list data
        
    Raises:
        Exception: If file cannot be read or is invalid format
    """
    try:
        # Get file extension
        _, ext = os.path.splitext(file_path.lower())
        
        if ext in ['.xlsx', '.xls']:
            # Read Excel file with proper encoding support
            try:
                df = pd.read_excel(file_path, engine='openpyxl' if ext == '.xlsx' else None)
            except Exception as e:
                raise Exception(f"Error reading Excel file: {str(e)}")
        elif ext == '.csv':
            # Read CSV file with UTF-8 encoding support
            encodings = ['utf-8', 'cp1251', 'latin-1', 'iso-8859-1']
            df = None
            for encoding in encodings:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except (UnicodeDecodeError, UnicodeError):
                    continue
            
            if df is None:
                # Try with different delimiter
                try:
                    df = pd.read_csv(file_path, delimiter=';', encoding='utf-8')
                except:
                    raise Exception("Could not read CSV file with any supported encoding")
        else:
            raise Exception(f"Unsupported file format: {ext}")
        
        if df.empty:
            raise Exception("File is empty or contains no data")
            
        return df
        
    except Exception as e:
        raise Exception(f"Error reading file: {str(e)}")

def apply_conversion_logic(df: pd.DataFrame, logic_content: str, file_path: str = None) -> Tuple[pd.DataFrame, str]:
    """
    Apply conversion logic to the DataFrame.
    
    Args:
        df: Input DataFrame
        logic_content: Python code string containing conversion logic
        file_path: Original file path (for standardize function pattern)
        
    Returns:
        Tuple of (converted_df, output_filename)
        
    Raises:
        Exception: If conversion logic fails
    """
    try:
        import re
        
        # Create a safe execution environment
        safe_globals = {
            'pd': pd,
            're': re,
            'df': df.copy(),
            'output_filename': 'converted_price_list.csv'
        }
        
        # Execute the conversion logic
        exec(logic_content, safe_globals)
        
        # Check for different function patterns and apply them
        converted_df = None
        
        # Pattern 1: standardize(input_path, output_path) function
        if 'standardize' in safe_globals and callable(safe_globals['standardize']) and file_path:
            # Create a temporary output file
            temp_output = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
            temp_output_path = temp_output.name
            temp_output.close()
            
            try:
                # Suppress print statements by redirecting stdout to stderr
                import io
                old_stdout = sys.stdout
                sys.stdout = io.StringIO()
                
                try:
                    # Call the standardize function
                    safe_globals['standardize'](file_path, temp_output_path)
                finally:
                    # Restore stdout
                    sys.stdout = old_stdout
                
                # Read the output CSV
                converted_df = pd.read_csv(temp_output_path, encoding='utf-8-sig')
            finally:
                # Clean up temp file
                if os.path.exists(temp_output_path):
                    os.unlink(temp_output_path)
        
        # Pattern 2: converted_df variable defined
        elif 'converted_df' in safe_globals:
            converted_df = safe_globals['converted_df']
        
        # Pattern 3: convert_cs function (legacy)
        elif 'convert_cs' in safe_globals and callable(safe_globals['convert_cs']):
            convert_func = safe_globals['convert_cs']
            converted_df = convert_func(df.copy())
        
        # Pattern 4: convert_dg function for DG supplier
        elif 'convert_dg' in safe_globals and callable(safe_globals['convert_dg']):
            convert_func = safe_globals['convert_dg']
            converted_df = convert_func(df.copy(), 'General')
        
        # Pattern 5: df was modified in place
        else:
            converted_df = safe_globals['df']
        
        # Get the output filename
        output_filename = safe_globals.get('output_filename', 'converted_price_list.csv')
        
        # Validate the result
        if not isinstance(converted_df, pd.DataFrame):
            raise Exception("Conversion logic must produce a DataFrame")
            
        if converted_df.empty:
            raise Exception("Conversion resulted in empty DataFrame")
        
        # Convert datetime columns to strings to avoid JSON serialization issues
        converted_df = convert_datetime_columns(converted_df)
            
        return converted_df, output_filename
        
    except Exception as e:
        raise Exception(f"Error applying conversion logic: {str(e)}")

def process_price_list(file_path: str, logic_content: str) -> Dict[str, Any]:
    """
    Process a price list file with conversion logic.
    
    Args:
        file_path: Path to the uploaded price list file
        logic_content: Python code string containing conversion logic
        
    Returns:
        Dictionary containing processing results
    """
    try:
        # Read the price list file
        df = read_price_list_file(file_path)
        
        # Apply conversion logic (pass file_path for standardize function pattern)
        converted_df, output_filename = apply_conversion_logic(df, logic_content, file_path)
        
        # Generate preview HTML
        preview_html = converted_df.head(10).to_html(classes='table table-striped', table_id='price-list-preview')
        
        # Create CSV content ensuring proper UTF-8 handling
        csv_content = converted_df.to_csv(index=False)
        
        # Ensure the content is properly encoded as UTF-8 string
        if isinstance(csv_content, bytes):
            csv_content = csv_content.decode('utf-8')
        
        # Ensure all text is properly normalized for UTF-8
        csv_content = csv_content.encode('utf-8', errors='ignore').decode('utf-8')
        
        return {
            'success': True,
            'preview_html': preview_html,
            'csv_content': csv_content,
            'output_filename': output_filename,
            'row_count': len(converted_df),
            'column_count': len(converted_df.columns),
            'columns': list(converted_df.columns)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }

def validate_conversion_logic(logic_content: str) -> Dict[str, Any]:
    """
    Validate conversion logic syntax and basic structure.
    
    Args:
        logic_content: Python code string to validate
        
    Returns:
        Dictionary with validation results
    """
    try:
        # Test compilation
        compile(logic_content, '<string>', 'exec')
        
        # Check for required elements
        has_conversion = 'converted_df' in logic_content or 'df' in logic_content
        has_filename = 'output_filename' in logic_content
        
        return {
            'valid': True,
            'has_conversion': has_conversion,
            'has_filename': has_filename,
            'warnings': []
        }
        
    except SyntaxError as e:
        return {
            'valid': False,
            'error': f"Syntax error: {str(e)}",
            'line': e.lineno
        }
    except Exception as e:
        return {
            'valid': False,
            'error': str(e)
        }

if __name__ == "__main__":
    # Command line interface for testing
    if len(sys.argv) < 3:
        print("Usage: python file_processor.py <price_list_file> <logic_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    logic_file = sys.argv[2]
    
    try:
        with open(logic_file, 'r') as f:
            logic_content = f.read()
        
        result = process_price_list(file_path, logic_content)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}, indent=2))