import pandas as pd

from transformers.guidestar_client import get_guidestar_client


def fetch_guidestar_organizations(url, params, api_spec):
    client = get_guidestar_client()
    records = [{'id': organization['id']} for organization in client.organizations()]
    return {'frame': pd.DataFrame(records), 'payload': None}
