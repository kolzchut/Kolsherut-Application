from evaluation import vars
from evaluation.scraper.normalize_service_name import normalize_service_name


def select_exact_service_match(service_entries: list[dict], service_name: str) -> dict | None:
    """The one returned service whose name IS the name asked for, or None.

    The BE matches `service_name` as analyzed text with `operator: and`, so it answers with every
    service whose name contains all the query's tokens - a name is routinely returned alongside
    longer names that merely contain it. Picking the top hit would therefore attach a neighbour's
    description to the row. Only an exact match on the normalized name is accepted, using the same
    normalizer the scraped ground truth and the retrieval names went through, so the comparison is
    between two names in one form. No match leaves the row's content cells blank, which is the
    honest answer: nothing was found, rather than something close was found.
    """
    for service_entry in service_entries:
        candidate = normalize_service_name(service_entry.get(vars.SERVICE_NAME_FIELD) or '')
        if candidate == service_name:
            return service_entry
    return None
