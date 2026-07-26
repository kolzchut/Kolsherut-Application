import csv
import hashlib
import io

from evaluation import vars

CSV_ENCODING = 'utf-8-sig'


def compute_source_checksum(raw_bytes: bytes) -> str:
    return vars.CHECKSUM_PREFIX + hashlib.sha256(raw_bytes).hexdigest()


def is_usable_row(row: list[str]) -> bool:
    return len(row) > vars.URL_COLUMN_INDEX and bool(row[vars.QUERY_COLUMN_INDEX].strip())


def parse_rows(raw_text: str) -> list[tuple[str, str]]:
    rows = list(csv.reader(io.StringIO(raw_text)))
    data_rows = rows[1:] if vars.DATASET_HAS_HEADER else rows
    return [(row[vars.QUERY_COLUMN_INDEX].strip(), row[vars.URL_COLUMN_INDEX].strip())
            for row in data_rows if is_usable_row(row)]


def read_golden_set_rows() -> tuple[list[tuple[str, str]], str]:
    """The raw golden set as (query, url) pairs, plus a checksum of the file it came from."""
    raw_bytes = vars.DATASET_PATH.read_bytes()
    raw_text = raw_bytes.decode(CSV_ENCODING)
    return parse_rows(raw_text), compute_source_checksum(raw_bytes)
