import json

from evaluation import vars
from evaluation.report.serialize_service_details import (
    deserialize_service_details, serialize_service_details,
)
from evaluation.schemas import ServiceDetails

# Payload keys. `found` is stored per entry so a name the BE could not resolve is remembered as
# ASKED-AND-ABSENT rather than as never asked: without it every run would re-ask the backend the
# same few hundred unanswerable questions and get the same silence.
CACHE_BASE_URL_KEY = 'base_url'
CACHE_ENTRIES_KEY = 'entries'
CACHE_ENTRY_FOUND_KEY = 'found'


def is_cache_valid(payload: dict) -> bool:
    """Content looked up from another backend describes another dataset's services."""
    return payload.get(CACHE_BASE_URL_KEY) == vars.BACKEND_BASE_URL


def deserialize_entry(entry: dict) -> ServiceDetails | None:
    """None for a name the backend had no exact match for, which is not the same as a match
    that carried no description - see serialize_service_details for why the two stay apart."""
    if not entry.get(CACHE_ENTRY_FOUND_KEY):
        return None
    return deserialize_service_details(entry)


def read_service_details_cache() -> dict[str, ServiceDetails | None]:
    """Everything already looked up, keyed by normalized service name.

    An empty dict when the file is missing or was built against another backend: the caller then
    looks every name up again, which is slow but correct, rather than reading stale content.
    """
    if not vars.SERVICE_DETAILS_CACHE_PATH.exists():
        return {}
    payload = json.loads(vars.SERVICE_DETAILS_CACHE_PATH.read_text(encoding='utf-8'))
    if not is_cache_valid(payload):
        return {}
    return {name: deserialize_entry(entry)
            for name, entry in payload[CACHE_ENTRIES_KEY].items()}


def serialize_entry(details: ServiceDetails | None) -> dict:
    if details is None:
        return {CACHE_ENTRY_FOUND_KEY: False}
    return {CACHE_ENTRY_FOUND_KEY: True, **serialize_service_details(details)}


def write_service_details_cache(details_by_name: dict[str, ServiceDetails | None]) -> None:
    """Sorted by name, so re-running produces a stable diff instead of a reshuffled file."""
    payload = {
        CACHE_BASE_URL_KEY: vars.BACKEND_BASE_URL,
        CACHE_ENTRIES_KEY: {name: serialize_entry(details_by_name[name])
                            for name in sorted(details_by_name)},
    }
    vars.SERVICE_DETAILS_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    vars.SERVICE_DETAILS_CACHE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
