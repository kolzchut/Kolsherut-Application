import os
import sys
from pathlib import Path

SRM_ETL_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(SRM_ETL_ROOT))

# Dummy values so conf.settings imports offline; a real .env (if present) takes precedence.
TEST_ENVIRONMENT_DEFAULTS = {
    'ETL_GUIDESTAR_USERNAME': 'test-user',
    'ETL_GUIDESTAR_PASSWORD': 'test-password',
    'ETL_GOVMAP_API_KEY': 'test-key',
    'ETL_AIRTABLE_BASE': 'appTestBase',
    'ETL_AIRTABLE_STAGING_BASE': 'appTestStaging',
    'ETL_AIRTABLE_ALTERNATE_BASE': 'appTestAlternate',
    'ETL_AIRTABLE_DATAENTRY_BASE': 'appTestDataEntry',
    'ETL_AIRTABLE_DATA_IMPORT_BASE': 'appTestDataImport',
    'DATAFLOWS_AIRTABLE_APIKEY': 'test-apikey',
    'ETL_GOOGLE_MAPS_API_KEY': 'test-maps-key',
    'ENV_NAME': 'test',
    'ES_HOST': 'localhost',
    'ES_PORT': '9200',
    'EMAIL_NOTIFIER_SENDER_EMAIL': 'test@example.com',
    'EMAIL_NOTIFIER_PASSWORD': 'test-password',
    'EMAIL_NOTIFIER_RECIPIENT_LIST': 'test@example.com',
}

for variable_name, default_value in TEST_ENVIRONMENT_DEFAULTS.items():
    os.environ.setdefault(variable_name, default_value)
