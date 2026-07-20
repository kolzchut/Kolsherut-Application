from datetime import datetime, timezone

from app.vars import LLM_MODEL_NAME


def build_ask_log_event(
    log_id: str,
    prompt: str,
    history: list[dict],
    answer: str,
    retrieved_documents: list[dict],
    latency_ms: float,
    steps: list[dict],
) -> dict:
    return {
        'log_id': log_id,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'model': LLM_MODEL_NAME,
        'prompt': prompt,
        'history': history,
        'answer': answer,
        'retrieved_card_ids': [document['card_id'] for document in retrieved_documents],
        'num_documents': len(retrieved_documents),
        'latency_ms': latency_ms,
        'steps': steps,
        'timings_ms': {step['step']: step['duration_ms'] for step in steps},
    }
