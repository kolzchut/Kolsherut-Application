"""Optional debugging dumps of the in-memory pipeline intermediates.

Disabled by default; enabled by the --dump-dir CLI flag, threaded explicitly
through the pipeline (no module state). Dumping is a debug feature, not
pipeline plumbing - no stage reads these files back.
"""
import json
import os
from datetime import date, datetime
from decimal import Decimal

from srm_tools.logger import logger


def _json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (set, tuple)):
        return list(value)
    return str(value)


def dump_stage_output(dump_directory, stage_name, payload):
    if not dump_directory:
        return
    os.makedirs(dump_directory, exist_ok=True)
    dump_path = os.path.join(dump_directory, f'{stage_name}.json')
    with open(dump_path, 'w', encoding='utf-8') as dump_file:
        json.dump(payload, dump_file, ensure_ascii=False, indent=2, default=_json_default)
    logger.info('Dumped %s to %s', stage_name, dump_path)
