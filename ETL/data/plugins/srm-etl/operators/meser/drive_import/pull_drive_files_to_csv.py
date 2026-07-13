from operators.meser.drive_import.convert_xlsx_to_csv_files import convert_xlsx_to_csv_files
from operators.meser.drive_import.create_drive_service import create_drive_service
from operators.meser.drive_import.download_drive_file import download_drive_file_as_bytes
from operators.meser.drive_import.find_drive_file_by_name import find_drive_file_by_name
from operators.meser.drive_import.values import GOOGLE_DRIVE_FILE_NAMES, OUTPUT_DIRECTORY_PATH
from srm_tools.logger import logger


def pull_single_drive_file_to_csv(drive_service, file_name):
    drive_file = find_drive_file_by_name(drive_service, file_name)
    if drive_file is None:
        logger.warn(f"File '{file_name}' was not found in the Drive folder. "
                    'Make sure the folder is shared with the service account email.')
        return []
    logger.info(f"Downloading '{file_name}' from Google Drive...")
    xlsx_buffer = download_drive_file_as_bytes(drive_service, drive_file)
    return convert_xlsx_to_csv_files(xlsx_buffer, file_name, OUTPUT_DIRECTORY_PATH)


def pull_drive_files_to_csv():
    logger.info('Starting Google Drive xlsx import...')
    drive_service = create_drive_service()
    for file_name in GOOGLE_DRIVE_FILE_NAMES:
        written_csv_paths = pull_single_drive_file_to_csv(drive_service, file_name)
        for csv_path in written_csv_paths:
            logger.info(f'Wrote CSV file: {csv_path}')
    logger.info('Finished Google Drive xlsx import.')


if __name__ == '__main__':
    pull_drive_files_to_csv()
