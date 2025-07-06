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
            # Read Excel file
            df = pd.read_excel(file_path, engine='openpyxl' if ext == '.xlsx' else None)
        elif ext == '.csv':
            # Read CSV file with common delimiters
            try:
                df = pd.read_csv(file_path)
            except:
                # Try with semicolon delimiter
                df = pd.read_csv(file_path, delimiter=';')
        else:
            raise Exception(f"Unsupported file format: {ext}")
        
        if df.empty:
            raise Exception("File is empty or contains no data")
            
        return df
        
    except Exception as e:
        raise Exception(f"Error reading file: {str(e)}")

def apply_conversion_logic(df: pd.DataFrame, logic_content: str) -> Tuple[pd.DataFrame, str]:
    """
    Apply conversion logic to the DataFrame.
    
    Args:
        df: Input DataFrame
        logic_content: Python code string containing conversion logic
        
    Returns:
        Tuple of (converted_df, output_filename)
        
    Raises:
        Exception: If conversion logic fails
    """
    try:
        # Create a safe execution environment
        safe_globals = {
            'pd': pd,
            'df': df.copy(),
            'output_filename': 'converted_price_list.csv'
        }
        
        # Execute the conversion logic
        exec(logic_content, safe_globals)
        
        # Get the processed DataFrame
        if 'converted_df' in safe_globals:
            converted_df = safe_globals['converted_df']
        elif 'convert_cs' in safe_globals:
            # Handle legacy format with convert_cs function
            convert_func = safe_globals['convert_cs']
            converted_df = convert_func(df.copy())
        else:
            # If no converted_df is defined, assume df was modified in place
            converted_df = safe_globals['df']
        
        # Get the output filename
        output_filename = safe_globals.get('output_filename', 'converted_price_list.csv')
        
        # Validate the result
        if not isinstance(converted_df, pd.DataFrame):
            raise Exception("Conversion logic must produce a DataFrame")
            
        if converted_df.empty:
            raise Exception("Conversion resulted in empty DataFrame")
            
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
        
        # Apply conversion logic
        converted_df, output_filename = apply_conversion_logic(df, logic_content)
        
        # Generate preview HTML
        preview_html = converted_df.head(10).to_html(classes='table table-striped', table_id='price-list-preview')
        
        # Create CSV content
        csv_content = converted_df.to_csv(index=False)
        
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