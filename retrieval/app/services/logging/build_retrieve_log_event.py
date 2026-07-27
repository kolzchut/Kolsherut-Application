from datetime import datetime, timezone

from app.strings import PIPELINE_STEP_SCORE_CUT

FUSED_COUNT_KEY = 'fused_count'


def read_fused_document_count(steps: list[dict]) -> int | None:
    """Pull the pre-truncation pool size out of the score cut step.

    Logged alongside num_documents so the returned-count distribution can be compared
    against the candidate pool depth straight from the weekly logs index.
    """
    for step in steps:
        if step['step'] == PIPELINE_STEP_SCORE_CUT:
            return step['input'].get(FUSED_COUNT_KEY)
    return None


def build_retrieve_log_event(
    log_id: str,
    query: str,
    retrieved_documents: list[dict],
    latency_ms: float,
    steps: list[dict],
) -> dict:
    return {
        'log_id': log_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'query': query,
        'retrieved_service_ids': [document['service_id'] for document in retrieved_documents],
        'num_documents': len(retrieved_documents),
        'num_fused_documents': read_fused_document_count(steps),
        'latency_ms': latency_ms,
        'steps': steps,
        'timings_ms': {step['step']: step['duration_ms'] for step in steps},
    }
