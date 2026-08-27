"""In-memory log of every Airtable write of the current publish run.

Mirrors stats_collector: airtable_client records each outgoing batch here (the
exact request payloads), and the pipeline pushes everything once, at the end of
the run, to the audit repository (see audit_publisher). State lives in the
module-level list; reset_collected_audit is called at pipeline start.
"""

collected_writes = []


def reset_collected_audit():
    collected_writes.clear()


def record_airtable_write(base_id, table_name, operation, records):
    """Called by airtable_client just before every batch_update/batch_create."""
    if not records:
        return
    collected_writes.append({
        'base_id': base_id,
        'table_name': table_name,
        'operation': operation,
        'records': [dict(record) for record in records],
    })


def collected_writes_snapshot():
    return list(collected_writes)
