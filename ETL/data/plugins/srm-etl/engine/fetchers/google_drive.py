import base64
import io
import json
import re

import pandas as pd
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from conf import settings

GOOGLE_DRIVE_READONLY_SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
GOOGLE_SHEETS_MIME_TYPE = 'application/vnd.google-apps.spreadsheet'
XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
FILE_SEARCH_QUERY = "'{folder_id}' in parents and name = '{file_name}' and trashed = false"


def create_drive_service():
    encoded_key = settings.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
    if not encoded_key:
        raise ValueError('ETL_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is not set.')
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(base64.b64decode(encoded_key).decode('utf-8')),
        scopes=GOOGLE_DRIVE_READONLY_SCOPES)
    return build('drive', 'v3', credentials=credentials, cache_discovery=False)


def find_drive_file(drive_service, folder_id, file_name):
    query = FILE_SEARCH_QUERY.format(folder_id=folder_id, file_name=file_name.replace("'", "\\'"))
    response = drive_service.files().list(
        q=query, fields='files(id, name, mimeType)',
        supportsAllDrives=True, includeItemsFromAllDrives=True).execute()
    matching_files = response.get('files', [])
    if not matching_files:
        raise RuntimeError(f"Drive file '{file_name}' was not found - make sure the folder "
                           'is shared with the service account email.')
    return matching_files[0]


def download_drive_file_as_bytes(drive_service, drive_file):
    if drive_file['mimeType'] == GOOGLE_SHEETS_MIME_TYPE:
        request = drive_service.files().export_media(fileId=drive_file['id'], mimeType=XLSX_MIME_TYPE)
    else:
        request = drive_service.files().get_media(fileId=drive_file['id'], supportsAllDrives=True)
    file_buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(file_buffer, request)
    download_finished = False
    while not download_finished:
        _, download_finished = downloader.next_chunk()
    file_buffer.seek(0)
    return file_buffer


def clean_text_value(value):
    if not isinstance(value, str):
        return value
    collapsed = re.sub(r'[ \t]+', ' ', value)
    return re.sub(r' ?\n ?', '\n', collapsed).strip()


def clean_frame_whitespace(frame):
    return frame.apply(
        lambda column: column.map(clean_text_value) if column.dtype == object else column)


def fetch_google_drive_xlsx(url, params, api_spec):
    drive_service = create_drive_service()
    drive_file = find_drive_file(drive_service, api_spec['folder_id'], api_spec['file_name'])
    frame = pd.read_excel(download_drive_file_as_bytes(drive_service, drive_file), sheet_name=0)
    return {'frame': clean_frame_whitespace(frame), 'payload': None}
