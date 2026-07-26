import json

from evaluation import vars
from evaluation.schemas import Example, ScrapedPage


def serialize_entry(example: Example, scraped: ScrapedPage) -> dict:
    return {
        vars.GROUND_TRUTH_QUERY_KEY: example.query,
        vars.GROUND_TRUTH_URL_KEY: example.url,
        vars.GROUND_TRUTH_STAGING_URL_KEY: example.staging_url,
        vars.GROUND_TRUTH_SERVICE_NAMES_KEY: list(scraped.service_names),
        vars.GROUND_TRUTH_SKIP_REASON_KEY: scraped.skip_reason,
    }


def deserialize_entry(entry: dict) -> tuple[str, ScrapedPage]:
    scraped = ScrapedPage(
        service_names=tuple(entry[vars.GROUND_TRUTH_SERVICE_NAMES_KEY]),
        skip_reason=entry[vars.GROUND_TRUTH_SKIP_REASON_KEY],
    )
    return entry[vars.GROUND_TRUTH_QUERY_KEY], scraped


def is_cache_valid(payload: dict, source_checksum: str) -> bool:
    return (payload.get(vars.GROUND_TRUTH_SOURCE_CHECKSUM_KEY) == source_checksum
            and payload.get(vars.GROUND_TRUTH_BASE_URL_KEY) == vars.STAGING_BASE_URL)


def read_ground_truth(source_checksum: str) -> dict[str, ScrapedPage] | None:
    """Scraped pages keyed by query, or None when the cache is missing or stale."""
    if not vars.GROUND_TRUTH_PATH.exists():
        return None
    payload = json.loads(vars.GROUND_TRUTH_PATH.read_text(encoding='utf-8'))
    if not is_cache_valid(payload, source_checksum):
        return None
    return dict(deserialize_entry(entry) for entry in payload[vars.GROUND_TRUTH_ENTRIES_KEY])


def write_ground_truth(examples: list[Example], scraped_by_query: dict[str, ScrapedPage],
                       source_checksum: str) -> None:
    payload = {
        vars.GROUND_TRUTH_SOURCE_FILE_KEY: vars.DATASET_PATH.name,
        vars.GROUND_TRUTH_SOURCE_CHECKSUM_KEY: source_checksum,
        vars.GROUND_TRUTH_BASE_URL_KEY: vars.STAGING_BASE_URL,
        vars.GROUND_TRUTH_ENTRIES_KEY: [
            serialize_entry(example, scraped_by_query[example.query]) for example in examples],
    }
    vars.GROUND_TRUTH_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
