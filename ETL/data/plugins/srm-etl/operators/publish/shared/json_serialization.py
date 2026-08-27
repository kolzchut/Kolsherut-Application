"""JSON `default=` serializer for the pipeline's non-JSON types."""
from datetime import date, datetime
from decimal import Decimal


def pipeline_json_default(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (set, tuple)):
        return list(value)
    return str(value)
