import hashlib
import json

from evaluation import relevance_prompt_strings, relevance_vars
from evaluation.relevance.read_judge_input_provenance import read_judge_input_provenance
from evaluation.schemas import ServiceJudgement


def build_judgement_cache_key(query: str, service_name: str) -> str:
    """Cache identity of a verdict: the query and the service name, and nothing else.

    Never rank and never side. Both change with retrieval configuration - a threshold sweep
    reorders and re-partitions every pair - while the verdict for a (query, service) pair does
    not, so keying on either would throw away reusable verdicts on every operating point.
    """
    separator = relevance_vars.JUDGEMENT_CACHE_KEY_SEPARATOR
    return f'{query}{separator}{service_name}'


def compute_prompt_checksum() -> str:
    """Checksum of the judge system prompt, so any prompt edit invalidates cached verdicts."""
    digest = hashlib.sha256(
        relevance_prompt_strings.JUDGE_SYSTEM_PROMPT.encode('utf-8')).hexdigest()
    return f'{relevance_vars.CHECKSUM_PREFIX}{digest}'


def serialize_judgement(judgement: ServiceJudgement) -> tuple[str, dict]:
    """One cache entry: the canonical verdict under its cache key, and nothing else.

    The judge returns no reason as of schema v3, so there is no free text left to store. The entry
    stays an object rather than collapsing to a bare verdict string so a later field is an addition
    rather than a second shape change.
    """
    entry = {relevance_vars.JUDGEMENT_VERDICT_KEY: judgement.verdict}
    return build_judgement_cache_key(judgement.query, judgement.service_name), entry


def is_cache_valid(payload: dict, prompt_checksum: str) -> bool:
    return (payload.get(relevance_vars.JUDGEMENT_CACHE_MODEL_KEY) == relevance_vars.JUDGE_MODEL
            and payload.get(relevance_vars.JUDGEMENT_CACHE_PROMPT_CHECKSUM_KEY) == prompt_checksum
            and payload.get(relevance_vars.JUDGEMENT_CACHE_SCHEMA_VERSION_KEY)
            == relevance_vars.JUDGEMENT_SCHEMA_VERSION)


def load_judgement_cache() -> dict[str, dict] | None:
    """Verdict entries keyed by build_judgement_cache_key, or None when missing or stale.

    Stale means a different judge model, an edited prompt, or a bumped schema version - each of
    which makes previously cached verdicts incomparable rather than merely old. A payload written
    before the input hashes were recorded carries the older schema version, so it is discarded
    here rather than read as if it named the dataset it came from.
    """
    if not relevance_vars.JUDGEMENT_CACHE_PATH.exists():
        return None
    payload = json.loads(relevance_vars.JUDGEMENT_CACHE_PATH.read_text(encoding='utf-8'))
    if not is_cache_valid(payload, compute_prompt_checksum()):
        return None
    return payload[relevance_vars.JUDGEMENT_CACHE_JUDGEMENTS_KEY]


def save_judgement_cache(judgements: list[ServiceJudgement]) -> None:
    """The committed labels, written next to the identity of the bytes they were produced from.

    The frozen inputs' two SHA-256 hashes are copied in from judge_input_manifest.json because a
    retrieval configuration provably does not reproduce a pair set - the same .env against the same
    Elasticsearch returned different document sets - so only file content identifies the dataset.
    """
    payload = {
        relevance_vars.JUDGEMENT_CACHE_MODEL_KEY: relevance_vars.JUDGE_MODEL,
        relevance_vars.JUDGEMENT_CACHE_PROMPT_CHECKSUM_KEY: compute_prompt_checksum(),
        relevance_vars.JUDGEMENT_CACHE_SCHEMA_VERSION_KEY: relevance_vars.JUDGEMENT_SCHEMA_VERSION,
        **read_judge_input_provenance(),
        relevance_vars.JUDGEMENT_CACHE_JUDGEMENTS_KEY: dict(
            serialize_judgement(judgement) for judgement in judgements),
    }
    relevance_vars.JUDGEMENT_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    relevance_vars.JUDGEMENT_CACHE_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
