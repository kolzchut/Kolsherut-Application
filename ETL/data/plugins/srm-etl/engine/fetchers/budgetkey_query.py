import pandas as pd

from srm_tools.budgetkey import fetch_from_budgetkey


def fetch_budgetkey(url, params, api_spec):
    rows = list(fetch_from_budgetkey(api_spec['query']))
    return {'frame': pd.DataFrame(rows), 'payload': None}
