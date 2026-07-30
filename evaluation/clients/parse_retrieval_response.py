from evaluation import vars
from evaluation.schemas import ServiceScores
from evaluation.scraper.normalize_service_name import normalize_and_dedupe, normalize_service_name

SERVICES_FIELD = 'services'
SERVICE_NAME_FIELD = 'service_name'


def build_service_scores(service_entry: dict) -> ServiceScores:
    """Read the five optional score fields off one `services[]` entry.

    An absent field stays None: `dict.get` with no default, never `or 0.0` and never `float()`
    on a possibly-missing key. A retriever that never surfaced a document did not score it
    zero, and retrieval marks that with null - the same distinction attach_retriever_scores
    makes on the retrieval side, and it has to survive all the way to the CSV.
    """
    return ServiceScores(
        retrieval_score=service_entry.get(vars.SERVICE_SCORE_RETRIEVAL_KEY),
        cosine_score=service_entry.get(vars.SERVICE_SCORE_COSINE_KEY),
        cosine_score_ratio=service_entry.get(vars.SERVICE_SCORE_COSINE_RATIO_KEY),
        lexical_score=service_entry.get(vars.SERVICE_SCORE_LEXICAL_KEY),
        semantic_score=service_entry.get(vars.SERVICE_SCORE_SEMANTIC_KEY),
    )


def build_service_score_map(service_entries: list[dict]) -> dict[str, ServiceScores]:
    """Map normalized service name to its scores, so it joins to the ranked-name list.

    Keyed on the normalized name rather than the raw one: the ranked names are normalized, so
    a raw-keyed map would silently miss every name that needed normalizing. Keeps the FIRST
    entry per name - the same one normalize_and_dedupe keeps - so the scores attached to a name
    are the ones the document that won it earned, not a later duplicate's.
    """
    score_map: dict[str, ServiceScores] = {}
    for service_entry in service_entries:
        service_name = normalize_service_name(service_entry.get(SERVICE_NAME_FIELD) or '')
        if service_name and service_name not in score_map:
            score_map[service_name] = build_service_scores(service_entry)
    return score_map


def parse_retrieval_response(payload: dict) -> tuple[list[str], dict[str, ServiceScores]]:
    """Split one retrieve response into its ranked service names and their scores.

    Both come from `services` rather than `documents`: it is the same name-collapsed,
    rank-ordered shape the FE renders, which is what the scraped ground truth is made of.
    """
    service_entries = payload.get(SERVICES_FIELD, [])
    raw_names = [service_entry.get(SERVICE_NAME_FIELD) or '' for service_entry in service_entries]
    return list(normalize_and_dedupe(raw_names)), build_service_score_map(service_entries)
