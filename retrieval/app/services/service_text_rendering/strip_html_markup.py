import html
import re

HTML_TAG_PATTERN = re.compile(r'<[^>]+>')
HTML_TAG_REPLACEMENT = ' '


def strip_html_markup(value):
    """Turn layout markup in a source field into plain prose.

    The srm_services 'details' field carries <br/>, <li>, <p>, <b>, <ul> and HTML entities on 939 of
    11,748 services. Those tags are noise tokens to the embedding model and are also indexed by the
    hebrew_icu analyzer, so they pollute BM25 too. Non-string values pass through untouched, matching
    format_field_value's tolerance of mixed source types.
    """
    if not isinstance(value, str):
        return value
    return html.unescape(HTML_TAG_PATTERN.sub(HTML_TAG_REPLACEMENT, value))
