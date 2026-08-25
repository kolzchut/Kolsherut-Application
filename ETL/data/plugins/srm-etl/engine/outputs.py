from engine.settings_resolver import resolve_settings_name
from load.airtable import update_if_exists_if_not_create
from srm_tools.trigger_status_check import trigger_status_check
from srm_tools.logger import logger
from utilities.update import prepare_airtable_dataframe

AIRTABLE_KEY_COLUMN = 'id'
SOURCE_COLUMN = 'source'
STATUS_COLUMN = 'status'
ACTIVE_STATUS = 'ACTIVE'
INACTIVE_STATUS = 'INACTIVE'
LOAD_BATCH_SIZE = 50


def replace_missing_values_with_none(frame):
    # Heterogeneous row dicts leave float NaN behind, which Airtable's JSON encoder rejects.
    object_frame = frame.astype(object)
    return object_frame.where(object_frame.notna(), None)


def prepare_frame_for_load(frame, output_spec):
    prepared_frame = replace_missing_values_with_none(frame)
    if output_spec.get('set_source', True):
        prepared_frame[SOURCE_COLUMN] = output_spec.get('source_id', output_spec['name'])
    if output_spec.get('set_status', True):
        prepared_frame[STATUS_COLUMN] = ACTIVE_STATUS
    return prepare_airtable_dataframe(
        df=prepared_frame,
        key_field=AIRTABLE_KEY_COLUMN,
        fields_to_prepare=list(prepared_frame.columns),
        airtable_key=AIRTABLE_KEY_COLUMN,
    )


def sync_missing_rows_status(frame, output_spec, table_name, base_id):
    trigger_status_check(
        df=frame,
        table_name=table_name,
        base_id=base_id,
        airtable_key_field=AIRTABLE_KEY_COLUMN,
        active_value=ACTIVE_STATUS,
        inactive_value=INACTIVE_STATUS,
        only_from_source=output_spec.get('source_id', output_spec['name']),
        df_key_field=AIRTABLE_KEY_COLUMN,
        batch_size=LOAD_BATCH_SIZE,
    )


def load_output(frame, output_spec):
    """Load one output into Airtable; returns the failed-batch messages (empty on success)."""
    if 'table' not in output_spec:
        return []
    table_name = output_spec['table']
    base_id = resolve_settings_name(output_spec['base'])
    prepared_frame = prepare_frame_for_load(frame, output_spec)
    logger.info(f'Loading output "{output_spec["name"]}" into {table_name} ({len(prepared_frame)} rows)')
    if output_spec.get('manage_status'):
        sync_missing_rows_status(prepared_frame, output_spec, table_name, base_id)
    batch_errors = []
    update_if_exists_if_not_create(
        prepared_frame,
        table_name,
        base_id,
        airtable_key=AIRTABLE_KEY_COLUMN,
        batch_size=LOAD_BATCH_SIZE,
        fields_to_update=output_spec.get('fields_to_update'),
        batch_errors=batch_errors,
    )
    return [f'{output_spec["name"]}: {error}' for error in batch_errors]
