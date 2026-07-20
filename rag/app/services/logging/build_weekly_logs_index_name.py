from datetime import datetime, timezone

from app.vars import RAG_LOGS_INDEX_NAME


def build_weekly_logs_index_name() -> str:
    iso_calendar = datetime.now(timezone.utc).isocalendar()
    return f'{RAG_LOGS_INDEX_NAME}_{iso_calendar.week}_{iso_calendar.year}'
