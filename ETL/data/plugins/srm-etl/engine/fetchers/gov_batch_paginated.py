import time

import pandas as pd

from srm_tools.gov import get_gov_api

BATCH_DELAY_SECONDS = 2


def fetch_gov_batch(url, params, api_spec):
    total, batch = get_gov_api(url, 0)
    records = list(batch)
    while len(records) < total:
        # Delay between batches to avoid triggering the gov.il rate limit
        time.sleep(BATCH_DELAY_SECONDS)
        _, batch = get_gov_api(url, len(records))
        records.extend(batch)
    return {'frame': pd.DataFrame(records), 'payload': None}
