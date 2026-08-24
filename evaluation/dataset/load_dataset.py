from evaluation.schemas import Example
from evaluation.dataset.build_staging_url import build_staging_url
from evaluation.dataset.read_golden_set_rows import read_golden_set_rows


def build_example(query: str, url: str) -> Example:
    return Example(query=query, url=url, staging_url=build_staging_url(url))


def load_dataset() -> tuple[list[Example], str]:
    """The golden set as Examples, plus a checksum of the CSV they came from."""
    rows, source_checksum = read_golden_set_rows()
    return [build_example(query, url) for query, url in rows], source_checksum
