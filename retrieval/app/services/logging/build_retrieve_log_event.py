from datetime import datetime, timezone


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
        'latency_ms': latency_ms,
        'steps': steps,
        'timings_ms': {step['step']: step['duration_ms'] for step in steps},
    }
