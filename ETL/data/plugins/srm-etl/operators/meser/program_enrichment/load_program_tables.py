import pandas as pd

from operators.meser.drive_import.create_drive_service import create_drive_service
from operators.meser.drive_import.download_drive_file import download_drive_file_as_bytes
from operators.meser.drive_import.find_drive_file_by_name import find_drive_file_by_name
from operators.meser.drive_import.values import GOOGLE_DRIVE_IDS_FILE_NAME, GOOGLE_DRIVE_TEXTS_FILE_NAME
from operators.meser.program_enrichment.clean_whitespace import clean_dataframe_whitespace


def download_xlsx_as_dataframe(drive_service, file_name):
    drive_file = find_drive_file_by_name(drive_service, file_name)
    if drive_file is None:
        raise RuntimeError(f"Drive file '{file_name}' was not found - meser enrichment cannot proceed. "
                           'Make sure the folder is shared with the service account email.')
    xlsx_buffer = download_drive_file_as_bytes(drive_service, drive_file)
    return clean_dataframe_whitespace(pd.read_excel(xlsx_buffer, sheet_name=0))


def load_program_tables():
    drive_service = create_drive_service()
    program_texts_df = download_xlsx_as_dataframe(drive_service, GOOGLE_DRIVE_TEXTS_FILE_NAME)
    program_ids_df = download_xlsx_as_dataframe(drive_service, GOOGLE_DRIVE_IDS_FILE_NAME)
    return program_texts_df, program_ids_df
