from datetime import datetime, timezone
from typing import Optional

from app.services.elasticsearch.elasticsearch_client import get_elasticsearch_client


def update_ask_log_rating(
    log_index: str,
    log_id: str,
    rating: int,
    description: Optional[str],
) -> None:
    get_elasticsearch_client().update(
        index=log_index,
        id=log_id,
        doc={
            'rating': rating,
            'rating_description': description,
            'rated_at': datetime.now(timezone.utc).isoformat(),
        },
        doc_as_upsert=True,
    )
