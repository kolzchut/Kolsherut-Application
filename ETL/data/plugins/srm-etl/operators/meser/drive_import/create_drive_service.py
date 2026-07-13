import base64
import json

from google.oauth2 import service_account
from googleapiclient.discovery import build

from conf import settings

GOOGLE_DRIVE_API_NAME = 'drive'
GOOGLE_DRIVE_API_VERSION = 'v3'
GOOGLE_DRIVE_READONLY_SCOPES = ['https://www.googleapis.com/auth/drive.readonly']


def decode_service_account_info(service_account_json_base64):
    decoded_json = base64.b64decode(service_account_json_base64).decode('utf-8')
    return json.loads(decoded_json)


def create_drive_service():
    service_account_json_base64 = settings.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
    if not service_account_json_base64:
        raise ValueError('ETL_GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is not set. '
                         'Set it to the base64 of the Google service account JSON key.')

    credentials = service_account.Credentials.from_service_account_info(
        decode_service_account_info(service_account_json_base64),
        scopes=GOOGLE_DRIVE_READONLY_SCOPES,
    )
    return build(
        GOOGLE_DRIVE_API_NAME,
        GOOGLE_DRIVE_API_VERSION,
        credentials=credentials,
        cache_discovery=False,
    )
