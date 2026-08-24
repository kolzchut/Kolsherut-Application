from conf import settings
from engine.settings_resolver import resolve_settings_name
from extract import extract_data_from_airtable


def fetch_airtable_table(url, params, api_spec):
    frame = extract_data_from_airtable.load_airtable_as_dataframe(
        table_name=api_spec['table'],
        base_id=resolve_settings_name(api_spec['base']),
        view=settings.AIRTABLE_VIEW,
        api_key=settings.AIRTABLE_API_KEY,
    )
    return {'frame': frame, 'payload': None}
