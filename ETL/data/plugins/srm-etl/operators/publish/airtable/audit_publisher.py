"""Push the run's collected Airtable writes to the audit GitHub repository.

One commit per publish run, laid out as
runs/<UTC timestamp>/<base label>/<table>/<operation>.json. A no-op when
AUDIT_REPO_FULL_NAME is not configured. Errors propagate - the pipeline
orchestrator treats the push as best-effort (log and continue).
"""
import json
from datetime import datetime, timezone

from conf import settings
from srm_tools.logger import logger

from ..shared.github_commit_push import push_files_as_single_commit
from ..shared.json_serialization import pipeline_json_default
from .audit_collector import collected_writes_snapshot

RUN_FOLDER_PREFIX = 'runs'
RUN_TIMESTAMP_FORMAT = '%Y%m%d-%H%M%S'
AUDIT_FILE_INDENT = 2
MAIN_BASE_LABEL = 'main'
DATA_IMPORT_BASE_LABEL = 'data-import'


def audit_base_labels():
    return {
        settings.AIRTABLE_BASE: MAIN_BASE_LABEL,
        settings.AIRTABLE_DATA_IMPORT_BASE: DATA_IMPORT_BASE_LABEL,
    }


def group_records_by_file_path(writes, run_folder):
    grouped = {}
    base_labels = audit_base_labels()
    for write in writes:
        base_label = base_labels.get(write['base_id'], write['base_id'])
        file_path = f"{run_folder}/{base_label}/{write['table_name']}/{write['operation']}.json"
        grouped.setdefault(file_path, []).extend(write['records'])
    return grouped


def build_commit_message(writes, run_timestamp):
    record_counts = {}
    for write in writes:
        write_key = f"{write['table_name']}/{write['operation']}"
        record_counts[write_key] = record_counts.get(write_key, 0) + len(write['records'])
    counts_text = ', '.join(f'{write_key}: {count}' for write_key, count in sorted(record_counts.items()))
    return f'Publish run {run_timestamp} -- {counts_text}'


def push_collected_audit_to_repository():
    if not settings.AUDIT_REPO_FULL_NAME:
        logger.info('Audit repository not configured (AUDIT_REPO_FULL_NAME unset); skipping the audit push')
        return
    writes = collected_writes_snapshot()
    if not writes:
        logger.info('No Airtable writes were collected this run; skipping the audit push')
        return
    run_timestamp = datetime.now(timezone.utc).strftime(RUN_TIMESTAMP_FORMAT)
    run_folder = f'{RUN_FOLDER_PREFIX}/{run_timestamp}'
    files_by_path = {
        file_path: json.dumps(records, ensure_ascii=False, indent=AUDIT_FILE_INDENT, default=pipeline_json_default)
        for file_path, records in group_records_by_file_path(writes, run_folder).items()
    }
    commit_sha = push_files_as_single_commit(
        settings.AUDIT_REPO_FULL_NAME, settings.AUDIT_REPO_BRANCH, settings.AUDIT_REPO_TOKEN,
        files_by_path, build_commit_message(writes, run_timestamp),
    )
    logger.info('Audit push done: %d files committed under %s (%s)', len(files_by_path), run_folder, commit_sha)
