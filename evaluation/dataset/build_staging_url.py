from urllib.parse import urlsplit, urlunsplit

from evaluation import vars


def build_staging_url(golden_set_url: str) -> str:
    """Point a production golden-set URL at staging, keeping path and query verbatim."""
    staging = urlsplit(vars.STAGING_BASE_URL)
    original = urlsplit(golden_set_url)
    return urlunsplit((staging.scheme, staging.netloc, original.path, original.query, ''))
