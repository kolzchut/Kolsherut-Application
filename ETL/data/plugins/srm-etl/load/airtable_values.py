from typing import Any, List

import pandas as pd

EMPTY_AIRTABLE_VALUES = (None, '', 0, 'None')


def is_missing_airtable_value(value: Any) -> bool:
    """True for None and float NaN — values Airtable's JSON encoder cannot take."""
    return value is None or (isinstance(value, float) and pd.isna(value))


def is_empty_airtable_value(value: Any) -> bool:
    """True for values that must not be sent on update (missing values and empty markers)."""
    if is_missing_airtable_value(value):
        return True
    if isinstance(value, (list, dict)):
        return False
    return value in EMPTY_AIRTABLE_VALUES


def raise_if_batches_failed(batch_errors: List[str], operation_name: str) -> None:
    """Fail loudly once all batches ran, so the run is not reported as successful."""
    if batch_errors:
        raise RuntimeError(
            f'{len(batch_errors)} Airtable {operation_name} batch(es) failed; first error: {batch_errors[0]}'
        )
