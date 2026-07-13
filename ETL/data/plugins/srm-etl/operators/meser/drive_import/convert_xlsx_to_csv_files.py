from pathlib import Path

import pandas as pd

CSV_ENCODING = 'utf-8-sig'


def build_csv_file_name(xlsx_file_name, sheet_name, sheet_count):
    file_stem = Path(xlsx_file_name).stem
    if sheet_count == 1:
        return f'{file_stem}.csv'
    return f'{file_stem}-{sheet_name}.csv'


def convert_xlsx_to_csv_files(xlsx_buffer, xlsx_file_name, output_directory):
    sheets = pd.read_excel(xlsx_buffer, sheet_name=None)
    output_directory.mkdir(parents=True, exist_ok=True)

    written_csv_paths = []
    for sheet_name, sheet_dataframe in sheets.items():
        csv_file_name = build_csv_file_name(xlsx_file_name, sheet_name, len(sheets))
        csv_path = output_directory / csv_file_name
        sheet_dataframe.to_csv(csv_path, index=False, encoding=CSV_ENCODING)
        written_csv_paths.append(csv_path)
    return written_csv_paths
