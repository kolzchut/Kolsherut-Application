"""Serialize in-memory rows into JSON-safe Elasticsearch documents."""
from datetime import date, datetime
from decimal import Decimal


def serialize_value(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, dict):
        return {key: serialize_value(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [serialize_value(item) for item in value]
    return value


def serialize_document(row):
    return {key: serialize_value(value) for key, value in row.items()}
