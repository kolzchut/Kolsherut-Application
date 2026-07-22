import csv

from evaluation import vars
from evaluation.schemas import Example
from evaluation.dataset.parse_example_slugs import split_slug_cell, bucket_slugs_by_branch


def build_example_from_row(row: list[str]) -> Example:
    query = row[vars.QUERY_COLUMN_INDEX].strip()
    slugs = split_slug_cell(row[vars.SLUGS_COLUMN_INDEX])
    response_slugs, situation_slugs = bucket_slugs_by_branch(slugs)
    return Example(query=query, response_slugs=response_slugs, situation_slugs=situation_slugs)


def is_usable_row(row: list[str]) -> bool:
    return len(row) > vars.SLUGS_COLUMN_INDEX and bool(row[vars.QUERY_COLUMN_INDEX].strip())


def load_dataset() -> list[Example]:
    """Read the dataset CSV (UTF-8, quoted multi-slug cells) into Example rows."""
    with open(vars.DATASET_PATH, encoding='utf-8', newline='') as dataset_file:
        rows = list(csv.reader(dataset_file))
    data_rows = rows[1:] if vars.DATASET_HAS_HEADER else rows
    return [build_example_from_row(row) for row in data_rows if is_usable_row(row)]
