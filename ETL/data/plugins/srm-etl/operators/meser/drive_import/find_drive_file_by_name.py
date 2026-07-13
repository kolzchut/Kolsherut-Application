from operators.meser.drive_import.values import GOOGLE_DRIVE_FOLDER_ID

DRIVE_FILE_SEARCH_QUERY_TEMPLATE = "'{folder_id}' in parents and name = '{file_name}' and trashed = false"
DRIVE_FILE_LIST_FIELDS = 'files(id, name, mimeType)'


def find_drive_file_by_name(drive_service, file_name):
    query = DRIVE_FILE_SEARCH_QUERY_TEMPLATE.format(
        folder_id=GOOGLE_DRIVE_FOLDER_ID,
        file_name=file_name.replace("'", "\\'"),
    )
    response = drive_service.files().list(
        q=query,
        fields=DRIVE_FILE_LIST_FIELDS,
        supportsAllDrives=True,
        includeItemsFromAllDrives=True,
    ).execute()
    matching_files = response.get('files', [])
    return matching_files[0] if matching_files else None
