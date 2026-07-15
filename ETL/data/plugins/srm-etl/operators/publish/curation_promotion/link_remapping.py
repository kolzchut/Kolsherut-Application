"""Cross-base record-link remapping (legacy filter_by_items + conversion loaders).

Link lists are remapped in place: mapped ids are replaced by their main-base
record ids, unmapped ids are silently dropped - exactly like the legacy code.
"""
from ..airtable.airtable_client import RECORD_ID_FIELD, list_table_rows


def remap_link_items(row, mapping, field_names):
    """Replica of legacy filter_by_items output: the first non-empty field among
    field_names gets its mapped values (original order kept, unmapped silently
    dropped). Pure: returns a new row."""
    remapped_field = None
    items = None
    for field_name in field_names:
        if not items:
            remapped_field = field_name
            items = row.get(field_name)
    if not items:
        return dict(row)
    return {**row, remapped_field: [mapping[item] for item in items if item in mapping]}


def load_logical_to_record_id(base_id, table_name, require_id=False):
    """Logical id -> Airtable record id for a main-base table; first occurrence wins."""
    mapping = {}
    for row in list_table_rows(base_id, table_name):
        if require_id and row.get('id') is None:
            continue
        mapping.setdefault(row['id'], row[RECORD_ID_FIELD])
    return mapping


def convert_to_main_record_ids(updated_mapping, logical_to_record_id):
    """curation record id -> logical id becomes curation record id -> main-base record id."""
    return {
        curation_record_id: logical_to_record_id.get(logical_id)
        for curation_record_id, logical_id in updated_mapping.items()
    }


def build_fetched_row(row, table_fields):
    """Replica of legacy fetch_mapper: {id, data} with every table field defaulted."""
    data = {
        name: value for name, value in row.items()
        if name not in ('id', RECORD_ID_FIELD, 'source', 'status')
    }
    for field_name in table_fields:
        data.setdefault(field_name, None)
    return {'id': row['id'], 'data': data}
