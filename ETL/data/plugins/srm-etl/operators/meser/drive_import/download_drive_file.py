import io

from googleapiclient.http import MediaIoBaseDownload

GOOGLE_SHEETS_MIME_TYPE = 'application/vnd.google-apps.spreadsheet'
XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def create_download_request(drive_service, drive_file):
    if drive_file['mimeType'] == GOOGLE_SHEETS_MIME_TYPE:
        return drive_service.files().export_media(
            fileId=drive_file['id'],
            mimeType=XLSX_MIME_TYPE,
        )
    return drive_service.files().get_media(
        fileId=drive_file['id'],
        supportsAllDrives=True,
    )


def download_drive_file_as_bytes(drive_service, drive_file):
    request = create_download_request(drive_service, drive_file)
    xlsx_buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(xlsx_buffer, request)
    download_finished = False
    while not download_finished:
        _, download_finished = downloader.next_chunk()
    xlsx_buffer.seek(0)
    return xlsx_buffer
